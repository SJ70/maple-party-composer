import { useEffect, useState } from 'react'

/**
 * localStorage에 저장되는 state. 저장소를 못 쓰는 환경에서는 일반 state로 동작.
 * migrate: 저장된 값을 현재 형태로 변환 (이전 버전 데이터 호환)
 */
export function useStoredState<T>(key: string, initial: T, migrate: (saved: unknown) => T = (saved) => saved as T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key)
      return saved ? migrate(JSON.parse(saved)) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // 저장 실패는 무시
    }
  }, [key, value])

  return [value, setValue] as const
}
