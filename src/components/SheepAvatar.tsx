import React from "react";

interface SheepAvatarProps {
  className?: string;
  variant?: "tech" | "natural";
}

export default function SheepAvatar({
  className = "",
  variant = "tech",
}: SheepAvatarProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="Woolly - CodeVanta AI Assistant Mascot"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Background Ambient Glow */}
        <radialGradient id="woollyGlow" cx="50%" cy="42%" r="52%">
          <stop offset="0%" stopColor="#ff2a5f" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#ff2a5f" stopOpacity="0" />
        </radialGradient>

        {/* Housing Background Gradient */}
        <linearGradient id="woollyBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1c2433" />
          <stop offset="100%" stopColor="#0a0d13" />
        </linearGradient>

        {/* Obsidian Charcoal Wool Gradient */}
        <linearGradient id="woollyWool" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2e3a4e" />
          <stop offset="55%" stopColor="#18202c" />
          <stop offset="100%" stopColor="#0c1117" />
        </linearGradient>

        {/* Fluffy Wool Highlight */}
        <linearGradient id="woollyWoolHighlight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3c4b63" />
          <stop offset="100%" stopColor="#232d3d" />
        </linearGradient>

        {/* Face Gradient */}
        <linearGradient id="woollyFace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#354053" />
          <stop offset="100%" stopColor="#1c232f" />
        </linearGradient>

        {/* Ruby Brand Accent Gradient */}
        <linearGradient id="woollyRuby" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff386b" />
          <stop offset="100%" stopColor="#c9003d" />
        </linearGradient>
      </defs>

      {/* Badge Outer Ring & Backdrop */}
      <circle cx="32" cy="32" r="30" fill="url(#woollyBg)" stroke="#2b3648" strokeWidth="1.5" />
      <circle cx="32" cy="30" r="21" fill="url(#woollyGlow)" />

      {/* Woolly Torso / Shoulders */}
      <ellipse cx="32" cy="56" rx="16" ry="7" fill="url(#woollyWool)" />

      {/* Fluffy Cloud Wool Clumps (Backdrop of Head) */}
      <circle cx="32" cy="18" r="8.5" fill="url(#woollyWool)" />
      <circle cx="23" cy="21" r="7.5" fill="url(#woollyWool)" />
      <circle cx="41" cy="21" r="7.5" fill="url(#woollyWool)" />
      <circle cx="16" cy="28" r="7" fill="url(#woollyWool)" />
      <circle cx="48" cy="28" r="7" fill="url(#woollyWool)" />
      <circle cx="17" cy="36" r="6.5" fill="url(#woollyWool)" />
      <circle cx="47" cy="36" r="6.5" fill="url(#woollyWool)" />

      {/* Drooping Sheep Ears */}
      {/* Left Ear */}
      <path
        d="M19 30 C9 31, 8 38, 17 37 Z"
        fill="#232c3a"
        stroke="#384556"
        strokeWidth="0.8"
      />
      <path d="M17 32 C11 33, 11 36, 16 35 Z" fill="#4a3443" />

      {/* Right Ear */}
      <path
        d="M45 30 C55 31, 56 38, 47 37 Z"
        fill="#232c3a"
        stroke="#384556"
        strokeWidth="0.8"
      />
      <path d="M47 32 C53 33, 53 36, 48 35 Z" fill="#4a3443" />

      {/* Face Contour */}
      <path
        d="M23 26 C23 22, 41 22, 41 26 C41 33, 43 41, 38 46 C35 48.5, 29 48.5, 26 46 C21 41, 23 33, 23 26 Z"
        fill="url(#woollyFace)"
        stroke="#384556"
        strokeWidth="0.8"
      />

      {/* Forehead Wool Fringe / Fluffy Bangs */}
      <circle cx="27" cy="21" r="4.2" fill="url(#woollyWoolHighlight)" />
      <circle cx="32" cy="19" r="4.8" fill="url(#woollyWoolHighlight)" />
      <circle cx="37" cy="21" r="4.2" fill="url(#woollyWoolHighlight)" />
      <circle cx="32" cy="23.5" r="3.6" fill="#2a3547" />

      {/* Rosy Cheeks */}
      <ellipse cx="25" cy="39" rx="2.5" ry="1.4" fill="#ff2a5f" opacity="0.35" />
      <ellipse cx="39" cy="39" rx="2.5" ry="1.4" fill="#ff2a5f" opacity="0.35" />

      {/* Expressive Glossy Eyes */}
      {/* Left Eye */}
      <ellipse cx="27" cy="33.5" rx="3.2" ry="3.8" fill="#080a0f" />
      <circle cx="26" cy="32.2" r="1.3" fill="#ffffff" />
      <circle cx="28.2" cy="34.8" r="0.65" fill="#ffffff" />

      {/* Right Eye */}
      <ellipse cx="37" cy="33.5" rx="3.2" ry="3.8" fill="#080a0f" />
      <circle cx="36" cy="32.2" r="1.3" fill="#ffffff" />
      <circle cx="38.2" cy="34.8" r="0.65" fill="#ffffff" />

      {/* Friendly Eyebrows / Smile Creases */}
      <path
        d="M24.5 29.5 Q27 28.5 29.5 29.5"
        stroke="#526278"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
      <path
        d="M34.5 29.5 Q37 28.5 39.5 29.5"
        stroke="#526278"
        strokeWidth="0.9"
        strokeLinecap="round"
      />

      {/* Nose (Ruby Heart/Shield) */}
      <path d="M30 39 Q32 37.5 34 39 Q32 41 30 39 Z" fill="url(#woollyRuby)" />

      {/* Cheerful Smile */}
      <path
        d="M30 42 Q32 43.8 34 42"
        stroke="#d1d9e6"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path d="M32 40.5 V42.2" stroke="#d1d9e6" strokeWidth="1" strokeLinecap="round" />

      {/* AI Assistant Headset & Boom Mic (Tech Variant) */}
      {variant === "tech" && (
        <g id="woollyTechGear">
          {/* Over-head Band */}
          <path
            d="M19 28 C19 16.5, 45 16.5, 45 28"
            stroke="#4a596f"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Left Earpiece with Glowing Ruby Core */}
          <rect
            x="16.5"
            y="25.5"
            width="3.5"
            height="7"
            rx="1.75"
            fill="#1e2634"
            stroke="#ff2a5f"
            strokeWidth="1"
          />
          <circle cx="18.25" cy="29" r="1" fill="#ff2a5f" />

          {/* Right Earpiece */}
          <rect
            x="44"
            y="25.5"
            width="3.5"
            height="7"
            rx="1.75"
            fill="#1e2634"
            stroke="#ff2a5f"
            strokeWidth="1"
          />

          {/* Sleek Boom Mic */}
          <path
            d="M18.5 32 Q21 38 27 41.5"
            stroke="#4a596f"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <circle cx="27.5" cy="41.7" r="1.2" fill="#ff2a5f" />
        </g>
      )}
    </svg>
  );
}
