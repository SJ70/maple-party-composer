import type { Boss, BossSplit, Member, PartySlot } from '../types.ts'
import { BossImage, DifficultyBadge } from './BossLabel.tsx'

const percent = (n: number, digits = 0) => `${n.toFixed(digits)}%`
const sum = (slots: PartySlot[]) => slots.reduce((total, s) => total + s.ratio, 0)

/** 이름 첫 글자 + id 기반 고정 색상 */
function Avatar({ member }: { member: Member }) {
  const hue = [...member.id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 0)
  return (
    <span className="avatar" style={{ background: `hsl(${hue} 55% 55%)` }} aria-hidden>
      <span>{member.name.trim().charAt(0) || '?'}</span>
    </span>
  )
}

function BossCard({ boss }: { boss: Boss }) {
  return (
    <div className="result-card result-boss">
      <BossImage src={boss.image} />
      <DifficultyBadge difficulty={boss.difficulty} />
      <strong className="result-name">{boss.bossName}</strong>
      <span className="result-target">
        <span className="result-label">목표배율</span> <span className="result-value">{percent(boss.targetRatio)}</span>
      </span>
    </div>
  )
}

/** 상단 파티 배율 합계, 아래로 멤버별 아바타 · 이름 · 솔플배율 · 딜점유율(솔플배율 / 합계) */
function PartyCard({ title, slots, className = '' }: { title: string; slots: PartySlot[]; className?: string }) {
  const total = sum(slots)
  return (
    <div className={`result-card party ${className}`}>
      <div className="party-head">
        <span className="result-label">{title}</span>
        <span className="result-value">{percent(total, 2)}</span>
      </div>
      <ul className="party-members">
        {slots.map((s) => (
          <li key={s.member.id}>
            <Avatar member={s.member} />
            <strong className="result-name">{s.member.name}</strong>
            <dl>
              <dt className="result-label">솔플배율</dt>
              <dd className="result-value">{percent(s.ratio, 2)}</dd>
              <dt className="result-label">딜점유율</dt>
              <dd className="result-value">{percent(total > 0 ? (s.ratio / total) * 100 : 0, 2)}</dd>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** 행 = 보스, 보스 카드 오른쪽으로 해당 보스의 파티 카드들 */
export function PartyResults({ splits }: { splits: BossSplit[] }) {
  if (splits.length === 0) return null

  return (
    <section className="card">
      <h2>최적 파티 조합</h2>
      <div className="results">
        {splits.map(({ boss, parties, unassigned }) => (
          <div key={boss.id} className="result-row">
            <BossCard boss={boss} />
            <div className="result-parties">
              {parties.length === 0 && unassigned.length === 0 && (
                <div className="result-card result-empty muted">참여 인원 없음</div>
              )}
              {parties.map((party, i) => (
                <PartyCard key={i} title="파티배율" slots={party.slots} />
              ))}
              {unassigned.length > 0 && <PartyCard title="클리어 불가" slots={unassigned} className="unassigned" />}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
