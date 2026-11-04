"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import QRCode from "qrcode";
import {
  QrCode,
  Link2,
  Wifi,
  MessageCircle,
  Contact,
  FileText,
  Mail,
  Download,
  Copy,
  Check,
  Palette,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Sliders,
} from "lucide-react";

type QrType = "url" | "wifi" | "whatsapp" | "vcard" | "text" | "email";

const COLOR_PRESETS = [
  { name: "Midnight Black", value: "#000000" },
  { name: "CodeVanta Gold", value: "#d8b15a" },
  { name: "Emerald Green", value: "#059669" },
  { name: "Sapphire Blue", value: "#2563eb" },
  { name: "Electric Violet", value: "#7c3aed" },
  { name: "Ruby Red", value: "#dc2626" },
];

const BG_PRESETS = [
  { name: "Pure White", value: "#ffffff" },
  { name: "Dark Slate", value: "#0b0f17" },
  { name: "Soft Amber", value: "#fffbeb" },
  { name: "Transparent", value: "#00000000" },
];

export default function QrCodeGenerator() {
  const [qrType, setQrType] = useState<QrType>("url");

  // Form states
  const [url, setUrl] = useState("https://www.codevanta.online");

  // WiFi
  const [wifiSsid, setWifiSsid] = useState("Home_5G");
  const [wifiPassword, setWifiPassword] = useState("FastPassword123");
  const [wifiAuth, setWifiAuth] = useState<"WPA" | "WEP" | "nopass">("WPA");
  const [wifiHidden, setWifiHidden] = useState(false);

  // WhatsApp
  const [waPhone, setWaPhone] = useState("254700000000");
  const [waMessage, setWaMessage] = useState("Hello! I saw your link on CodeVanta.");

  // vCard
  const [vcardName, setVcardName] = useState("Alex Mwangi");
  const [vcardPhone, setVcardPhone] = useState("+254 700 000 000");
  const [vcardEmail, setVcardEmail] = useState("alex@example.com");
  const [vcardOrg, setVcardOrg] = useState("CodeVanta");
  const [vcardTitle, setVcardTitle] = useState("Software Engineer");
  const [vcardWebsite, setVcardWebsite] = useState("https://www.codevanta.online");

  // Text
  const [plainText, setPlainText] = useState("Scan to verify your ticket #CV-8492");

  // Email
  const [emailTo, setEmailTo] = useState("contact@codevanta.online");
  const [emailSubject, setEmailSubject] = useState("Inquiry from CodeVanta Hub");
  const [emailBody, setEmailBody] = useState("Hi team, I would like to learn more about your platform.");

  // Style customization
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [errorLevel, setErrorLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const [exportSize, setExportSize] = useState<number>(600);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  // Construct QR Payload
  const getQrPayload = useCallback((): string => {
    switch (qrType) {
      case "url": {
        let clean = url.trim();
        if (clean && !clean.startsWith("http://") && !clean.startsWith("https://")) {
          clean = `https://${clean}`;
        }
        return clean || "https://www.codevanta.online";
      }
      case "wifi": {
        const t = wifiAuth === "nopass" ? "nopass" : wifiAuth;
        const p = wifiAuth === "nopass" ? "" : wifiPassword;
        return `WIFI:S:${wifiSsid};T:${t};P:${p};H:${wifiHidden ? "true" : "false"};;`;
      }
      case "whatsapp": {
        const cleanPhone = waPhone.replace(/[^0-9]/g, "");
        const msg = encodeURIComponent(waMessage.trim());
        return `https://wa.me/${cleanPhone}${msg ? `?text=${msg}` : ""}`;
      }
      case "vcard": {
        return [
          "BEGIN:VCARD",
          "VERSION:3.0",
          `FN:${vcardName}`,
          `TEL;TYPE=CELL:${vcardPhone}`,
          `EMAIL:${vcardEmail}`,
          `ORG:${vcardOrg}`,
          `TITLE:${vcardTitle}`,
          `URL:${vcardWebsite}`,
          "END:VCARD",
        ].join("\n");
      }
      case "text":
        return plainText || "CodeVanta Smart QR";
      case "email": {
        const sub = encodeURIComponent(emailSubject);
        const b = encodeURIComponent(emailBody);
        return `mailto:${emailTo}?subject=${sub}&body=${b}`;
      }
      default:
        return "https://www.codevanta.online";
    }
  }, [
    qrType,
    url,
    wifiSsid,
    wifiPassword,
    wifiAuth,
    wifiHidden,
    waPhone,
    waMessage,
    vcardName,
    vcardPhone,
    vcardEmail,
    vcardOrg,
    vcardTitle,
    vcardWebsite,
    plainText,
    emailTo,
    emailSubject,
    emailBody,
  ]);

  // Generate QR Code onto Canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    const payload = getQrPayload();

    QRCode.toCanvas(
      canvasRef.current,
      payload,
      {
        width: 320,
        margin: 2,
        errorCorrectionLevel: errorLevel,
        color: {
          dark: fgColor,
          light: bgColor,
        },
      },
      (err) => {
        if (!err && canvasRef.current) {
          try {
            setQrDataUrl(canvasRef.current.toDataURL("image/png"));
          } catch {
            // ignore
          }
        }
      }
    );
  }, [getQrPayload, fgColor, bgColor, errorLevel]);

  // Download High-Resolution PNG
  const handleDownload = async () => {
    const payload = getQrPayload();
    try {
      const highResDataUrl = await QRCode.toDataURL(payload, {
        width: exportSize,
        margin: 2,
        errorCorrectionLevel: errorLevel,
        color: {
          dark: fgColor,
          light: bgColor,
        },
      });

      const a = document.createElement("a");
      a.href = highResDataUrl;
      a.download = `codevanta-qr-${qrType}-${exportSize}px.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error("Failed to generate download", e);
    }
  };

  // Copy Image to Clipboard
  const handleCopy = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Fallback: copy payload text
          await navigator.clipboard.writeText(getQrPayload());
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      });
    } catch {
      await navigator.clipboard.writeText(getQrPayload());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8">
      {/* QR Type Selection Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: "url", label: "Website Link", icon: Link2 },
          { id: "wifi", label: "Wi-Fi Network", icon: Wifi },
          { id: "whatsapp", label: "WhatsApp Chat", icon: MessageCircle },
          { id: "vcard", label: "Digital Business Card", icon: Contact },
          { id: "text", label: "Plain Text", icon: FileText },
          { id: "email", label: "Direct Email", icon: Mail },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = qrType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setQrType(tab.id as QrType)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-lg shadow-amber-950/40"
                  : "bg-black/40 hover:bg-white/[0.06] text-hub-text-secondary hover:text-white border border-white/[0.08]"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Form on Left, Live Canvas on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form & Styling */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Type Form */}
          <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-hub-gold" />
                <span>Configure {qrType.toUpperCase()} Payload</span>
              </h3>
              <span className="text-[11px] text-hub-text-muted">Live update</span>
            </div>

            {/* URL Form */}
            {qrType === "url" && (
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase text-hub-gold">Website or Profile URL</label>
                <div className="relative">
                  <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-hub-text-muted" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full pl-10 pr-4 py-3 bg-black/60 border border-white/10 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-hub-gold transition-all"
                  />
                </div>
                <p className="text-[11px] text-hub-text-muted">
                  Scanned by all smartphones to immediately open the link in browser.
                </p>
              </div>
            )}

            {/* Wi-Fi Form */}
            {qrType === "wifi" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase text-hub-gold">Wi-Fi Network (SSID)</label>
                    <input
                      type="text"
                      value={wifiSsid}
                      onChange={(e) => setWifiSsid(e.target.value)}
                      placeholder="MyHome_WiFi"
                      className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-hub-gold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase text-hub-gold">Security Encryption</label>
                    <select
                      value={wifiAuth}
                      onChange={(e) => setWifiAuth(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-hub-gold"
                    >
                      <option value="WPA">WPA / WPA2 / WPA3 (Standard)</option>
                      <option value="WEP">WEP (Legacy)</option>
                      <option value="nopass">None (Open Network)</option>
                    </select>
                  </div>
                </div>

                {wifiAuth !== "nopass" && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase text-hub-gold">Wi-Fi Password</label>
                    <input
                      type="text"
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      placeholder="Enter network password"
                      className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-hub-gold"
                    />
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={wifiHidden}
                    onChange={(e) => setWifiHidden(e.target.checked)}
                    className="rounded bg-black/60 border-white/20 text-hub-gold focus:ring-0"
                  />
                  <span className="text-xs text-hub-text-secondary">This is a hidden network</span>
                </label>
                <p className="text-[11px] text-emerald-400">
                  Tip: Guests can scan this QR code with their camera to connect instantly without typing any password!
                </p>
              </div>
            )}

            {/* WhatsApp Form */}
            {qrType === "whatsapp" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase text-hub-gold">
                    WhatsApp Phone Number (with Country Code)
                  </label>
                  <input
                    type="text"
                    value={waPhone}
                    onChange={(e) => setWaPhone(e.target.value)}
                    placeholder="e.g. 254712345678"
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-hub-gold"
                  />
                  <p className="text-[10px] text-hub-text-muted">
                    Format: 2547XXXXXXXX (Kenya) or 1XXXXXXXXXX (US). Do not include + or spaces.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase text-hub-gold">
                    Pre-filled Message (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={waMessage}
                    onChange={(e) => setWaMessage(e.target.value)}
                    placeholder="Hello, I want to inquire about..."
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-sm font-sans text-white focus:outline-none focus:border-hub-gold"
                  />
                </div>
              </div>
            )}

            {/* vCard Form */}
            {qrType === "vcard" && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono uppercase text-hub-gold">Full Name</label>
                    <input
                      type="text"
                      value={vcardName}
                      onChange={(e) => setVcardName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono uppercase text-hub-gold">Phone Number</label>
                    <input
                      type="text"
                      value={vcardPhone}
                      onChange={(e) => setVcardPhone(e.target.value)}
                      placeholder="+254 700 000000"
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono uppercase text-hub-gold">Email Address</label>
                    <input
                      type="email"
                      value={vcardEmail}
                      onChange={(e) => setVcardEmail(e.target.value)}
                      placeholder="jane@example.com"
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono uppercase text-hub-gold">Company / Org</label>
                    <input
                      type="text"
                      value={vcardOrg}
                      onChange={(e) => setVcardOrg(e.target.value)}
                      placeholder="Acme Corp"
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono uppercase text-hub-gold">Job Title</label>
                    <input
                      type="text"
                      value={vcardTitle}
                      onChange={(e) => setVcardTitle(e.target.value)}
                      placeholder="Founder &amp; CEO"
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono uppercase text-hub-gold">Website</label>
                    <input
                      type="url"
                      value={vcardWebsite}
                      onChange={(e) => setVcardWebsite(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Plain Text Form */}
            {qrType === "text" && (
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase text-hub-gold">Custom Text</label>
                <textarea
                  rows={4}
                  value={plainText}
                  onChange={(e) => setPlainText(e.target.value)}
                  placeholder="Enter any text, serial code, voucher, or secret note..."
                  className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-sm font-sans text-white focus:outline-none focus:border-hub-gold"
                />
              </div>
            )}

            {/* Email Form */}
            {qrType === "email" && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase text-hub-gold">Recipient Email</label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="hello@example.com"
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-sm text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase text-hub-gold">Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Hello there"
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-sm text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase text-hub-gold">Body</label>
                  <textarea
                    rows={3}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Email body text..."
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-sm text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Color & Visual Customizer Panel */}
          <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3 text-sm font-bold text-white font-mono uppercase">
              <Palette className="w-4 h-4 text-hub-gold" />
              <span>Color &amp; Error Correction</span>
            </div>

            {/* Foreground Color */}
            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase text-hub-text-secondary">QR Code Color</label>
              <div className="flex flex-wrap items-center gap-2">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setFgColor(c.value)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      fgColor.toLowerCase() === c.value.toLowerCase()
                        ? "scale-110 border-white ring-2 ring-hub-gold shadow-lg"
                        : "border-white/20 hover:scale-105"
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
                <div className="flex items-center gap-1.5 ml-2 bg-black/50 border border-white/10 px-2 py-1 rounded-lg">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-[10px] font-mono text-hub-text-muted">{fgColor}</span>
                </div>
              </div>
            </div>

            {/* Background Color */}
            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase text-hub-text-secondary">Background Color</label>
              <div className="flex flex-wrap items-center gap-2">
                {BG_PRESETS.map((b) => (
                  <button
                    key={b.value}
                    onClick={() => setBgColor(b.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono border transition-all ${
                      bgColor.toLowerCase() === b.value.toLowerCase()
                        ? "border-hub-gold bg-white/10 text-white font-bold"
                        : "border-white/10 text-hub-text-muted hover:text-white"
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Correction & Export Size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase text-hub-text-secondary">
                  Error Correction
                </label>
                <select
                  value={errorLevel}
                  onChange={(e) => setErrorLevel(e.target.value as any)}
                  className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs font-mono text-white"
                >
                  <option value="L">Low (7% recovery)</option>
                  <option value="M">Medium (15% - standard)</option>
                  <option value="Q">Quartile (25% recovery)</option>
                  <option value="H">High (30% - maximum resilience)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase text-hub-text-secondary">
                  Download Resolution
                </label>
                <select
                  value={exportSize}
                  onChange={(e) => setExportSize(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs font-mono text-white"
                >
                  <option value={300}>300px (Web &amp; WhatsApp)</option>
                  <option value={600}>600px (HD High Quality)</option>
                  <option value={1200}>1200px (Ultra-HD Print Ready)</option>
                  <option value={2048}>2048px (Billboard &amp; Poster)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live QR Preview & Actions */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 text-center shadow-2xl relative">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-[11px] font-mono text-hub-gold">
              <QrCode className="w-3.5 h-3.5" />
              <span>Live Render Canvas</span>
            </div>

            {/* Canvas Box */}
            <div className="flex items-center justify-center p-6 bg-black/50 border border-white/10 rounded-2xl mx-auto max-w-xs shadow-inner">
              <canvas ref={canvasRef} className="rounded-xl shadow-md max-w-full h-auto" />
            </div>

            <p className="text-xs text-hub-text-secondary font-mono">
              Ready to scan with any iPhone or Android camera app
            </p>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-gold-glow"
              >
                <Download className="w-4 h-4" />
                <span>Download {exportSize}px PNG</span>
              </button>

              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] text-white font-mono text-xs font-semibold transition-all border border-white/10"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "QR Copied to Clipboard!" : "Copy QR Image"}</span>
              </button>
            </div>

            {/* QR Scanner Hint */}
            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-center gap-2 text-[11px] text-hub-text-muted">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Free &bull; Permanent &bull; No Expiration Date</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

