import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

/** index.html 의 초기 테마 스크립트와 같은 키 */
const STORAGE_KEY = 'maple-party-split:theme'
const systemDark = () => matchMedia('(prefers-color-scheme: dark)')

const readSaved = (): Theme | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'light' || saved === 'dark' ? saved : null
  } catch {
    return null
  }
}

/** 라이트 · 다크 전환 버튼. 직접 고르기 전까지는 시스템 설정을 따라감 */
export function ThemeToggle() {
  // 초기값은 index.html 스크립트가 <html data-theme> 에 정해 둔 값
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  // 저장된 선택이 없을 때만 시스템 설정 변경을 반영
  useEffect(() => {
    const media = systemDark()
    const follow = () => {
      if (!readSaved()) setTheme(media.matches ? 'dark' : 'light')
    }
    media.addEventListener('change', follow)
    return () => media.removeEventListener('change', follow)
  }, [])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // 저장 실패는 무시
    }
  }

  const label = theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'

  return (
    <button className="theme-toggle" onClick={toggle} aria-label={label} title={label}>
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}

// 아이콘: Feather Icons (MIT) https://feathericons.com
const iconProps = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

const SunIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
)

const MoonIcon = () => (
  <svg {...iconProps}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)
