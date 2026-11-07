import type { BossSplit, PartySlot } from '../types.ts'
import { BossLabel } from './BossLabel.tsx'

const percent = (n: number) => `${Math.round(n)}%`
const sum = (slots: PartySlot[]) => slots.reduce((total, s) => total + s.ratio, 0)

function PartyBox({ title, slots, className = '' }: { title: string; slots: PartySlot[]; className?: string }) {
  return (
    <div className={`party ${className}`}>
      <div className="party-head">
        <strong>{title}</strong>
        <span>합계 {percent(sum(slots))}</span>
      </div>
      <ul>
        {slots.map((s) => (
          <li key={s.member.id}>
            {s.member.name} <span className="muted">{percent(s.ratio)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** 행 = 보스, 오른쪽으로 해당 보스의 파티들 */
export function PartyResults({ splits }: { splits: BossSplit[] }) {
  if (splits.length === 0) return null

  return (
    <section className="card">
      <h2>파티 조합</h2>
      <div className="results">
        {splits.map(({ boss, parties, unassigned }) => (
          <div key={boss.id} className="result-row">
            <div className="result-boss">
              <BossLabel boss={boss} />
              <span className="muted">목표 {percent(boss.targetRatio)}</span>
            </div>
            <div className="result-parties">
              {parties.length === 0 && unassigned.length === 0 && <p className="muted">참여 인원 없음</p>}
              {parties.map((party, i) => (
                <PartyBox key={i} title={`파티 ${i + 1}`} slots={party.slots} />
              ))}
              {unassigned.length > 0 && <PartyBox title="클리어 불가" slots={unassigned} className="unassigned" />}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
