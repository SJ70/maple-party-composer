/** 유저 색상. 유저 순서대로 빨 · 주 · 노 · 초 · 파 · 남 · 보, 넘치면 처음부터 반복 */
const RAINBOW = ['#e5484d', '#f2811d', '#f2c200', '#30a46c', '#3b82f6', '#4353c4', '#8e4ec6']

export const userColor = (index: number) => RAINBOW[index % RAINBOW.length]

/** userId → 색상 */
export const userColors = (users: { id: string }[]) => new Map(users.map((u, i) => [u.id, userColor(i)]))
