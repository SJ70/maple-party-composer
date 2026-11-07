/** 난이도 표시 순서 (보스 추가 시 버튼 순서) */
export const DIFFICULTIES = {
  easy: '이지',
  normal: '노말',
  hard: '하드',
  chaos: '카오스',
  extreme: '익스트림',
} as const
export type Difficulty = keyof typeof DIFFICULTIES

/** 보스 선택 목록 순서. 이미지 = src/assets/bosses/{name}.webp */
const BOSSES = [
  { id: 'lotus', name: '스우' },
  { id: 'damien', name: '데미안' },
  { id: 'guardian-angel-slime', name: '가디언 엔젤 슬라임' },
  { id: 'lucid', name: '루시드' },
  { id: 'will', name: '윌' },
  { id: 'gloom', name: '더스크' },
  { id: 'darknell', name: '듄켈' },
  { id: 'verus-hilla', name: '진 힐라' },
  { id: 'black-mage', name: '검은 마법사' },
  { id: 'chosen-seren', name: '선택받은 세렌' },
  { id: 'kalos', name: '감시자 칼로스' },
  { id: 'first-adversary', name: '최초의 대적자' },
  { id: 'kaling', name: '카링' },
  { id: 'malefic-star', name: '찬란한 흉성' },
  { id: 'bellona', name: '벨로나' },
  { id: 'limbo', name: '림보' },
  { id: 'baldrix', name: '발드릭스' },
  { id: 'jupiter', name: '유피테르' },
] as const
type BossId = (typeof BOSSES)[number]['id']

/** 조합 결과 정렬 순서. 여기 있는 조합만 추가할 수 있다 */
const RESULT_ORDER: [BossId, Difficulty][] = [
  ['baldrix', 'extreme'],
  ['limbo', 'extreme'],
  ['jupiter', 'hard'],
  ['kaling', 'extreme'],
  ['first-adversary', 'extreme'],
  ['kalos', 'extreme'],
  ['baldrix', 'hard'],
  ['bellona', 'hard'],
  ['limbo', 'hard'],
  ['malefic-star', 'hard'],
  ['jupiter', 'normal'],
  ['first-adversary', 'hard'],
  ['baldrix', 'normal'],
  ['kaling', 'hard'],
  ['chosen-seren', 'extreme'],
  ['black-mage', 'extreme'],
  ['limbo', 'normal'],
  ['kalos', 'chaos'],
  ['bellona', 'normal'],
  ['kaling', 'normal'],
  ['malefic-star', 'normal'],
  ['lotus', 'extreme'],
  ['first-adversary', 'normal'],
  ['kalos', 'normal'],
  ['bellona', 'easy'],
  ['kaling', 'easy'],
  ['chosen-seren', 'hard'],
  ['first-adversary', 'easy'],
  ['kalos', 'easy'],
  ['black-mage', 'hard'],
  ['chosen-seren', 'normal'],
  ['verus-hilla', 'hard'],
  ['darknell', 'hard'],
  ['gloom', 'chaos'],
  ['guardian-angel-slime', 'chaos'],
  ['will', 'hard'],
  ['lucid', 'hard'],
  ['verus-hilla', 'normal'],
  ['damien', 'hard'],
  ['lotus', 'hard'],
  ['darknell', 'normal'],
  ['gloom', 'normal'],
  ['lucid', 'normal'],
  ['will', 'normal'],
  ['will', 'easy'],
  ['lucid', 'easy'],
  ['guardian-angel-slime', 'normal'],
  ['lotus', 'normal'],
  ['damien', 'normal'],
]

const images = Object.fromEntries(
  Object.entries(import.meta.glob<string>('./assets/bosses/*.webp', { eager: true, import: 'default' })).map(
    ([path, url]) => [path.replace(/^.*\/|\.webp$/g, ''), url],
  ),
)

/** 보스 + 난이도 한 항목. id = `${bossId}-${difficulty}` (예: verus-hilla-hard) */
export type BossPreset = {
  id: string
  bossId: BossId
  bossName: string
  difficulty: Difficulty
  /** 예: 하드 루시드 */
  name: string
  image: string | undefined
  /** 조합 결과 정렬 순서 */
  order: number
}

export const presetId = (bossId: string, difficulty: Difficulty) => `${bossId}-${difficulty}`

export const PRESETS = new Map<string, BossPreset>(
  RESULT_ORDER.map(([bossId, difficulty], order) => {
    const boss = BOSSES.find((b) => b.id === bossId)!
    const id = presetId(bossId, difficulty)
    const name = `${DIFFICULTIES[difficulty]} ${boss.name}`
    return [id, { id, bossId, bossName: boss.name, difficulty, name, image: images[boss.name], order }]
  }),
)

/** 보스 선택 목록. 각 보스의 난이도는 이지 → 익스트림 순 */
export const BOSS_OPTIONS = BOSSES.map((b) => ({
  ...b,
  image: images[b.name],
  difficulties: (Object.keys(DIFFICULTIES) as Difficulty[]).filter((d) => PRESETS.has(presetId(b.id, d))),
}))
