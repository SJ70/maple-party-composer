import type { ReactNode } from 'react'
import { DIFFICULTIES, type Difficulty } from '../bosses.ts'
import type { Boss } from '../types.ts'

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className={`difficulty ${difficulty}`} title={DIFFICULTIES[difficulty]}>
      {difficulty.toUpperCase()}
    </span>
  )
}

export function BossImage({ src, alt = '' }: { src: string | undefined; alt?: string }) {
  return src ? <img className="boss-image" src={src} alt={alt} /> : <span className="boss-image" />
}

/**
 * 이미지 · 난이도 배지 · 목표인원 · 목표배율. 보스 이름은 화면에 안 쓰고 이미지 대체 텍스트 · 툴팁으로만.
 * players / target = 목표인원 / 목표배율 자리 (결과는 값, 입력 그리드는 입력칸)
 */
export function BossCard({ boss, players, target }: { boss: Boss; players: ReactNode; target: ReactNode }) {
  return (
    <div className="result-card result-boss" title={boss.name}>
      <BossImage src={boss.image} alt={boss.name} />
      <DifficultyBadge difficulty={boss.difficulty} />
      <span className="result-target">
        <span className="result-label">목표인원</span> {players}
      </span>
      <span className="result-target">
        <span className="result-label">목표배율</span> {target}
      </span>
    </div>
  )
}
