"use client";
import { useEffect, useRef, useState } from "react";

type Props = {
  brand?: string;
  minDurationMs?: number; // минимальная длительность, чтобы анимация «успела»
};

export default function Preloader({ brand = "Portfolio", minDurationMs = 1200 }: Props) {
  const [active, setActive] = useState(true);
  const progressRef = useRef(0);           // 0..100
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const loadReachedRef = useRef(false);    // window "load" пришёл
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Мягкий прогресс + ожидание window.load + минимальная длительность
  useEffect(() => {
    const onLoad = () => { loadReachedRef.current = true; };
    if (document.readyState === "complete") {
      loadReachedRef.current = true;
    } else {
      window.addEventListener("load", onLoad, { once: true });
    }

    // блокируем скролл, пока прелоадер активен
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    const tick = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;

      // приближаемся к 90% сами, дальше ждём window.load + мин. длительность
      const target = loadReachedRef.current ? 100 : 90;
      const ease = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic
      const speed = 0.012; // скорость набора
      const next = progressRef.current + (target - progressRef.current) * (speed + 0.06 * ease(Math.min(1, elapsed / 800)));
      progressRef.current = Math.min(next, target);

      // условие завершения: и загрузка, и минимальная длительность, и прогресс≈100
      const ready = loadReachedRef.current && elapsed >= minDurationMs && progressRef.current > 99.2;

      if (!ready) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        progressRef.current = 100;
        // отмечаем приложение как готовое: включим красивые reveal-транзишны
        document.body.classList.add("app-ready");
        // аккуратный fade-out прелоадера (даём CSS доанимировать)
        setTimeout(() => setActive(false), 320);
        document.documentElement.style.overflow = prevOverflow;
      }

      // обновим CSS-переменную, чтобы полоска и текст знали прогресс
      if (containerRef.current) {
        containerRef.current.style.setProperty("--progress", String(progressRef.current));
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("load", onLoad);
      document.documentElement.style.overflow = prevOverflow;
    };
  }, [minDurationMs]);

  if (!active) return null;

  return (
    <div
      ref={containerRef}
      aria-label="Loading"
      role="status"
      className="preloader fixed inset-0 z-[99999] overflow-hidden pointer-events-auto"
    >
      {/* фон: мягкий градиент + «шум» */}
      <div className="absolute inset-0 bg-[radial-gradient(1200px_800px_at_30%_-10%,#111,transparent),radial-gradient(900px_600px_at_80%_120%,#000,transparent)]" />
      <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay bg-[url('data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'96\\' height=\\'96\\' viewBox=\\'0 0 96 96\\'><filter id=\\'n\\'><feTurbulence baseFrequency=\\'0.7\\' numOctaves=\\'2\\' stitchTiles=\\'stitch\\' /></filter><rect width=\\'96\\' height=\\'96\\' filter=\\'url(%23n)\\' opacity=\\'0.4\\'/></svg>')]" />

      {/* центр: «лого»-анимация */}
      <div className="relative h-full w-full grid place-items-center">
        <div className="flex flex-col items-center gap-6">
          {/* логомарка: двойное кольцо со штрихом (studio vibe) */}
          <svg
            className="size-24 md:size-28"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fff" />
                <stop offset="100%" stopColor="#9ca3af" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="30" fill="none" stroke="url(#g1)" strokeWidth="2" className="opacity-60" />
            <circle cx="50" cy="50" r="30" fill="none" stroke="url(#g1)" strokeWidth="3"
              strokeDasharray="110 110" strokeDashoffset="110"
              className="animate-stroke" />
            <circle cx="50" cy="50" r="18" fill="#fff" className="opacity-90">
              <animate attributeName="r" values="16;18;16" dur="1.6s" repeatCount="indefinite" />
            </circle>
          </svg>

          {/* бренд/подпись */}
          <div className="text-center">
            <div className="text-white/90 tracking-wider uppercase text-sm">{brand}</div>
            <div className="text-white/50 text-xs mt-1">Loading {`{${Math.round(progressRef.current)}%}`}</div>
          </div>

          {/* прогресс-бар */}
          <div className="w-[220px] md:w-[260px] h-[3px] rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-[width] duration-150 ease-out will-change-[width]"
              style={{ width: `calc(var(--progress,0) * 1%)` }}
            />
          </div>
        </div>
      </div>

      {/* затемнение снизу (кинематографично) */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/50 to-transparent" />
    </div>
  );
}
