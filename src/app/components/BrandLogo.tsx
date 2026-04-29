import { useEffect, useState } from 'react'
import { useTheme } from '@mui/material/styles'

type BrandLogoProps = {
  height?: number
  alt?: string
  fallbackText?: string
  className?: string
}

const ITANIS_LOGO_PATH = '/itanis-logo.png'
const ITANIS_LOGO_DARK_PATH = '/itanis-logo-dark.png'

export function BrandLogo({
  height = 40,
  alt = 'ITANIS',
  fallbackText = 'ITANIS',
  className,
}: BrandLogoProps) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const preferredSrc = isDark ? ITANIS_LOGO_DARK_PATH : ITANIS_LOGO_PATH

  const [hasError, setHasError] = useState(false)
  const [src, setSrc] = useState(preferredSrc)

  useEffect(() => {
    setSrc(preferredSrc)
    setHasError(false)
  }, [preferredSrc])

  if (hasError) {
    return (
      <span
        className={className}
        style={{
          fontSize: Math.max(16, Math.round(height * 0.42)),
          fontWeight: 700,
          color: '#ef7c21',
          letterSpacing: '0.02em',
        }}
      >
        {fallbackText}
      </span>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      height={height}
      onError={() => {
        if (src === ITANIS_LOGO_DARK_PATH) {
          setSrc(ITANIS_LOGO_PATH)
          return
        }
        setHasError(true)
      }}
      className={className}
      style={{ inlineSize: 'auto', objectFit: 'contain' }}
    />
  )
}
