import { CLEAR_THRESHOLD } from '../split.ts'
import type { CSSProperties } from 'react'
import type { Boss, Character, Ratios, StoredBoss, User } from '../types.ts'
import { userColors } from '../userColors.ts'
import { BossCard } from './BossLabel.tsx'
import { BossSelect } from './BossSelect.tsx'
import { UserSettings } from './UserSettings.tsx'

type Props = {
  users: User[]
  characters: Character[]
  bosses: Boss[]
  ratios: Ratios
  onApplyUsers: (users: User[], characters: Character[]) => void
  onSelectBosses: (ids: string[]) => void
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

/** 열 = 보스, 행 = 캐릭터 (왼쪽 유저 색 띠로 유저별로 묶음), 칸 = 캐릭터의 보스 클리어 배율 */
export function RatioGrid({
  users,
  characters,
  bosses,
  ratios,
  onApplyUsers,
  onSelectBosses,
  onChangeBoss,
  onChangeRatio,
}: Props) {
  const groups = users
    .map((user) => ({ user, characters: characters.filter((c) => c.userId === user.id) }))
    .filter((g) => g.characters.length > 0)
  const colors = userColors(users)

  return (
    <section className="card">
      <div className="grid-toolbar">
        <UserSettings users={users} characters={characters} onApply={onApplyUsers} />
        <BossSelect bosses={bosses} onApply={onSelectBosses} />
      </div>
      <div className="table-scroll">
        <table className="grid">
          <thead>
            <tr>
              <th className="corner" colSpan={2} />
              {bosses.map((b) => (
                <th key={b.id} scope="col" className="boss-head">
                  <BossCard boss={b} target={<TargetInput boss={b} onChange={(v) => onChangeBoss(b.id, { targetRatio: v })} />} />
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
                    {c.name}
                  </th>
                  {bosses.map((b) => (
                    <td key={b.id} className="ratio-cell">
                      <span className="result-target">
                        <span className="result-label">솔플배율</span>{' '}
                        <label className="percent-input ratio-input">
                          <input
                            type="number"
                            min={0}
                            defaultValue={ratios[c.id]?.[b.id] ?? 0}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const v = Number(e.target.value)
                              // 0 이하 또는 빈 값 = 불참
                              onChangeRatio(c.id, b.id, v > 0 ? v : null)
                            }}
                            onBlur={(e) => {
                              if (e.target.value === '') e.target.value = '0'
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
