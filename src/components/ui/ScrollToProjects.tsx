"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Волновая шторка (CANVAS) — плавная, ровная, 1-в-1 с лоадером по параметрам.
 * Читает переменные:
 *   --loader-wave-duration: 1200ms;
 *   --loader-wave-amp: 160;               // px
 *   --loader-wave-lambda: 520;            // px
 *   --loader-wave-phase-speed: 420;       // px/s (течение по X)
 *   (опционально) --loader-wave-color: #0b0b0f;
 *
 * Если у лоадера есть нестандартная форма, можно определить window.__LOADER_WAVE_SHAPE__
 * (x, baseY, amp, lambda, t, phi) => number — тогда берём её вместо синуса.
 */

type Variant = "smooth" | "wave";

interface ScrollToProjectsProps {
  targetId?: string;
  variant?: Variant;
  label?: string;
  className?: string;
  color?: string;          // если не задано — возьмём из CSS var или #0b0b0f
  speedMultiplier?: number; // множитель длительности относительно лоадера ( >1 = медленнее )
}

declare global {
  interface Window {
    __LOADER_WAVE_SHAPE__?: (
      x: number, baseY: number, amp: number, lambda: number, t: number, phi: number
    ) => number;
  }
}

function readVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}
function numVar(name: string, fallback: number): number {
  const v = readVar(name, "");
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}
function msToNumber(v: string): number {
  const s = (v || "").trim();
  if (s.endsWith("ms")) return parseFloat(s);
  if (s.endsWith("s")) return parseFloat(s) * 1000;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 1200;
}
function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/** Корень под портал в body */
function usePortalRoot(id = "ui-wave-root") {
  const [root, setRoot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    let el = document.getElementById(id) as HTMLElement | null;
    if (!el) {
      el = document.createElement("div");
      el.id = id;
      document.body.appendChild(el);
    }
    setRoot(el);
  }, [id]);
  return root;
}

export default function ScrollToProjects({
  targetId = "portfolio",
  variant = "wave",
  label = "Смотреть проекты",
  className = "",
  color,
  speedMultiplier = 1.8, // медленнее лоадера по умолчанию
}: ScrollToProjectsProps) {
  const root = usePortalRoot();
  const [phase, setPhase] = useState<"idle" | "anim">("idle");
  const busyRef = useRef(false);

  // параметры от лоадера
  const params = useMemo(() => {
    const dur = msToNumber(readVar("--loader-wave-duration", "1200ms")) * speedMultiplier;
    const amp = numVar("--loader-wave-amp", 160);
    const lambda = numVar("--loader-wave-lambda", 520);
    const phaseSpeed = numVar("--loader-wave-phase-speed", 420); // px/s
    const col = color || readVar("--loader-wave-color", "#0b0b0f") || "#0b0b0f";
    return { dur, amp, lambda, phaseSpeed, col };
  }, [speedMultiplier, color]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // следим за DPR и размером
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const fit = () => {
      const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
      const w = window.innerWidth;
      const h = window.innerHeight;
      cvs.style.width = w + "px";
      cvs.style.height = h + "px";
      cvs.width = Math.floor(w * dpr);
      cvs.height = Math.floor(h * dpr);
      const ctx = cvs.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // 1 CSS px = 1 юнит
    };
    fit();
    const onR = () => fit();
    window.addEventListener("resize", onR, { passive: true });
    return () => window.removeEventListener("resize", onR);
  }, [phase]);

  const doScrollInstant = useCallback(() => {
    const el = document.getElementById(targetId);
    if (el) el.scrollIntoView({ behavior: "auto", block: "start" });
  }, [targetId]);

  // Основная анимация волны на canvas
  useEffect(() => {
    if (phase !== "anim") return;
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    const w = () => window.innerWidth;
    const h = () => window.innerHeight;

    const half = params.dur / 2;
    const shape = window.__LOADER_WAVE_SHAPE__ || ((x: number, baseY: number, amp: number, lambda: number, _t: number, phi: number) =>
      baseY + Math.sin(((x + phi) / lambda) * Math.PI * 2) * amp
    );
    const phiPerMs = params.phaseSpeed; // px/s → нам удобно в px/сек, преобразуем через dt

    // запретим скролл боди во время шторки
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    let raf = 0;
    let start = 0;
    let scrolled = false;

    const drawFrame = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;

      // фаза анимации 0..1 вниз, затем 1..0 вверх
      const goingDown = elapsed <= half;
      const local = goingDown ? elapsed : elapsed - half;
      const tNorm = Math.min(1, Math.max(0, local / half));
      const t = goingDown ? easeInOutCubic(tNorm) : 1 - easeInOutCubic(tNorm);

      // фазовый сдвиг (течение по X)
      const phi = (elapsed / 1000) * phiPerMs;

      // очистка и заливка фона
      ctx.clearRect(0, 0, w(), h());
      ctx.fillStyle = params.col;

      // строим путь волны и заполняем
      ctx.beginPath();

      const baseY = -params.amp + (h() + params.amp * 2) * t;

      // шаг дискретизации ~ каждые 8px (плотно и плавно), начинается левее экрана
      const step = 8;
      let x = -step * 2;
      const endX = w() + step * 2;

      // верхняя кромка волны
      const yStart = shape(x, baseY, params.amp, params.lambda, t, phi);
      ctx.moveTo(x, yStart);
      for (; x <= endX; x += step) {
        const y = shape(x, baseY, params.amp, params.lambda, t, phi);
        ctx.lineTo(x, y);
      }

      // замыкаем снизу
      ctx.lineTo(endX, h() + params.amp * 2);
      ctx.lineTo(-step * 2, h() + params.amp * 2);
      ctx.closePath();
      ctx.fill();

      // середина: делаем скролл, когда волна полностью закрыла верх (в конце первой половины)
      if (!scrolled && elapsed >= half - 16) {
        scrolled = true;
        doScrollInstant();
      }

      if (elapsed < params.dur) {
        raf = requestAnimationFrame(drawFrame);
      } else {
        // завершаем
        document.body.style.overflow = prevOverflow;
        setPhase("idle");
      }
    };

    raf = requestAnimationFrame(drawFrame);
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
    };
  }, [phase, params, doScrollInstant]);

  const handleClick = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;

    if (variant === "smooth") {
      const el = document.getElementById(targetId);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => (busyRef.current = false), 700);
      return;
    }

    setPhase("anim");
    setTimeout(() => (busyRef.current = false), params.dur + 100);
  }, [variant, targetId, params.dur]);

  // Базовый стиль кнопки — если нет своих
  useEffect(() => {
    const ID = "ui-scroll-btn-style";
    if (document.getElementById(ID)) return;
    const css = `
.ui-scroll-btn{display:inline-flex;align-items:center;gap:.6rem;padding:.9rem 1.2rem;border-radius:999px;border:1px solid rgba(255,255,255,0.18);background:linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.03));color:#fff;font-weight:600;letter-spacing:.3px;cursor:pointer;transition:transform .15s ease,border-color .2s ease,box-shadow .2s ease;box-shadow:0 6px 16px rgba(0,0,0,0.25)}
.ui-scroll-btn:hover{transform:translateY(-2px);border-color:rgba(255,255,255,0.35);box-shadow:0 10px 26px rgba(0,0,0,0.35)}
.ui-scroll-btn:active{transform:translateY(0)}
.ui-scroll-btn__dot{width:.55rem;height:.55rem;border-radius:50%;background:currentColor;opacity:.9;display:inline-block}
`.trim();
    const el = document.createElement("style");
    el.id = ID;
    el.appendChild(document.createTextNode(css));
    document.head.appendChild(el);
  }, []);

  return (
    <>
      <button type="button" onClick={handleClick} className={`ui-scroll-btn ${className}`.trim()}>
        <span className="ui-scroll-btn__dot" />
        {label}
      </button>

      {root && phase !== "idle" && createPortal(
        <canvas
          ref={canvasRef}
          style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", zIndex: 2147483647, pointerEvents: "none", display: "block" }}
          aria-hidden="true"
        />,
        root
      )}
    </>
  );
}
