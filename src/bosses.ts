/** 난이도 표시 순서 (보스 추가 시 버튼 순서) */
export const DIFFICULTIES = {
  easy: '이지',
  normal: '노말',
  hard: '하드',
  chaos: '카오스',
  extreme: '익스트림',
} as const
export type Difficulty = keyof typeof DIFFICULTIES

/** 보스 선택 목록 순서. 배율 입력·조합 결과도 이 순서 → 난이도 순. 이미지 = src/assets/bosses/{name}.webp */
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

/** 추가할 수 있는 보스 + 난이도 조합, 최대 인원 */
const AVAILABLE: [BossId, Difficulty, number][] = [
  ['baldrix', 'extreme', 3],
  ['limbo', 'extreme', 3],
  ['jupiter', 'hard', 3],
  ['kaling', 'extreme', 6],
  ['first-adversary', 'extreme', 3],
  ['kalos', 'extreme', 6],
  ['baldrix', 'hard', 3],
  ['bellona', 'hard', 3],
  ['limbo', 'hard', 3],
  ['malefic-star', 'hard', 3],
  ['jupiter', 'normal', 3],
  ['first-adversary', 'hard', 3],
  ['baldrix', 'normal', 3],
  ['kaling', 'hard', 6],
  ['chosen-seren', 'extreme', 6],
  ['black-mage', 'extreme', 6],
  ['limbo', 'normal', 3],
  ['kalos', 'chaos', 6],
  ['bellona', 'normal', 3],
  ['kaling', 'normal', 6],
  ['malefic-star', 'normal', 3],
  ['lotus', 'extreme', 2],
  ['first-adversary', 'normal', 3],
  ['kalos', 'normal', 6],
  ['bellona', 'easy', 3],
  ['kaling', 'easy', 6],
  ['chosen-seren', 'hard', 6],
  ['first-adversary', 'easy', 3],
  ['kalos', 'easy', 6],
  ['black-mage', 'hard', 6],
  ['chosen-seren', 'normal', 6],
  ['verus-hilla', 'hard', 6],
  ['darknell', 'hard', 6],
  ['gloom', 'chaos', 6],
  ['guardian-angel-slime', 'chaos', 6],
  ['will', 'hard', 6],
  ['lucid', 'hard', 6],
  ['verus-hilla', 'normal', 6],
  ['damien', 'hard', 6],
  ['lotus', 'hard', 6],
  ['darknell', 'normal', 6],
  ['gloom', 'normal', 6],
  ['lucid', 'normal', 6],
  ['will', 'normal', 6],
  ['will', 'easy', 6],
  ['lucid', 'easy', 6],
  ['guardian-angel-slime', 'normal', 6],
  ['lotus', 'normal', 6],
  ['damien', 'normal', 6],
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
  /** 최대 파티 인원 */
  maxPlayers: number
  /** 정렬 순서 (보스 선택 목록 순 → 난이도 순) */
  order: number
}

export const presetId = (bossId: string, difficulty: Difficulty) => `${bossId}-${difficulty}`

const maxPlayersById = new Map(AVAILABLE.map(([bossId, difficulty, max]) => [presetId(bossId, difficulty), max]))

/** 보스 선택 목록. 각 보스의 난이도는 이지 → 익스트림 순 */
export const BOSS_OPTIONS = BOSSES.map((b) => ({
  ...b,
  image: images[b.name],
  difficulties: (Object.keys(DIFFICULTIES) as Difficulty[]).filter((d) => maxPlayersById.has(presetId(b.id, d))),
}))

export const PRESETS = new Map<string, BossPreset>(
  BOSS_OPTIONS.flatMap((boss) => boss.difficulties.map((difficulty) => ({ boss, difficulty }))).map(
    ({ boss, difficulty }, order) => {
      const id = presetId(boss.id, difficulty)
      const name = `${DIFFICULTIES[difficulty]} ${boss.name}`
      return [id, { id, bossId: boss.id, bossName: boss.name, difficulty, name, image: boss.image, maxPlayers: maxPlayersById.get(id)!, order }]
    },
  ),
)
