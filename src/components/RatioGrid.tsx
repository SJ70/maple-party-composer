import { CLEAR_THRESHOLD } from '../split.ts'
import type { Boss, Member, Ratios } from '../types.ts'

type Props = {
  members: Member[]
  bosses: Boss[]
  ratios: Ratios
  onAddMember: () => void
  onRenameMember: (id: string, name: string) => void
  onRemoveMember: (id: string) => void
  onAddBoss: () => void
  onChangeBoss: (id: string, patch: Partial<Omit<Boss, 'id'>>) => void
  onRemoveBoss: (id: string) => void
  onChangeRatio: (memberId: string, bossId: string, ratio: number | null) => void
}

/** 열 = 플레이어, 행 = 보스, 칸 = 플레이어의 보스 클리어 배율 */
export function RatioGrid({
  members,
  bosses,
  ratios,
  onAddMember,
  onRenameMember,
  onRemoveMember,
  onAddBoss,
  onChangeBoss,
  onRemoveBoss,
  onChangeRatio,
}: Props) {
  return (
    <section className="card">
      <div className="table-scroll">
        <table className="grid">
          <thead>
            <tr>
              <th className="corner" />
              {members.map((m) => (
                <th key={m.id} className="player-head">
                  <div className="head-box">
                    <input
                      value={m.name}
                      onChange={(e) => onRenameMember(m.id, e.target.value)}
                      aria-label="플레이어 이름"
                    />
                    <button className="ghost" onClick={() => onRemoveMember(m.id)} aria-label={`${m.name} 삭제`}>
                      ✕
                    </button>
                  </div>
                </th>
              ))}
              <th>
                <button className="add" onClick={onAddMember}>
                  + 플레이어
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {bosses.map((b) => (
              <tr key={b.id}>
                <th scope="row" className="boss-head">
                  <div className="head-box">
                    <input
                      value={b.name}
                      onChange={(e) => onChangeBoss(b.id, { name: e.target.value })}
                      aria-label="보스 이름"
                    />
                    <button className="ghost" onClick={() => onRemoveBoss(b.id)} aria-label={`${b.name} 삭제`}>
                      ✕
                    </button>
                  </div>
                  <label className="target-field">
                    목표
                    <input
                      type="number"
                      min={1}
                      defaultValue={b.targetRatio}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const v = Number(e.target.value)
                        if (v > 0) onChangeBoss(b.id, { targetRatio: v })
                      }}
                      onBlur={(e) => {
                        // 비우거나 0 이하로 두고 나가면 기본값으로
                        if (Number(e.target.value) > 0) return
                        e.target.value = String(CLEAR_THRESHOLD)
                        onChangeBoss(b.id, { targetRatio: CLEAR_THRESHOLD })
                      }}
                    />
                    %
                  </label>
                </th>
                {members.map((m) => (
                  <td key={m.id}>
                    <div className="ratio-cell">
                      <input
                        type="number"
                        min={0}
                        defaultValue={ratios[m.id]?.[b.id] ?? 0}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const v = Number(e.target.value)
                          // 0 이하 또는 빈 값 = 불참
                          onChangeRatio(m.id, b.id, v > 0 ? v : null)
                        }}
                        onBlur={(e) => {
                          if (e.target.value === '') e.target.value = '0'
                        }}
                        aria-label={`${m.name} ${b.name} 배율`}
                      />
                      <span className="unit">%</span>
                    </div>
                  </td>
                ))}
                <td />
              </tr>
            ))}
            <tr>
              <th scope="row">
                <button className="add" onClick={onAddBoss}>
                  + 보스
                </button>
              </th>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
