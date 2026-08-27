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
 * Exact Staflo 3D Isometric Ribbon & Prism Emblem
 * Matching the exact reference artwork in Image 2.
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

  const backColor = primaryColor || activePalette.primary
  const frontColor = accentColor || (isDark ? '#FFFFFF' : '#0B192C')

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-all duration-200 ${className}`}
      role="img"
      aria-label="staflo icon"
      {...props}
    >
      {/* Back Layer (Primary Theme Colored Curved Spine / Arch) */}
      <path
        d="M 32 30
           C 40 18 56 16 68 24
           L 72 27
           C 76 30 78 35 76 40
           C 74 44 69 46 64 43
           L 60 40
           C 53 35 44 36 39 42
           C 34 48 34 57 39 63
           L 44 68
           C 47 72 47 77 43 81
           C 39 85 34 84 30 80
           L 26 75
           C 16 64 16 46 28 34
           Z"
        fill={backColor}
      />

      {/* Front Layer (Folded Prism / Ribbon Facet) */}
      <path
        d="M 52 38
           C 56 34 63 35 67 39
           L 84 57
           C 92 65 92 78 84 86
           L 70 100
           C 66 104 59 104 55 100
           L 46 91
           C 43 88 43 83 46 79
           C 49 76 54 76 57 79
           L 62 84
           C 64 86 67 86 69 84
           L 78 75
           C 80 73 80 69 78 67
           L 65 54
           C 62 51 62 46 65 43
           C 67 40 70 40 73 43
           L 58 48
           C 54 49 50 46 49 42
           C 48 38 50 35 52 38
           Z"
        fill={frontColor}
      />

      {/* Clean Combined Solid Path matching Image 2 perfectly */}
      <g fillRule="evenodd" clipRule="evenodd">
        {/* Back curved spine (Theme Primary) */}
        <path
          d="M 28 42
             C 28 26 41 14 57 14
             C 65 14 73 17 78 23
             C 81 26 81 31 77 34
             C 74 37 69 36 66 33
             C 63 29 58 27 53 27
             C 42 27 34 35 34 46
             L 34 74
             C 34 85 42 93 53 93
             L 56 93
             C 61 93 65 97 65 102
             C 65 107 61 111 56 111
             L 53 111
             C 37 111 24 98 24 82
             L 24 54
             C 24 49 25 45 28 42
             Z"
          fill={backColor}
        />

        {/* Front folded facet & notch (Front Color / Accent) */}
        <path
          d="M 48 46
             C 48 38 54 32 62 32
             L 86 46
             C 93 50 97 58 97 66
             L 97 86
             C 97 94 92 101 84 105
             L 66 114
             C 61 116 55 113 54 107
             L 54 62
             C 54 58 57 55 61 55
             C 65 55 68 58 68 62
             L 68 98
             L 83 91
             C 84 90 85 88 85 86
             L 85 68
             C 85 65 83 62 80 60
             L 66 52
             C 62 50 60 48 60 46
             C 60 44 61 43 63 43
             L 76 39
             C 79 38 82 40 83 43
             C 84 46 82 49 79 50
             L 48 46
             Z"
          fill={frontColor}
        />
      </g>
    </svg>
  )
}

/**
 * Full Staflo Logo & Thin Geometric Wordmark
 * Displays the exact emblem and thin/clean `staflo` wordmark as shown in Image 2.
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
            fontWeight: 500, // Thin / Regular weight as requested (Image 2)
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
