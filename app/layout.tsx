import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PeakScore",
  description: "Plataforma profesional de preparación para el ICFES",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}