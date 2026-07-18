"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Camera, CameraOff, Check, Gift, Keyboard } from "lucide-react";
import { Button, Card, PageHeading } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { addStamp, currentMerchant, getClient } from "@/lib/store";
import { useStoreVersion } from "@/lib/useStore";
import { unitWord } from "@/lib/format";
import { notifyReward } from "@/lib/notify-client";

type CamState = "idle" | "starting" | "running" | "error";

// Scanner intégré : utilise la caméra du téléphone/tablette/ordi via le
// navigateur (aucune app à installer). Décode le QR de la carte client.
export default function ScanPage() {
  useStoreVersion();
  const toast = useToast();
  const merchant = currentMerchant();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const lastScanRef = useRef<{ id: string; at: number } | null>(null);

  const [cam, setCam] = useState<CamState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [last, setLast] = useState<{ name: string; rewarded: boolean } | null>(null);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // Extrait l'identifiant client depuis le contenu du QR (URL /scan/<id>).
  function parseId(text: string): string | null {
    const m = text.match(/\/scan\/([^/?#\s]+)/);
    if (m) return m[1];
    const trimmed = text.trim();
    return /^c[_a-z0-9]+$/i.test(trimmed) ? trimmed : null;
  }

  const handleDecoded = useCallback(
    (text: string) => {
      const id = parseId(text);
      if (!id || !merchant) return;
      // Anti-double : ignore le même code pendant 3 s.
      const now = Date.now();
      if (lastScanRef.current && lastScanRef.current.id === id && now - lastScanRef.current.at < 3000) {
        return;
      }
      const client = getClient(id);
      if (!client || client.merchantId !== merchant.id) {
        lastScanRef.current = { id, at: now };
        toast("Carte non reconnue");
        return;
      }
      lastScanRef.current = { id, at: now };
      const res = addStamp(id);
      if (res?.rewarded) {
        toast(`${client.name} a gagné : ${merchant.rewardLabel} !`, "reward");
        notifyReward(id);
        setLast({ name: client.name, rewarded: true });
      } else if (res) {
        toast(`${Unit} ajouté pour ${client.name}`);
        setLast({ name: client.name, rewarded: false });
      }
    },
    [merchant, toast]
  );

  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(img.data, img.width, img.height, {
          inversionAttempts: "dontInvert",
        });
        if (code?.data) handleDecoded(code.data);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [handleDecoded]);

  const start = useCallback(async () => {
    setErrorMsg("");
    setCam("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCam("running");
      rafRef.current = requestAnimationFrame(tick);
    } catch (e: any) {
      setCam("error");
      setErrorMsg(
        e?.name === "NotAllowedError"
          ? "Accès à la caméra refusé. Autorisez la caméra dans votre navigateur."
          : "Caméra indisponible sur cet appareil."
      );
    }
  }, [tick]);

  useEffect(() => () => stop(), [stop]);

  if (!merchant) return null;
  const unit = unitWord(merchant.programType);
  const Unit = unit.charAt(0).toUpperCase() + unit.slice(1);

  return (
    <div>
      <PageHeading
        title="Scanner"
        subtitle={`Scannez le QR code de la carte d'un client pour ajouter son ${unit}.`}
        action={
          <Button href="/dashboard/clients" variant="secondary">
            <Keyboard className="h-4 w-4" />
            Saisie manuelle
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card bezel outerClassName="lg:col-span-3" className="overflow-hidden">
          <div className="relative aspect-square w-full bg-ink">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Cadre de visée */}
            {cam === "running" && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="h-52 w-52 rounded-3xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(10,10,10,0.45)]" />
              </div>
            )}

            {/* États idle / starting / error */}
            {cam !== "running" && (
              <div className="absolute inset-0 grid place-items-center bg-ink px-6 text-center text-white">
                {cam === "starting" ? (
                  <span className="h-7 w-7 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <div>
                    <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/10">
                      {cam === "error" ? (
                        <CameraOff className="h-7 w-7 text-white/80" />
                      ) : (
                        <Camera className="h-7 w-7 text-white/80" />
                      )}
                    </span>
                    <p className="mt-4 max-w-xs text-sm text-white/70">
                      {cam === "error"
                        ? errorMsg
                        : "Activez la caméra pour scanner le QR code de vos clients."}
                    </p>
                    <Button className="mt-5" onClick={start}>
                      <Camera className="h-4 w-4" />
                      {cam === "error" ? "Réessayer" : "Activer la caméra"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Panneau latéral */}
        <div className="lg:col-span-2">
          <Card bezel className="p-6">
            <h2 className="font-bold text-ink">Comment ça marche</h2>
            <ol className="mt-4 space-y-4">
              {[
                "Le client ouvre sa carte de fidélité sur son téléphone.",
                "Vous activez la caméra et visez le QR code.",
                `Le ${unit} s'ajoute tout seul. C'est instantané.`,
              ].map((t, i) => (
                <li key={i} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-500 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="text-sm text-slate-600">{t}</span>
                </li>
              ))}
            </ol>

            {last && (
              <div
                className={`mt-6 flex items-center gap-3 rounded-2xl p-4 ${
                  last.rewarded ? "bg-brand-50 text-brand-700" : "bg-emerald-50 text-emerald-700"
                }`}
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                    last.rewarded ? "bg-brand-500" : "bg-emerald-500"
                  } text-white`}
                >
                  {last.rewarded ? <Gift className="h-5 w-5" /> : <Check className="h-5 w-5" strokeWidth={3} />}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{last.name}</p>
                  <p className="text-xs">
                    {last.rewarded ? "Récompense gagnée" : `${Unit} ajouté`}
                  </p>
                </div>
              </div>
            )}

            <p className="mt-6 text-xs text-slate-400">
              Astuce : vos clients peuvent aussi être scannés avec l'appareil
              photo normal d'un téléphone — le QR ouvre directement la validation.
            </p>
            <Link
              href="/dashboard/clients"
              className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline"
            >
              Ou ajouter un {unit} manuellement →
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
