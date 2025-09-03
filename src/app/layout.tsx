import type { Metadata } from "next";
import ScrollToTopOnLoad from "@/components/ScrollToTopOnLoad";
import "./globals.css";
import PreloaderWave from "@/components/ui/PreloaderWave";
import CustomCursor from "@/components/effects/CustomCursor";

export const metadata: Metadata = {
  title: "Моё портфолио",
  description: "Frontend Developer Portfolio",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
    <ScrollToTopOnLoad onlyHome />
        {/* Глобальный кастомный курсор (на всех страницах) */}
        <CustomCursor />

        {/* Контент с кинематографичным reveal */}
        <div className="app-reveal">{children}</div>

        {/* Прелоадер-волна */}
        <PreloaderWave brand="SoulSpace Studio" minDurationMs={1500} />
      </body>
    </html>
  );
}


