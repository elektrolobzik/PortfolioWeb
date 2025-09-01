"use client";
import { useEffect, useRef } from "react";

type Particle = {
  x: number; y: number;
  vx: number; vy: number;
  a: number; b: number;      // размеры «капсулы»
  rot: number;               // поворот формы
  curve: number;             // округлость
};

const hasFinePointer = () =>
  typeof window !== "undefined" && matchMedia("(pointer: fine)").matches;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t: number, s = 1.25) =>
  1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);

export default function CustomCursor() {
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rafId = useRef<number | null>(null);

  const mouse = useRef({
    x: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
    y: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
    visible: false,
  });
  const pos = useRef({ x: mouse.current.x, y: mouse.current.y });

  const particles = useRef<Particle[]>([]);

  // «сплющивание» основного круга
  const clickPulse = useRef<{
    start: number; duration: number; active: boolean;
    axis: number; amount: number; wobblePhase: number;
  }>({ start: 0, duration: 280, active: false, axis: 0, amount: 0.2, wobblePhase: 0 });

  // === НАСТРОЙКИ ===
  const CURSOR_RADIUS = 12;       // базовый радиус кружка
  const FOLLOW_LERP = 0.20;
  const GRAVITY = 0.12;           // гравитация (двигает вниз)
  const FRICTION = 0.96;          // небольшое трение
  const DROP_COUNT = 6;           // количество брызг
  const MIN_SPEED = 1.2;          // стартовая скорость (попрежнему умеренная)
  const MAX_SPEED = 2.4;

  // зона плавного исчезания у нижней границы
  const getBottomY = () => window.innerHeight;
  const FADE_ZONE = 90;           // px над нижним краем, где начинаем плавно гасить
  const KILL_MARGIN = 16;         // запас за нижним краем, чтобы гарантированно удалять

  useEffect(() => {
    if (!hasFinePointer()) return;

    const canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.inset = "0";
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "9999";
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;

    const resize = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    document.body.classList.add("cursor-enabled");

    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
      mouse.current.visible = true;
    };
    const onLeave = () => (mouse.current.visible = false);
    const onEnter = () => (mouse.current.visible = true);

    const onDown = () => {
      // запускаем «сплющивание» капли
      clickPulse.current = {
        start: performance.now(),
        duration: 280,
        active: true,
        axis: Math.random() * Math.PI,
        amount: 0.28 + Math.random() * 0.12,
        wobblePhase: Math.random() * Math.PI * 2,
      };

      // Брызги: старт С КРОМКИ кружка, летят наружу и падают до низа
      for (let i = 0; i < DROP_COUNT; i++) {
        const angle = Math.random() * Math.PI * 2;
        const startX = pos.current.x + Math.cos(angle) * CURSOR_RADIUS;
        const startY = pos.current.y + Math.sin(angle) * CURSOR_RADIUS;

        const speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
        const spread = (Math.random() - 0.5) * 0.35;
        const vx = Math.cos(angle + spread) * speed;
        const vy = Math.sin(angle + spread) * speed - 0.1; // небольшой «вверх», затем гравитация потянет вниз

        // форма «капсулы/боба»
        const base = 3 + Math.random() * 2.2;
        const a = base * (1.2 + Math.random() * 0.9);
        const b = base * (0.7 + Math.random() * 0.6);
        const curve = 0.25 + Math.random() * 0.35;
        const rot = Math.atan2(vy, vx) + (Math.random() - 0.5) * 0.35;

        particles.current.push({ x: startX, y: startY, vx, vy, a, b, rot, curve });
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("mouseenter", onEnter);
    window.addEventListener("mousedown", onDown);

    const drawBean = (ctx: CanvasRenderingContext2D, x: number, y: number, a: number, b: number, rot: number, curve: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);

      const left = -a * 0.5, right = a * 0.5, top = -b * 0.5, bottom = b * 0.5;

      ctx.beginPath();
      ctx.moveTo(left + a * 0.25, top);
      ctx.quadraticCurveTo(0, top - b * curve, right - a * 0.25, top);
      ctx.quadraticCurveTo(right + a * 0.25, 0, right - a * 0.25, bottom);
      ctx.quadraticCurveTo(0, bottom + b * (curve * 0.8), left + a * 0.25, bottom);
      ctx.quadraticCurveTo(left - a * 0.25, 0, left + a * 0.25, top);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const loop = () => {
      const ctx = ctxRef.current!;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // следование за мышью
      pos.current.x += (mouse.current.x - pos.current.x) * FOLLOW_LERP;
      pos.current.y += (mouse.current.y - pos.current.y) * FOLLOW_LERP;

      // обновление брызг: летят, тормозят, падают до низа; исчезают ТОЛЬКО у нижней границы и плавно
      const bottomY = getBottomY();
      particles.current = particles.current
        .map((p) => {
          p.vx *= FRICTION;
          p.vy = p.vy * FRICTION + GRAVITY;
          p.x += p.vx;
          p.y += p.vy;

          // лёгкое «усыхание» формы по пути (без сильного уменьшения)
          p.a *= 0.999;
          p.b *= 0.999;

          return p;
        })
        .filter((p) => p.y <= bottomY + KILL_MARGIN); // удаляем только чуть за границей

      // рисуем брызги
      for (const p of particles.current) {
        // ПОЛНОСТЬЮ НЕПРОЗРАЧНЫЕ в полёте, плавно исчезают в последние FADE_ZONE px
        const distToBottom = bottomY - p.y;
        const alpha = distToBottom <= FADE_ZONE ? clamp01(distToBottom / FADE_ZONE) : 1;

        ctx.globalAlpha = alpha;
        ctx.fillStyle = "#000";
        drawBean(ctx, p.x, p.y, p.a, p.b, p.rot, p.curve);
      }
      ctx.globalAlpha = 1;

      // деформация основного круга (хаотичное сплющивание)
      let radius = CURSOR_RADIUS;
      let scaleX = 1, scaleY = 1, rot = 0, wobbleAmp = 0;

      if (clickPulse.current.active) {
        const t = clamp01((performance.now() - clickPulse.current.start) / clickPulse.current.duration);
        const compress = 1 - easeOutCubic(Math.min(t * 1.2, 1));
        const release = easeOutBack(Math.max(t * 1.2 - 1, 0));
        const squash = clickPulse.current.amount * (compress * 0.9 - release * 0.6);

        rot = clickPulse.current.axis;
        scaleX = 1 + squash;
        scaleY = 1 - squash;

        wobbleAmp = (0.12 + Math.random() * 0.02) * (1 - t);
        if (t >= 1) clickPulse.current.active = false;
      }

      // основной «блоб»
      if (mouse.current.visible) {
        const N = 16;
        ctx.fillStyle = "#000";
        ctx.save();
        ctx.translate(pos.current.x, pos.current.y);
        ctx.rotate(rot);
        ctx.scale(scaleX, scaleY);

        ctx.beginPath();
        for (let i = 0; i <= N; i++) {
          const theta = (i / N) * Math.PI * 2;
          const r = radius * (1 + wobbleAmp * Math.sin(theta * 3 + clickPulse.current.wobblePhase));
          const px = r * Math.cos(theta);
          const py = r * Math.sin(theta);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      rafId.current = requestAnimationFrame(loop);
    };

    rafId.current = requestAnimationFrame(loop);

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("mouseenter", onEnter);
      window.removeEventListener("mousedown", onDown);
      document.body.classList.remove("cursor-enabled");
      canvas.remove();
    };
  }, []);

  return null;
}
