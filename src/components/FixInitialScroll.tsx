"use client";
import { useEffect } from "react";

/**
 * Ставит scrollRestoration=manual, убирает #hash со старта и прокручивает к верху.
 * Делает это ТОЛЬКО на первом рендере и ТОЛЬКО на главной странице.
 */
export default function FixInitialScroll() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Отключаем восстановление скролла браузером
    if ("scrollRestoration" in window.history) {
      try { window.history.scrollRestoration = "manual"; } catch {}
    }

    const { pathname, hash } = window.location;
    const isHome = pathname === "/" || pathname === "" || pathname.endsWith("/index");
    if (isHome && hash === "#projects") {
      // Убираем хэш, чтобы браузер не прыгал к якорю
      window.history.replaceState(null, "", pathname);
      // Прокручиваем к началу (мягко)
      window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" as ScrollBehavior : "auto" });
      // Если хочешь плавно — замени "auto" на "smooth"
    }
  }, []);

  return null;
}
