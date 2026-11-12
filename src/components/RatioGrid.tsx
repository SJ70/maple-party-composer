import { CLEAR_THRESHOLD } from '../split.ts'
import type { CSSProperties } from 'react'
import type { Boss, Character, Ratios, StoredBoss, User } from '../types.ts'
import { userColors } from '../userColors.ts'
import { BossCard } from './BossLabel.tsx'
import { JobPortrait } from './JobPortrait.tsx'

type Props = {
  users: User[]
  characters: Character[]
  bosses: Boss[]
  ratios: Ratios
  onChangeBoss: (id: string, patch: Partial<Omit<StoredBoss, 'id'>>) => void
  onChangeRatio: (characterId: string, bossId: string, ratio: number | null) => void
}

/** 목표배율 입력칸. 비우거나 0 이하로 두고 나가면 기본값으로 */
function TargetInput({ boss, onChange }: { boss: Boss; onChange: (targetRatio: number) => void }) {
  return (
    <label className="percent-input ratio-input">
      <input
        type="number"
        min={1}
        defaultValue={boss.targetRatio}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const v = Number(e.target.value)
          if (v > 0) onChange(v)
        }}
        onBlur={(e) => {
          if (Number(e.target.value) > 0) return
          e.target.value = String(CLEAR_THRESHOLD)
          onChange(CLEAR_THRESHOLD)
        }}
        aria-label={`${boss.name} 목표배율`}
      />
      <span className="unit">%</span>
    </label>
  )
}

/** 목표인원 입력칸 (1 ~ 보스 최대 인원). 범위를 벗어난 값은 나갈 때 범위 안으로, 비우면 최대 인원으로 */
function PlayersInput({ boss, onChange }: { boss: Boss; onChange: (targetPlayers: number) => void }) {
  const clamp = (v: number) => Math.min(Math.max(Math.round(v), 1), boss.maxPlayers)
  return (
    <label className="percent-input ratio-input">
      <input
        type="number"
        min={1}
        max={boss.maxPlayers}
        step={1}
        defaultValue={boss.targetPlayers}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const v = Number(e.target.value)
          if (e.target.value !== '' && v >= 1) onChange(clamp(v))
        }}
        onBlur={(e) => {
          const v = e.target.value === '' ? boss.maxPlayers : clamp(Number(e.target.value))
          e.target.value = String(v)
          onChange(v)
        }}
        aria-label={`${boss.name} 목표인원`}
      />
      <span className="unit">명</span>
    </label>
  )
}

/** 열 = 보스, 행 = 캐릭터 (왼쪽 유저 색 띠로 유저별로 묶음), 칸 = 캐릭터의 보스 클리어 배율 */
export function RatioGrid({
  users,
  characters,
  bosses,
  ratios,
  onChangeBoss,
  onChangeRatio,
}: Props) {
  const groups = users
    .map((user) => ({ user, characters: characters.filter((c) => c.userId === user.id) }))
    .filter((g) => g.characters.length > 0)
  const colors = userColors(users)

  return (
    <section className="card">
      <h2>보스 · 파티 배율 설정</h2>
      <div className="table-scroll">
        <table className="grid">
          <thead>
            <tr>
              <th className="corner" colSpan={2} />
              {bosses.map((b) => (
                <th key={b.id} scope="col" className="boss-head">
                  <BossCard
                    boss={b}
                    players={<PlayersInput boss={b} onChange={(v) => onChangeBoss(b.id, { targetPlayers: v })} />}
                    target={<TargetInput boss={b} onChange={(v) => onChangeBoss(b.id, { targetRatio: v })} />}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.flatMap(({ user, characters }) =>
              characters.map((c, i) => (
                <tr key={c.id}>
                  {i === 0 && (
                    <th
                      scope="rowgroup"
                      rowSpan={characters.length}
                      className="user-band"
                      style={{ '--user-color': colors.get(user.id) } as CSSProperties}
                      title={user.name}
                      aria-label={user.name}
                    />
                  )}
                  <th scope="row" className="character-head">
                    <span className="character-label">
                      <JobPortrait job={c.job} />
                      <span className="character-name">{c.name}</span>
                    </span>
                  </th>
                  {bosses.map((b) => (
                    <td key={b.id} className="ratio-cell">
                      <span className="result-target">
                        <span className="result-label">솔플배율</span>{' '}
                        <label className="percent-input ratio-input">
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            defaultValue={ratios[c.id]?.[b.id] ?? ''}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const v = Number(e.target.value)
                              // 0 이하 또는 빈 값 = 불참
                              onChangeRatio(c.id, b.id, v > 0 ? v : null)
                            }}
                            onBlur={(e) => {
                              // 불참은 0 대신 빈 칸으로
                              if (!(Number(e.target.value) > 0)) e.target.value = ''
                            }}
                            aria-label={`${c.name} ${b.name} 배율`}
                          />
                          <span className="unit">%</span>
                        </label>
                      </span>
                    </td>
                  ))}
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
