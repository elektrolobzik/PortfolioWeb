import React from "react";

type Props = {
  children?: React.ReactNode;
  className?: string;
  /** Если у тебя фиксированный хедер — поставь высоту (в пикселях) */
  headerOffset?: number; // например 80
};

export default function ScrollToProjectsButton({
  children = "Смотреть проекты",
  className = "",
  headerOffset = 0,
}: Props) {
  const onClick = () => {
    const el = document.getElementById("projects");
    if (!el) return;

    // если нужен учёт фиксированного хедера
    if (headerOffset > 0) {
      const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top, behavior: "smooth" });
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <button
      onClick={onClick}
      className={
        "inline-flex items-center justify-center rounded-2xl px-6 py-3 text-base font-medium " +
        "transition hover:opacity-90 focus:outline-none focus:ring " + className
      }
    >
      {children}
    </button>
  );
}
