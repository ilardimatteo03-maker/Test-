"use client";

import { useEffect, useState } from "react";
import QRCodeLib from "qrcode";
import { clsx } from "clsx";

// Génère un QR code (image data URL) côté client, aux couleurs de la marque.
export function QrCode({
  value,
  size = 180,
  className,
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    QRCodeLib.toDataURL(value, {
      width: size * 2, // rendu net sur écrans Retina
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0A0A0A", light: "#FFFFFF" },
    })
      .then((url) => {
        if (active) setSrc(url);
      })
      .catch(() => {
        if (active) setSrc(null);
      });
    return () => {
      active = false;
    };
  }, [value, size]);

  return (
    <span
      className={clsx(
        "inline-grid place-items-center rounded-2xl bg-white",
        className
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="QR code de la carte de fidélité"
          width={size}
          height={size}
          className="rounded-xl"
        />
      ) : (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-brand-500" />
      )}
    </span>
  );
}
