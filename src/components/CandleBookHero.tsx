import React from "react";

export const CandleBookHero: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <svg
      viewBox="0 0 400 320"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="어둠을 밝히는 촛불과 펼쳐진 책"
    >
      <defs>
        {/* Warm candle glow */}
        <radialGradient id="glow" cx="50%" cy="38%" r="55%">
          <stop offset="0%" stopColor="#FFE4A3" stopOpacity="0.95" />
          <stop offset="35%" stopColor="#E8B560" stopOpacity="0.55" />
          <stop offset="70%" stopColor="#7A4A1E" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#1A0F08" stopOpacity="0" />
        </radialGradient>
        {/* Flame gradient */}
        <radialGradient id="flame" cx="50%" cy="65%" r="60%">
          <stop offset="0%" stopColor="#FFF6D5" />
          <stop offset="35%" stopColor="#FFD46A" />
          <stop offset="75%" stopColor="#E8843B" />
          <stop offset="100%" stopColor="#8C3A1A" stopOpacity="0.6" />
        </radialGradient>
        {/* Candle wax */}
        <linearGradient id="wax" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3A2E20" />
          <stop offset="35%" stopColor="#EFE0C2" />
          <stop offset="55%" stopColor="#FBF1D9" />
          <stop offset="80%" stopColor="#C9B589" />
          <stop offset="100%" stopColor="#2E2418" />
        </linearGradient>
        {/* Book page */}
        <linearGradient id="page" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FBF5E4" />
          <stop offset="100%" stopColor="#D9C9A0" />
        </linearGradient>
        {/* Book cover */}
        <linearGradient id="cover" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6B4A2B" />
          <stop offset="100%" stopColor="#3A2814" />
        </linearGradient>
      </defs>

      {/* Dark background */}
      <rect width="400" height="320" fill="#15110B" />

      {/* Ambient glow */}
      <ellipse cx="200" cy="130" rx="220" ry="180" fill="url(#glow)" />

      {/* Candle */}
      <g>
        {/* Candle body */}
        <rect x="186" y="80" width="28" height="105" rx="2" fill="url(#wax)" />
        {/* Wax drip */}
        <path d="M 192 165 Q 194 178 198 182 Q 200 172 199 165 Z" fill="#FBF1D9" opacity="0.85" />
        <path d="M 210 155 Q 213 170 216 174 Q 215 162 213 155 Z" fill="#EFE0C2" opacity="0.8" />
        {/* Candle top rim */}
        <ellipse cx="200" cy="80" rx="14" ry="3.5" fill="#A0875A" />
        <ellipse cx="200" cy="79" rx="14" ry="2.5" fill="#1A0F08" opacity="0.55" />
        {/* Wick */}
        <rect x="199" y="68" width="2" height="11" fill="#2A1A0A" />
        {/* Flame */}
        <g>
          <ellipse cx="200" cy="55" rx="11" ry="20" fill="url(#flame)">
            <animate
              attributeName="ry"
              values="20;22;19;21;20"
              dur="2.4s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="rx"
              values="11;10;11.5;10.5;11"
              dur="2.4s"
              repeatCount="indefinite"
            />
          </ellipse>
          {/* Inner core */}
          <ellipse cx="200" cy="60" rx="4" ry="8" fill="#FFFCEB" opacity="0.95">
            <animate
              attributeName="ry"
              values="8;9;7.5;8.5;8"
              dur="2.4s"
              repeatCount="indefinite"
            />
          </ellipse>
        </g>
      </g>

      {/* Open book */}
      <g transform="translate(200 245)">
        {/* Book shadow */}
        <ellipse cx="0" cy="42" rx="155" ry="9" fill="#000" opacity="0.55" />

        {/* Book cover (back) */}
        <path
          d="M -148 30 L -148 12 Q -148 6 -140 4 L 140 4 Q 148 6 148 12 L 148 30 Z"
          fill="url(#cover)"
        />

        {/* Left page */}
        <path
          d="M -140 6 L -4 -2 L -4 28 L -140 22 Z"
          fill="url(#page)"
          stroke="#A88E5C"
          strokeWidth="0.6"
        />
        {/* Right page */}
        <path
          d="M 140 6 L 4 -2 L 4 28 L 140 22 Z"
          fill="url(#page)"
          stroke="#A88E5C"
          strokeWidth="0.6"
        />

        {/* Center binding shadow */}
        <path d="M -4 -2 L -4 28 L 4 28 L 4 -2 Z" fill="#3A2814" opacity="0.55" />

        {/* Latin text lines — left page */}
        <g stroke="#5A4222" strokeWidth="0.7" strokeLinecap="round" opacity="0.75">
          <line x1="-128" y1="6" x2="-18" y2="2" />
          <line x1="-128" y1="11" x2="-18" y2="7" />
          <line x1="-128" y1="16" x2="-30" y2="12" />
          <line x1="-128" y1="21" x2="-18" y2="17" />
        </g>
        {/* Latin text lines — right page */}
        <g stroke="#5A4222" strokeWidth="0.7" strokeLinecap="round" opacity="0.75">
          <line x1="18" y1="2" x2="128" y2="6" />
          <line x1="18" y1="7" x2="128" y2="11" />
          <line x1="18" y1="12" x2="115" y2="16" />
          <line x1="18" y1="17" x2="128" y2="21" />
        </g>

        {/* Drop cap / illuminated initial on left page */}
        <text
          x="-122"
          y="8"
          fontFamily="Playfair Display, Georgia, serif"
          fontSize="9"
          fontStyle="italic"
          fontWeight="700"
          fill="#8C3A1A"
        >
          V
        </text>
      </g>
    </svg>
  );
};
