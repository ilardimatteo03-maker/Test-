import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";

// DA ASM : Geist — grotesque neutre premium (remplace Inter), titres et corps.

export const metadata: Metadata = {
  title: "Fidélo by ASM — La fidélité digitale pour votre commerce",
  description:
    "Fidélo by ASM : le programme de fidélité digital installé, configuré et géré par ASM pour votre commerce de quartier. Vos clients reviennent, sans carton ni tampon.",
};

export const viewport: Viewport = {
  themeColor: "#2F6BFF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={GeistSans.variable}>
      <body className="font-sans antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
