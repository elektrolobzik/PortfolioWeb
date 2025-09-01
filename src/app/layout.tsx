import type { Metadata } from "next";
import "./globals.css";
import CustomCursor from "@/components/effects/CustomCursor";

export const metadata: Metadata = {
  title: "Моё портфолио",
  description: "Frontend Developer Portfolio",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        {children}
        <CustomCursor />
      </body>
    </html>
  );
}
