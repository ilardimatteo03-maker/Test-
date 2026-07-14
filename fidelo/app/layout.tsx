import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";

// DA ASM : Inter en poids lourds (grotesque neutre) pour titres et corps.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

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
    <html lang="fr" className={inter.variable}>
      <body className="font-sans antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
