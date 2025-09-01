"use client";
import { useEffect, useRef, useState } from "react";

type Props = {
  brand?: string;
  minDurationMs?: number;
  color?: string;
  opacity?: number;
};

export default function PreloaderWave({
  brand = "SoulSpace Studio",
  minDurationMs = 1700,     // подольше, чтобы «волну» рассмотреть
  color = "#0a0a0a",
  opacity = 1,
}: Props) {
  const [active, setActive] = useState(true);
  const [ready, setReady] = useState(false);

  // ---- runtime refs (без ререндеров) ----
  const raf = useRef<number | null>(null);
  const start = useRef<number | null>(null);
  const loaded = useRef(false);

  const wRef = useRef(0);
  const hRef = useRef(0);
  const yRef = useRef(0);
  const ampRef = useRef(26);     // ЧУТЬ БОЛЬШЕ амплитуда -> «волнистее»
  const freqRef = useRef(1.1);   // базовая частота
  const phaseRef = useRef(0);
  const xFlowRef = useRef(0);    // горизонтальное «течение» волны
  const speedRef = useRef(7.2); // медленнее поднимается

  // прогресс (для барa)
  const progressRef = useRef(0); // 0..100

  // DOM refs
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pathElRef = useRef<SVGPathElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const brandRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onLoad = () => (loaded.current = true);
    if (document.readyState === "complete") loaded.current = true;
    else window.addEventListener("load", onLoad, { once: true });

    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    const syncViewport = () => {
      wRef.current = window.innerWidth;
      hRef.current = window.innerHeight;
      yRef.current = hRef.current + 40; // старт ниже экрана
      svgRef.current?.setAttribute(
        "viewBox",
        `0 0 ${Math.max(1, wRef.current)} ${Math.max(1, hRef.current)}`
      );
    };
    syncViewport();

    const onResize = () => {
      wRef.current = window.innerWidth;
      hRef.current = window.innerHeight;
      svgRef.current?.setAttribute(
        "viewBox",
        `0 0 ${Math.max(1, wRef.current)} ${Math.max(1, hRef.current)}`
      );
    };
    window.addEventListener("resize", onResize);

    // плотная дискретизация -> гладкая линия
    const sampleWave = (
      w: number, y: number, amp: number, freq: number, phase: number, xFlow: number
    ) => {
      const steps = Math.max(140, Math.floor(w / 8)); // плотнее = «шёлковее»
      const dx = w / steps;
      const pts: Array<{x:number;y:number}> = [];
      // лёгкая модуляция частоты по ширине (еще «живее»)
      for (let i = 0; i <= steps; i++) {
        const x = i * dx;
        const locFreq = freq * (1 + 0.06 * Math.sin((i / steps) * Math.PI * 2));
        const yy = y + Math.sin((x + xFlow) * 0.012 * locFreq + phase) * amp;
        pts.push({ x, y: yy });
      }
      return pts;
    };

    // Catmull–Rom → Bezier
    const catmullRomToBezierPath = (pts: Array<{x:number;y:number}>) => {
      if (pts.length < 2) return "";
      let d = `M 0 0 L ${wRef.current} 0 L ${wRef.current} ${pts[pts.length-1].y.toFixed(2)} `;
      const p = pts.slice().reverse();
      const tension = 0.5;
      d += `L ${p[0].x.toFixed(2)} ${p[0].y.toFixed(2)} `;
      for (let i = 0; i < p.length - 1; i++) {
        const p0 = p[i + 1] ?? p[i];
        const p1 = p[i];
        const p2 = p[i - 1] ?? p[i];
        const p_1 = p[i + 2] ?? p0;

        const c1x = p1.x + ((p0.x - p2.x) * tension) / 6;
        const c1y = p1.y + ((p0.y - p2.y) * tension) / 6;
        const c2x = p0.x - ((p_1.x - p1.x) * tension) / 6;
        const c2y = p0.y - ((p_1.y - p1.y) * tension) / 6;

        d += `C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} `;
      }
      d += "Z";
      return d;
    };

    const tick = (ts: number) => {
      if (start.current == null) start.current = ts;
      const elapsed = ts - start.current;

      // прогресс: до load плавно к 92%, после — к 100%
      const target = loaded.current ? 100 : 92;
      const gain = 0.012 + 0.05 * Math.min(1, elapsed / 700); // ускоряемся чуть к середине
      progressRef.current += (target - progressRef.current) * gain;
      if (barRef.current) {
        const w = Math.max(0, Math.min(100, progressRef.current));
        barRef.current.style.width = `${w}%`;
      }

      // живая волна: горизонтальный «поток» + плавный подъём
      phaseRef.current += 0.045;         // медленнее колебания → изящнее
      xFlowRef.current += 0.9;           // смещение по X → волна «идёт» вправо
      const slowIn = 1 - Math.min(1, elapsed / 800);
      yRef.current -= speedRef.current * (0.12 + 0.68 * slowIn) + 3.0;

      // к концу амплитуда чуть падает (мягче исчезает)
      ampRef.current = Math.max(12, 26 - elapsed / 18);

      // обновляем path
      if (pathElRef.current) {
        const pts = sampleWave(
          wRef.current, yRef.current, ampRef.current, freqRef.current, phaseRef.current, xFlowRef.current
        );
        const d = catmullRomToBezierPath(pts);
        pathElRef.current.setAttribute("d", d || `M0 0 L${wRef.current} 0 L${wRef.current} ${yRef.current} L0 ${yRef.current} Z`);
      }

      // завершение
      const doneMin = elapsed >= minDurationMs;
      const waveGone = yRef.current < -(ampRef.current + 12);
      const progressDone = progressRef.current > 99.2;
      if (loaded.current && doneMin && waveGone && progressDone) {
        setReady(true);
        document.body.classList.add("app-ready");
        setTimeout(() => {
          setActive(false);
          document.documentElement.style.overflow = prevOverflow;
        }, 420);
        return;
      }

      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);

    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", onLoad);
      document.documentElement.style.overflow = prevOverflow;
    };
  }, [minDurationMs]);

  if (!active) return null;

  // первый рендер (SSR/CSR) — стабильный
  return (
    <div
      className={[
        "fixed inset-0 z-[99998] pointer-events-none select-none",
        ready ? "opacity-0 transition-opacity duration-[380ms] ease-out" : "opacity-100",
      ].join(" ")}
      aria-hidden
    >
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
      >
        <path
          ref={pathElRef}
          d="M0 0 L1 0 L1 1 L0 1 Z"
          fill={color}
          fillOpacity={opacity}
          shapeRendering="geometricPrecision"
        />
      </svg>

      {/* центр: бренд + ЗАПОЛНЯЮЩИЙСЯ ПРОГРЕСС-БАР */}
      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <div
          className={[
            "flex flex-col items-center gap-5",
            "transition-opacity duration-300",
            ready ? "opacity-0" : "opacity-100",
          ].join(" ")}
        >
          <div
            ref={brandRef}
            className="text-white/85 uppercase tracking-[0.22em] text-[11px] md:text-sm"
          >
            {brand}
          </div>

          <div className="w-[240px] md:w-[300px] h-[3px] rounded-full bg-white/15 overflow-hidden">
            <div
              ref={barRef}
              className="h-full bg-white rounded-full"
              style={{ width: "0%", transition: "width 180ms ease-out" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
