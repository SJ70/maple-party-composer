/**
 * 유저 색상. 인원 수만큼 색상환을 균등 분할해 색조를 배정한다 (빨강에서 시작).
 * OKLCH 를 써서 색조가 달라도 명도 · 채도가 눈으로 보기에 일정하게 유지된다.
 */
const START_HUE = 25 // OKLCH 기준 빨강
const LIGHTNESS = 0.75
const CHROMA = 0.13

export const userColor = (index: number, count: number) => {
  const hue = (START_HUE + (360 * index) / Math.max(count, 1)) % 360
  return `oklch(${LIGHTNESS} ${CHROMA} ${hue.toFixed(1)})`
}

/** userId → 색상 */
export const userColors = (users: { id: string }[]) => new Map(users.map((u, i) => [u.id, userColor(i, users.length)]))
