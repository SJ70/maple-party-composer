import { CLEAR_THRESHOLD } from '../split.ts'
import type { CSSProperties } from 'react'
import type { Boss, Character, Ratios, StoredBoss, User } from '../types.ts'
import { userColors } from '../userColors.ts'
import { BossLabel } from './BossLabel.tsx'
import { BossSelect } from './BossSelect.tsx'
import { UserSettings } from './UserSettings.tsx'

type Props = {
  users: User[]
  characters: Character[]
  bosses: Boss[]
  ratios: Ratios
  onApplyUsers: (users: User[], characters: Character[]) => void
  onRemoveUser: (id: string) => void
  onRemoveCharacter: (id: string) => void
  onSelectBosses: (ids: string[]) => void
  onChangeBoss: (id: string, patch: Partial<Omit<StoredBoss, 'id'>>) => void
  onRemoveBoss: (id: string) => void
  onChangeRatio: (characterId: string, bossId: string, ratio: number | null) => void
}

/** 열 = 캐릭터 (위에 유저별로 묶음), 행 = 보스, 칸 = 캐릭터의 보스 클리어 배율 */
export function RatioGrid({
  users,
  characters,
  bosses,
  ratios,
  onApplyUsers,
  onRemoveUser,
  onRemoveCharacter,
  onSelectBosses,
  onChangeBoss,
  onRemoveBoss,
  onChangeRatio,
}: Props) {
  const groups = users
    .map((user) => ({ user, characters: characters.filter((c) => c.userId === user.id) }))
    .filter((g) => g.characters.length > 0)
  const columns = groups.flatMap((g) => g.characters)
  const colors = userColors(users)

  return (
    <section className="card">
      <div className="table-scroll">
        <table className="grid">
          <thead>
            <tr>
              <th className="corner" rowSpan={2} />
              {groups.map(({ user, characters }) => (
                <th
                  key={user.id}
                  colSpan={characters.length}
                  className="user-head"
                  style={{ '--user-color': colors.get(user.id) } as CSSProperties}
                >
                  <div className="head-box">
                    <span className="user-dot" aria-hidden />
                    <span className="head-name">{user.name}</span>
                    <button className="ghost" onClick={() => onRemoveUser(user.id)} aria-label={`${user.name} 삭제`}>
                      ✕
                    </button>
                  </div>
                </th>
              ))}
              <th rowSpan={2}>
                <UserSettings users={users} characters={characters} onApply={onApplyUsers} />
              </th>
            </tr>
            <tr>
              {groups.flatMap(({ characters }) =>
                characters.map((c) => (
                  <th key={c.id} className="character-head">
                    <div className="head-box">
                      <span className="head-name">{c.name}</span>
                      {/* 유저마다 캐릭터는 최소 1개. 마지막 캐릭터는 유저째로 삭제 */}
                      {characters.length > 1 && (
                        <button className="ghost" onClick={() => onRemoveCharacter(c.id)} aria-label={`${c.name} 삭제`}>
                          ✕
                        </button>
                      )}
                    </div>
                  </th>
                )),
              )}
            </tr>
          </thead>
          <tbody>
            {bosses.map((b) => (
              <tr key={b.id}>
                <th scope="row" className="boss-head">
                  <div className="head-box">
                    <BossLabel boss={b} />
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
                {columns.map((c) => (
                  <td key={c.id}>
                    <div className="ratio-cell">
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
                    </div>
                  </td>
                ))}
                <td />
              </tr>
            ))}
            <tr>
              <th scope="row">
                <BossSelect bosses={bosses} onApply={onSelectBosses} />
              </th>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
