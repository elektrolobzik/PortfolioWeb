"use client";
import { useEffect } from "react";

export default function ScrollToTopOnLoad({ onlyHome = true }: { onlyHome?: boolean }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Отключаем восстановление позиции скролла браузером
    if ("scrollRestoration" in window.history) {
      try { window.history.scrollRestoration = "manual"; } catch {}
    }

    const { pathname } = window.location;
    const isHome = pathname === "/" || pathname === "" || pathname.endsWith("/index");
    if (!onlyHome || isHome) {
      // Скроллим наверх на первом кадре
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      });
    }
  }, []);

  return null;
}
