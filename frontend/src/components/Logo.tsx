import React from 'react'

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string
  primaryColor?: string
  accentColor?: string
  className?: string
  showText?: boolean
  textColor?: string
}

export function StafloIcon({
  size = 32,
  primaryColor = 'var(--theme-primary, #004E72)',
  accentColor = 'var(--theme-accent, #FF6E42)',
  className = '',
  ...props
}: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-colors duration-300 ${className}`}
      role="img"
      aria-label="Staflo emblem"
      {...props}
    >
      {/* Dynamic Theme Gradient */}
      <defs>
        <linearGradient id="staflo-top-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={primaryColor} stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="staflo-bottom-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={accentColor} />
          <stop offset="100%" stopColor={primaryColor} />
        </linearGradient>
      </defs>

      {/* Top angled parallelogram slab */}
      <path
        d="M44 14 H68 C71 14 73.5 16 72.5 19 L48 43 C46.5 44.5 44 45 42 45 H30 C27 45 25 42.5 26.5 40 L41 16.5 C42 15 43 14 44 14 Z"
        fill="currentColor"
        style={{ fill: primaryColor }}
      />

      {/* Ribbon Fold Connector */}
      <path
        d="M44 38 L54 44 C56.5 45.5 58 48 58 51 L48 51 C45.5 51 43.5 49 42 47 L36 41 C38 39.5 41 38 44 38 Z"
        fill="currentColor"
        style={{ fill: primaryColor }}
        opacity="0.9"
      />

      {/* Bottom angled parallelogram slab */}
      <path
        d="M58 55 H70 C73 55 75 57.5 73.5 60 L59 83.5 C58 85 57 86 56 86 H32 C29 86 26.5 84 27.5 81 L52 57 C53.5 55.5 56 55 58 55 Z"
        fill="currentColor"
        style={{ fill: accentColor }}
      />
    </svg>
  )
}

export default function StafloLogo({
  size = 32,
  primaryColor,
  accentColor,
  className = '',
  showText = false,
  textColor,
}: LogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <StafloIcon size={size} primaryColor={primaryColor} accentColor={accentColor} />
      {showText && (
        <span
          className={`font-['Work_Sans',sans-serif] font-black text-xl tracking-tight leading-none ${
            textColor || 'text-zinc-900 dark:text-zinc-100'
          }`}
        >
          Staflo
        </span>
      )}
    </div>
  )
}
