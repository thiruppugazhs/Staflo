import React from 'react'
import { useThemeStore, THEME_PALETTES } from '../stores/theme'

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string
  primaryColor?: string
  accentColor?: string
  className?: string
  showText?: boolean
  textColor?: string
}

/**
 * Modern Geometric "S" Flow Emblem for Staflo
 * Pure vector typography-based "S" with smooth curves and dynamic theme color support.
 */
export function StafloIcon({
  size = 32,
  primaryColor,
  accentColor,
  className = '',
  ...props
}: LogoProps) {
  const { themeId, isDark } = useThemeStore()
  const activePalette = THEME_PALETTES.find((p) => p.id === themeId) || THEME_PALETTES[0]

  const topColor = primaryColor || activePalette.primary
  const bottomColor = accentColor || (isDark ? '#FFFFFF' : activePalette.accent)

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-all duration-300 ${className}`}
      role="img"
      aria-label="staflo S emblem"
      {...props}
    >
      <defs>
        <linearGradient id="staflo-s-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={topColor} />
          <stop offset="100%" stopColor={bottomColor} />
        </linearGradient>
      </defs>

      {/* Upper Flowing 'S' Loop */}
      <path
        d="M 68 16
           C 74 16 78 20 78 26
           C 78 32 74 36 68 36
           L 44 36
           C 36 36 30 42 30 50
           C 30 58 36 64 44 64
           L 56 64
           C 68 64 78 74 78 86
           C 78 98 68 108 56 108
           L 32 108"
        fill="none"
        stroke="url(#staflo-s-gradient)"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="hidden"
      />

      {/* Solid Geometric 'S' Wave Form */}
      <path
        d="M 68 14
           C 80 14 88 23 88 34
           C 88 45 80 54 68 54
           L 48 54
           C 42 54 38 58 38 64
           C 38 70 42 74 48 74
           L 72 74
           C 77 74 81 78 81 83
           C 81 88 77 92 72 92
           L 32 92
           C 20 92 12 83 12 72
           C 12 61 20 52 32 52
           L 52 52
           C 58 52 62 48 62 42
           C 62 36 58 32 52 32
           L 28 32
           C 23 32 19 28 19 23
           C 19 18 23 14 28 14
           L 68 14
           Z"
        fill="url(#staflo-s-gradient)"
      />

      {/* Dynamic Inner Contrast Dot */}
      <circle
        cx="72"
        cy="34"
        r="4.5"
        fill="#FFFFFF"
        opacity="0.9"
      />
      <circle
        cx="28"
        cy="72"
        r="4.5"
        fill="#FFFFFF"
        opacity="0.9"
      />
    </svg>
  )
}

/**
 * Full Staflo Logo & Thin Wordmark
 */
export default function StafloLogo({
  size = 32,
  primaryColor,
  accentColor,
  className = '',
  showText = false,
  textColor,
}: LogoProps) {
  const { themeId, isDark } = useThemeStore()
  const activePalette = THEME_PALETTES.find((p) => p.id === themeId) || THEME_PALETTES[0]

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <StafloIcon
        size={size}
        primaryColor={primaryColor}
        accentColor={accentColor}
      />
      {showText && (
        <span
          className={`font-logo tracking-tight leading-none lowercase ${
            textColor || 'text-zinc-900 dark:text-zinc-100'
          }`}
          style={{
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
            fontWeight: 500,
            fontSize: '1.45rem',
            letterSpacing: '-0.03em',
          }}
        >
          staflo
        </span>
      )}
    </div>
  )
}
