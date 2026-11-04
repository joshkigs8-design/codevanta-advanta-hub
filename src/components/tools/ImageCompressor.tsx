"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Image as ImageIcon,
  UploadCloud,
  Download,
  Trash2,
  Sliders,
  Check,
  ShieldCheck,
  Sparkles,
  FileCheck,
  AlertCircle,
  Eye,
  ArrowRight,
  Maximize2,
} from "lucide-react";

interface ProcessedImage {
  id: string;
  name: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  originalUrl: string;
  compressedSize: number;
  compressedWidth: number;
  compressedHeight: number;
  compressedBlob: Blob;
  compressedUrl: string;
  format: string;
  quality: number;
  durationMs: number;
}

export default function ImageCompressor() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [quality, setQuality] = useState<number>(80);
  const [targetFormat, setTargetFormat] = useState<"image/jpeg" | "image/webp" | "image/png">("image/webp");
  const [maxDimension, setMaxDimension] = useState<number>(1920); // 0 = original
  const [processing, setProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Canvas processing pipeline
  const compressSingleImage = useCallback(
    async (file: File): Promise<ProcessedImage> => {
      const startTime = performance.now();
      const originalUrl = URL.createObjectURL(file);

      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          const origW = width;
          const origH = height;

          // Scale down if exceeding maxDimension
          if (maxDimension > 0 && (width > maxDimension || height > maxDimension)) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("Unable to create canvas context"));
            return;
          }

          // Draw image
          ctx.drawImage(img, 0, 0, width, height);

          // Export to Blob
          const qFloat = quality / 100;
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Compression failed"));
                return;
              }
              const durationMs = Math.round(performance.now() - startTime);
              const compressedUrl = URL.createObjectURL(blob);

              resolve({
                id: Math.random().toString(36).substring(2, 9),
                name: file.name,
                originalSize: file.size,
                originalWidth: origW,
                originalHeight: origH,
                originalUrl,
                compressedSize: blob.size,
                compressedWidth: width,
                compressedHeight: height,
                compressedBlob: blob,
                compressedUrl,
                format: targetFormat.replace("image/", "").toUpperCase(),
                quality,
                durationMs,
              });
            },
            targetFormat,
            targetFormat === "image/png" ? undefined : qFloat
          );
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = originalUrl;
      });
    },
    [quality, targetFormat, maxDimension]
  );

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setProcessing(true);

    const validFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const results: ProcessedImage[] = [];

    for (const f of validFiles) {
      try {
        const item = await compressSingleImage(f);
        results.push(item);
      } catch (err) {
        console.error("Compression error", err);
      }
    }

    setImages((prev) => [...results, ...prev]);
    if (results.length > 0) {
      setActiveImageId(results[0].id);
    }
    setProcessing(false);
  };

  const activeImage = images.find((i) => i.id === activeImageId) || images[0] || null;

  const downloadImage = (img: ProcessedImage) => {
    const ext = img.format.toLowerCase();
    const baseName = img.name.replace(/\.[^/.]+$/, "");
    const a = document.createElement("a");
    a.href = img.compressedUrl;
    a.download = `${baseName}-compressed.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAll = () => {
    images.forEach((img) => downloadImage(img));
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((i) => i.id !== id));
    if (activeImageId === id) {
      setActiveImageId(images.find((i) => i.id !== id)?.id || null);
    }
  };

  const clearAll = () => {
    images.forEach((img) => {
      URL.revokeObjectURL(img.originalUrl);
      URL.revokeObjectURL(img.compressedUrl);
    });
    setImages([]);
    setActiveImageId(null);
  };

  return (
    <div className="space-y-8">
      {/* Privacy Guarantee Pill */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              100% In-Browser Privacy
            </h4>
            <p className="text-[11px] text-slate-300">
              Your photos are processed entirely on your device via HTML5 Canvas. Zero bytes leave your browser.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30">
          Client-Side Only
        </span>
      </div>

      {/* Main Grid: Controls + Dropzone on Left, Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controls & Upload (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Compression Settings Panel */}
          <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-hub-gold font-bold flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                <span>Compression Parameters</span>
              </h3>
            </div>

            {/* Quality Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-hub-text-secondary uppercase">Image Quality</span>
                <span className="text-hub-gold font-bold">{quality}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-hub-text-muted font-mono">
                <span>Smallest File (10%)</span>
                <span>Balanced (80%)</span>
                <span>Crisp (100%)</span>
              </div>
            </div>

            {/* Target Format */}
            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase text-hub-text-secondary">
                Output Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "image/webp", label: "WebP", sub: "Ultra small" },
                  { id: "image/jpeg", label: "JPEG", sub: "Standard" },
                  { id: "image/png", label: "PNG", sub: "Lossless" },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => setTargetFormat(fmt.id as any)}
                    className={`py-2 px-2.5 rounded-xl text-center border transition-all ${
                      targetFormat === fmt.id
                        ? "border-hub-gold bg-amber-500/10 text-white font-bold"
                        : "border-white/10 text-hub-text-secondary hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="text-xs font-mono font-bold">{fmt.label}</div>
                    <div className="text-[9px] text-hub-text-muted">{fmt.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Max Resolution / Resize */}
            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase text-hub-text-secondary">
                Max Dimension (Resize)
              </label>
              <select
                value={maxDimension}
                onChange={(e) => setMaxDimension(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-hub-gold"
              >
                <option value={0}>Original Resolution (No Resize)</option>
                <option value={3840}>4K Ultra HD (3840px)</option>
                <option value={1920}>Full HD (1920px - Recommended)</option>
                <option value={1280}>HD (1280px - Web &amp; Mobile)</option>
                <option value={800}>Compact Web (800px)</option>
                <option value={400}>Passport / Avatar (400px)</option>
              </select>
            </div>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
              isDragOver
                ? "border-amber-400 bg-amber-500/10 scale-[1.01]"
                : "border-white/15 bg-black/40 hover:bg-white/[0.02] hover:border-hub-gold/50"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFiles(e.target.files)}
              multiple
              accept="image/*"
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-3 text-hub-gold">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              Drop images here or <span className="text-hub-gold underline">browse</span>
            </h4>
            <p className="text-xs text-hub-text-secondary max-w-xs mx-auto">
              Supports JPG, PNG, WEBP, GIF. Multiple images supported.
            </p>
          </div>
        </div>

        {/* Results & Inspection (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {images.length > 0 ? (
            <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
              {/* Top toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <span>Processed Files ({images.length})</span>
                  </h3>
                  <p className="text-xs text-hub-text-muted mt-0.5">
                    Click any item to view comparison
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold text-xs shadow-md"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download All</span>
                  </button>
                  <button
                    onClick={clearAll}
                    className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-rose-500/20 text-hub-text-muted hover:text-rose-400 transition-colors"
                    title="Clear all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Active Image Hero Comparison */}
              {activeImage && (
                <div className="space-y-6">
                  {/* Before / After Metrics Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-black/50 border border-white/[0.08] rounded-2xl p-4">
                      <span className="text-[10px] font-mono text-hub-text-muted uppercase">Original</span>
                      <div className="text-lg font-bold font-mono text-slate-300">
                        {formatBytes(activeImage.originalSize)}
                      </div>
                      <p className="text-[10px] text-hub-text-muted">
                        {activeImage.originalWidth} &times; {activeImage.originalHeight}px
                      </p>
                    </div>

                    <div className="bg-black/50 border border-emerald-500/30 rounded-2xl p-4">
                      <span className="text-[10px] font-mono text-emerald-400 uppercase">Compressed</span>
                      <div className="text-lg font-bold font-mono text-emerald-400">
                        {formatBytes(activeImage.compressedSize)}
                      </div>
                      <p className="text-[10px] text-hub-text-muted">
                        {activeImage.compressedWidth} &times; {activeImage.compressedHeight}px
                      </p>
                    </div>

                    <div className="col-span-2 sm:col-span-1 bg-emerald-950/50 border border-emerald-500/40 rounded-2xl p-4 flex flex-col justify-center items-center text-center">
                      <span className="text-[10px] font-mono text-emerald-300 uppercase">Reduction</span>
                      <div className="text-2xl font-black font-mono text-emerald-400">
                        {activeImage.originalSize > activeImage.compressedSize
                          ? `-${Math.round(
                              ((activeImage.originalSize - activeImage.compressedSize) /
                                activeImage.originalSize) *
                                100
                            )}%`
                          : "0%"}
                      </div>
                      <p className="text-[9px] text-emerald-300/70 font-mono">
                        Saved in {activeImage.durationMs}ms
                      </p>
                    </div>
                  </div>

                  {/* Visual Preview Box */}
                  <div className="relative rounded-2xl overflow-hidden bg-black/80 border border-white/10 p-3 flex items-center justify-center min-h-[260px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeImage.compressedUrl}
                      alt={activeImage.name}
                      className="max-h-72 max-w-full object-contain rounded-xl"
                    />
                  </div>

                  {/* Download single button */}
                  <button
                    onClick={() => downloadImage(activeImage)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg"
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      Download Compressed {activeImage.format} ({formatBytes(activeImage.compressedSize)})
                    </span>
                  </button>
                </div>
              )}

              {/* Thumbnails strip (if multiple) */}
              {images.length > 1 && (
                <div className="pt-4 border-t border-white/[0.08] space-y-2">
                  <span className="text-[11px] font-mono text-hub-text-secondary uppercase">
                    All Images In Queue:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {images.map((img) => (
                      <div
                        key={img.id}
                        onClick={() => setActiveImageId(img.id)}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                          activeImageId === img.id
                            ? "border-hub-gold bg-amber-500/10"
                            : "border-white/10 bg-black/40 hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="truncate mr-2">
                          <p className="text-xs font-bold text-white truncate">{img.name}</p>
                          <p className="text-[10px] font-mono text-emerald-400">
                            {formatBytes(img.compressedSize)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(img.id);
                          }}
                          className="text-hub-text-muted hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel rounded-3xl p-12 text-center text-hub-text-secondary space-y-4">
              <ImageIcon className="w-14 h-14 text-hub-gold/30 mx-auto" />
              <div>
                <h3 className="text-lg font-bold text-white">No images uploaded yet</h3>
                <p className="text-xs text-hub-text-muted max-w-sm mx-auto mt-1">
                  Upload any photo or document screenshot to compress its file size by up to 90% without visible quality loss.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

