"use client";
import { useEffect, useRef } from "react";

export default function ScrollProgress() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const p = max > 0 ? (h.scrollTop / max) * 100 : 0;
      el.style.setProperty("--sp", p.toFixed(3));
    };
    onScroll();

    let rId = 0;
    const loop = () => { onScroll(); rId = requestAnimationFrame(loop); };
    rId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rId);
  }, []);

  return (
    <div
      ref={ref}
      className="fixed right-0 top-0 h-screen w-[3px] z-[9999] pointer-events-none"
      style={{
        background:
          "linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.08))",
        mask:
          "linear-gradient(to bottom, rgba(0,0,0,0.0) 0%, rgba(0,0,0,1) calc(var(--sp,0)*1%), rgba(0,0,0,0.0) calc(var(--sp,0)*1%))",
        WebkitMask:
          "linear-gradient(to bottom, rgba(0,0,0,0.0) 0%, rgba(0,0,0,1) calc(var(--sp,0)*1%), rgba(0,0,0,0.0) calc(var(--sp,0)*1%))",
        transition: "opacity .2s ease",
        opacity: 0.9
      }}
      aria-hidden
    />
  );
}
