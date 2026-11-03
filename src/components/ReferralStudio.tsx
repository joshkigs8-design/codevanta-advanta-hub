"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  Check,
  Copy,
  Download,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Share2,
  Smartphone,
} from "lucide-react";

interface ReferralStudioProps {
  fullName: string;
  referralCode: string;
  referralUrl: string;
}

const POSTER_WIDTH = 1080;
const POSTER_HEIGHT = 1350;

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && line) {
      context.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = candidate;
    }
  }

  if (line) context.fillText(line, x, currentY);
  return currentY;
}

async function loadLogo(): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = "/icon.svg";
  });
}

async function renderReferralPoster(referralCode: string, referralUrl: string): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = POSTER_WIDTH;
  canvas.height = POSTER_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Poster rendering is not supported in this browser.");

  const background = context.createLinearGradient(0, 0, POSTER_WIDTH, POSTER_HEIGHT);
  background.addColorStop(0, "#090d15");
  background.addColorStop(0.52, "#111827");
  background.addColorStop(1, "#06080c");
  context.fillStyle = background;
  context.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);

  const glow = context.createRadialGradient(840, 220, 20, 840, 220, 560);
  glow.addColorStop(0, "rgba(201, 0, 61, 0.38)");
  glow.addColorStop(1, "rgba(201, 0, 61, 0)");
  context.fillStyle = glow;
  context.fillRect(300, 0, 780, 700);

  context.strokeStyle = "rgba(255,255,255,0.12)";
  context.lineWidth = 2;
  context.strokeRect(34, 34, POSTER_WIDTH - 68, POSTER_HEIGHT - 68);

  const logo = await loadLogo();
  if (logo) context.drawImage(logo, 82, 82, 112, 112);

  context.fillStyle = "#ffffff";
  context.font = "900 48px Arial, sans-serif";
  context.fillText("CODEVANTA.", 222, 132);
  context.fillStyle = "#d8b15a";
  context.font = "700 22px monospace";
  context.fillText("ADVANTA HUB", 226, 166);

  context.fillStyle = "#d8b15a";
  context.font = "700 22px monospace";
  context.fillText("YOUR DEVELOPER ADVANTAGE STARTS HERE", 84, 300);
  context.fillStyle = "#ffffff";
  context.font = "900 74px Arial, sans-serif";
  context.fillText("Build smarter.", 84, 388);
  context.fillText("Ship further.", 84, 478);

  context.fillStyle = "rgba(255,255,255,0.72)";
  context.font = "400 30px Arial, sans-serif";
  drawWrappedText(
    context,
    "Join a practical hub for verified developer resources, AI tools, APIs, blueprints and real-world learning paths.",
    86,
    560,
    850,
    46
  );

  context.fillStyle = "rgba(255,255,255,0.06)";
  context.fillRect(82, 710, 916, 190);
  context.strokeStyle = "rgba(216,177,90,0.42)";
  context.strokeRect(82, 710, 916, 190);
  context.fillStyle = "#d8b15a";
  context.font = "700 22px monospace";
  context.fillText("PERSONAL INVITATION CODE", 120, 765);
  context.fillStyle = "#ffffff";
  context.font = "900 64px monospace";
  context.fillText(referralCode, 120, 842);

  const qrCanvas = document.createElement("canvas");
  await QRCode.toCanvas(qrCanvas, referralUrl, {
    width: 300,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#080a0f", light: "#ffffff" },
  });
  context.fillStyle = "#ffffff";
  context.fillRect(650, 968, 300, 300);
  context.drawImage(qrCanvas, 650, 968, 300, 300);

  context.fillStyle = "#ffffff";
  context.font = "800 34px Arial, sans-serif";
  context.fillText("Scan to join CodeVanta", 84, 1010);
  context.fillStyle = "rgba(255,255,255,0.68)";
  context.font = "400 26px Arial, sans-serif";
  drawWrappedText(
    context,
    "Use this invitation to register and unlock your developer toolkit.",
    84,
    1065,
    500,
    40
  );

  context.fillStyle = "#d8b15a";
  context.font = "700 25px monospace";
  context.fillText("2-TIER REFERRAL REWARDS", 84, 1190);
  context.fillStyle = "rgba(255,255,255,0.78)";
  context.font = "400 24px Arial, sans-serif";
  context.fillText("Earn direct and network rewards when referrals qualify.", 84, 1235);
  context.fillStyle = "#ffffff";
  context.font = "700 25px Arial, sans-serif";
  context.fillText("codevanta.online", 84, 1290);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("The browser could not create the poster PNG."));
    }, "image/png");
  });
}

export default function ReferralStudio({ fullName, referralCode, referralUrl }: ReferralStudioProps) {
  const [posterUrl, setPosterUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const posterBlob = useRef<Blob | null>(null);
  const posterUrlRef = useRef("");

  const generatePoster = useCallback(async () => {
    setIsGenerating(true);
    setError("");
    setNotice("");
    try {
      const blob = await renderReferralPoster(referralCode, referralUrl);
      posterBlob.current = blob;
      setPosterUrl((previousUrl) => {
        if (previousUrl) URL.revokeObjectURL(previousUrl);
        const nextUrl = URL.createObjectURL(blob);
        posterUrlRef.current = nextUrl;
        return nextUrl;
      });
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "Unable to generate your poster.");
    } finally {
      setIsGenerating(false);
    }
  }, [referralCode, referralUrl]);

  useEffect(() => {
    void generatePoster();
    return () => {
      if (posterUrlRef.current) URL.revokeObjectURL(posterUrlRef.current);
    };
  }, [generatePoster]);

  const copyValue = async (value: string, type: "code" | "link") => {
    await navigator.clipboard.writeText(value);
    setCopied(type);
    window.setTimeout(() => setCopied(null), 1800);
  };

  const downloadPoster = () => {
    if (!posterUrl) return;
    const link = document.createElement("a");
    link.href = posterUrl;
    link.download = `codevanta-referral-${referralCode}.png`;
    link.click();
  };

  const sharePoster = async (whatsappOnly = false) => {
    if (!posterBlob.current) return;
    const message = `Hey! I've been using CodeVanta Advanta Hub and thought you might find it useful.\n\nJoin using my personal referral code: ${referralCode}\n\nRegister here: ${referralUrl}\n\nSee you inside!`;
    const file = new File([posterBlob.current], `codevanta-referral-${referralCode}.png`, { type: "image/png" });

    if (!whatsappOnly && navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ title: "Join CodeVanta Advanta Hub", text: message, files: [file] });
        setNotice("Poster shared successfully.");
        return;
      } catch (shareError) {
        if (shareError instanceof DOMException && shareError.name === "AbortError") return;
      }
    }

    if (whatsappOnly || !navigator.share || !navigator.canShare?.({ files: [file] })) {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
      setNotice("WhatsApp opened with your invitation. Attach the downloaded poster if needed.");
    } else {
      setNotice("Image sharing is unavailable on this device. Download the poster to share it manually.");
    }
  };

  return (
    <section className="p-6 sm:p-8 rounded-3xl glass-panel card-specular-edge border border-hub-gold/25 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-hub-gold font-bold">
            <ImageIcon className="w-4 h-4" />
            Referral Studio
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-2">Your personal invitation poster</h2>
          <p className="text-xs text-hub-text-secondary mt-1 max-w-2xl">
            A unique, share-ready poster for {fullName || "you"} with your live referral link and scannable code.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void generatePoster()}
          disabled={isGenerating}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-bold text-white hover:bg-white/[0.08] disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
          Regenerate Poster
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-6 items-start">
        <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/30 max-w-md mx-auto w-full">
          {isGenerating ? (
            <div className="aspect-[4/5] flex flex-col items-center justify-center gap-3 text-hub-text-secondary text-xs">
              <Loader2 className="w-6 h-6 animate-spin text-hub-gold" />
              Rendering your personalised PNG...
            </div>
          ) : posterUrl ? (
            <img src={posterUrl} alt={`Referral poster for ${fullName}`} className="w-full h-auto block" />
          ) : (
            <div className="aspect-[4/5] flex items-center justify-center text-xs text-red-300">Poster unavailable</div>
          )}
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-hub-text-muted">Referral code</label>
            <div className="flex gap-2">
              <input readOnly value={referralCode} className="min-w-0 flex-1 px-3 py-2.5 rounded-xl bg-hub-base border border-white/10 text-white font-mono text-sm" />
              <button type="button" onClick={() => void copyValue(referralCode, "code")} className="px-3 rounded-xl bg-hub-gold text-black text-xs font-bold inline-flex items-center gap-1.5">
                {copied === "code" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                Copy
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-hub-text-muted">Referral link</label>
            <div className="flex gap-2">
              <input readOnly value={referralUrl} className="min-w-0 flex-1 px-3 py-2.5 rounded-xl bg-hub-base border border-white/10 text-white font-mono text-xs" />
              <button type="button" onClick={() => void copyValue(referralUrl, "link")} className="px-3 rounded-xl bg-hub-gold text-black text-xs font-bold inline-flex items-center gap-1.5">
                {copied === "link" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                Copy
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button type="button" onClick={downloadPoster} disabled={!posterUrl} className="py-3 rounded-xl bg-white text-black text-xs font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50">
              <Download className="w-4 h-4" />
              Download PNG
            </button>
            <button type="button" onClick={() => void sharePoster(true)} disabled={!posterUrl} className="py-3 rounded-xl bg-emerald-500 text-black text-xs font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50">
              <Smartphone className="w-4 h-4" />
              WhatsApp
            </button>
            <button type="button" onClick={() => void sharePoster(false)} disabled={!posterUrl} className="py-3 rounded-xl bg-hub-gold text-black text-xs font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50">
              <Share2 className="w-4 h-4" />
              Share Poster
            </button>
          </div>

          {error && <p className="text-xs text-red-300 bg-red-950/40 border border-red-800/50 rounded-xl p-3">{error}</p>}
          {notice && <p className="text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-800/50 rounded-xl p-3">{notice}</p>}
        </div>
      </div>
    </section>
  );
}
