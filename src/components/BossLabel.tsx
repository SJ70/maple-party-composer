import { DIFFICULTIES, type Difficulty } from '../bosses.ts'
import type { Boss } from '../types.ts'

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className={`difficulty ${difficulty}`} title={DIFFICULTIES[difficulty]}>
      {difficulty.toUpperCase()}
    </span>
  )
}

export function BossImage({ src }: { src: string | undefined }) {
  return src ? <img className="boss-image" src={src} alt="" /> : <span className="boss-image" />
}

/** 이미지 + 보스 이름 + 난이도 배지 */
export function BossLabel({ boss }: { boss: Boss }) {
  return (
    <span className="boss-label">
      <BossImage src={boss.image} />
      <span className="boss-label-text">
        <strong>{boss.bossName}</strong>
        <DifficultyBadge difficulty={boss.difficulty} />
      </span>
    </span>
  )
}
