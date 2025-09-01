import type { Metadata } from "next";
import "./globals.css";
import PreloaderWave from "@/components/ui/PreloaderWave";

export const metadata: Metadata = {
  title: "Моё портфолио",
  description: "Frontend Developer Portfolio",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <div className="app-reveal">{children}</div>
        <PreloaderWave brand="SoulSpace Studio" minDurationMs={1500} />
      </body>
    </html>
  );
}
