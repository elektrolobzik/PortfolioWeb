"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";

export default function Hero() {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  // деликатный параллакс текста/оверлея при движении мыши
  useEffect(() => {
    const mediaOK =
      window.matchMedia("(prefers-reduced-motion: no-preference)").matches &&
      window.matchMedia("(pointer: fine)").matches;

    if (!mediaOK) return;

    const onMove = (e: MouseEvent) => {
      const { innerWidth: w, innerHeight: h } = window;
      const nx = (e.clientX / w - 0.5) * 2; // -1..1
      const ny = (e.clientY / h - 0.5) * 2;

      // лёгкий сдвиг контента
      const tx = nx * 8;
      const ty = ny * 6;
      if (contentRef.current) {
        contentRef.current.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      }

      // еле заметный наклон градиента
      const rx = -ny * 1.0;
      const ry = nx * 1.0;
      if (overlayRef.current) {
        overlayRef.current.style.transform = `translateZ(0) rotateX(${rx}deg) rotateY(${ry}deg)`;
      }
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <section
      className="relative h-[100svh] w-full overflow-hidden text-white"
      aria-label="Вступительный экран"
    >
      {/* Fullscreen фоновое изображение (гиперреалистичный рендер) */}
      <Image
        src="/images/hero-3d.jpg"
        alt=""
        priority
        fill
        sizes="100vw"
        className="select-none pointer-events-none object-cover"
      />

      {/* Градиентный оверлей для контраста текста */}
      <div
        ref={overlayRef}
        className="pointer-events-none absolute inset-0 will-change-transform
        bg-[radial-gradient(1200px_800px_at_30%_-10%,rgba(0,0,0,0.55),transparent),linear-gradient(to_top,rgba(0,0,0,0.55),rgba(0,0,0,0.08))]"
        aria-hidden
      />

      {/* Контент */}
      <div
        ref={contentRef}
        className="relative z-10 mx-auto flex h-full max-w-6xl flex-col items-center justify-center px-6 text-center will-change-transform"
      >
        <h1 className="text-5xl md:text-7xl font-light tracking-wide fade-in-up">
          SoulSpace Studio
        </h1>
        <p className="mt-4 text-base md:text-xl text-white/85 fade-in-up [animation-delay:120ms]">
          Создаём интерьеры с характером · Interiors that breathe with light
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 fade-in-up [animation-delay:240ms]">
          <a
            href="#portfolio"
            className="rounded-full bg-white px-6 py-3 text-sm md:text-base font-medium text-black transition hover:bg-gray-200"
          >
            Смотреть проекты
          </a>
          <a
            href="#contact"
            className="rounded-full border border-white px-6 py-3 text-sm md:text-base font-medium text-white transition hover:bg-white hover:text-black"
          >
            Связаться
          </a>
        </div>
      </div>

      {/* Подсказка прокрутки */}
      <div className="pointer-events-none absolute inset-x-0 bottom-5 z-10 flex items-center justify-center text-xs md:text-sm text-white/70 fade-in-up [animation-delay:360ms]">
        Пролистайте вниз
      </div>
    </section>
  );
}
