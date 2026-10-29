import React from "react";

interface SheepAvatarProps {
  className?: string;
  variant?: "tech" | "natural";
}

export default function SheepAvatar({
  className = "h-10 w-10",
}: SheepAvatarProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden border border-white/20 bg-hub-surface-card shadow-md shadow-black/40 select-none ${className}`}
      role="img"
      aria-label="Woolly - CodeVanta AI Assistant Mascot"
    >
      <img
        src="/woolly-avatar-sq.jpg"
        alt="Woolly AI Assistant Mascot"
        className="h-full w-full object-cover object-center pointer-events-none"
        loading="eager"
      />
    </div>
  );
}
