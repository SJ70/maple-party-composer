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

export function BossImage({ src }: { src: string | undefined }) {
  return src ? <img className="boss-image" src={src} alt="" /> : <span className="boss-image" />
}

/** 이미지 · 난이도 배지 · 보스 이름 · 목표배율. target = 목표배율 자리 (결과는 값, 입력 그리드는 입력칸) */
export function BossCard({ boss, target }: { boss: Boss; target: ReactNode }) {
  return (
    <div className="result-card result-boss">
      <BossImage src={boss.image} />
      <DifficultyBadge difficulty={boss.difficulty} />
      <strong className="result-name">{boss.bossName}</strong>
      <span className="result-target">
        <span className="result-label">목표배율</span> {target}
      </span>
    </div>
  )
}
