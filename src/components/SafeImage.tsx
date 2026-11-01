"use client";

import { useState } from "react";

interface SafeImageProps {
  src: string;
  fallbackSrc: string;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
  sizes?: string;
}

export default function SafeImage({
  src,
  fallbackSrc,
  alt,
  className,
  loading = "lazy",
  sizes,
}: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`${className || ""} bg-hub-surface-elevated flex items-center justify-center text-hub-text-muted`}
      >
        <span className="text-xs font-mono text-center px-3">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      sizes={sizes}
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        } else {
          setFailed(true);
        }
      }}
    />
  );
}
