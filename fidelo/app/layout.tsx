import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";

// DA ASM : Geist — grotesque neutre premium (remplace Inter), titres et corps.

export const metadata: Metadata = {
  title: "fidélo. by ASM — La fidélité digitale pour votre commerce",
  description:
    "fidélo. by ASM : le programme de fidélité digital installé, configuré et géré par ASM pour votre commerce de quartier. Vos clients reviennent, sans carton ni tampon.",
  icons: {
    icon: [
      {
        url:
          "data:image/svg+xml," +
          encodeURIComponent(
            `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='#0A0A0A'/><text x='6.5' y='23' font-family='Arial,Helvetica,sans-serif' font-weight='800' font-size='22' fill='#ffffff'>f</text><circle cx='21' cy='21' r='3' fill='#2F6BFF'/></svg>`
          ),
        type: "image/svg+xml",
      },
    ],
  },
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
