import type { Metadata } from "next";
import { ReactNode } from "react";

import GlobalNavbar from "@/components/layout/GlobalNavbar";

import "./globals.css";

export const metadata: Metadata = {
  title: "PeakScore",
  description: "Preparación ICFES",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <GlobalNavbar />

        {children}
      </body>
    </html>
  );
}