import { useMemo } from 'react'
import { PRESETS } from './bosses.ts'
import { BossSelect } from './components/BossSelect.tsx'
import { PartyResults } from './components/PartyResults.tsx'
import { RatioGrid } from './components/RatioGrid.tsx'
import { UserSettings } from './components/UserSettings.tsx'
import { CLEAR_THRESHOLD, splitBoss } from './split.ts'
import type { AppState, Boss, Character, Ratios, StoredBoss, User } from './types.ts'
import { useStoredState } from './useStoredState.ts'

const EMPTY: AppState = { users: [], characters: [], bosses: [], ratios: {} }

type LegacyState = Omit<AppState, 'users' | 'characters'> & { members: { id: string; name: string }[] }

/** 플레이어(members)만 있던 이전 데이터는 플레이어마다 유저 1명 + 같은 id의 캐릭터 1개로 옮겨 배율을 유지 */
function migrate(saved: unknown): AppState {
  const state = saved as Partial<AppState & LegacyState>
  if (state.users && state.characters) return { ...EMPTY, ...state, users: state.users, characters: state.characters }
  const users: User[] = []
  const characters: Character[] = []
  for (const m of state.members ?? []) {
    const userId = crypto.randomUUID()
    users.push({ id: userId, name: m.name })
    characters.push({ id: m.id, userId, name: m.name })
  }
  return { bosses: state.bosses ?? [], ratios: state.ratios ?? {}, users, characters }
}

const withoutCharacters = (ratios: Ratios, characterIds: Set<string>): Ratios =>
  Object.fromEntries(Object.entries(ratios).filter(([characterId]) => !characterIds.has(characterId)))

const withoutBosses = (ratios: Ratios, bossIds: Set<string>): Ratios =>
  Object.fromEntries(
    Object.entries(ratios).map(([characterId, byBoss]) => [
      characterId,
      Object.fromEntries(Object.entries(byBoss).filter(([bossId]) => !bossIds.has(bossId))),
    ]),
  )

export default function App() {
  const [state, setState] = useStoredState<AppState>('maple-party-split', EMPTY, migrate)
  const { users, characters, ratios } = state
  // 보스 목록에 없는 이전 데이터(직접 입력한 보스)는 버리고, 목표 배율·인원이 없으면 기본값으로. 배율 입력·결과 모두 정렬 순서로
  const bosses = useMemo(
    () =>
      state.bosses
        .flatMap((b): Boss[] => {
          const preset = PRESETS.get(b.id)
          if (!preset) return []
          const targetPlayers = Math.min(Math.max(b.targetPlayers ?? preset.maxPlayers, 1), preset.maxPlayers)
          return [{ ...preset, targetRatio: b.targetRatio ?? CLEAR_THRESHOLD, targetPlayers }]
        })
        .toSorted((a, b) => a.order - b.order),
    [state.bosses],
  )

  const splits = useMemo(
    () => bosses.map((boss) => splitBoss(boss, characters, ratios)),
    [bosses, characters, ratios],
  )

  /** 유저 설정 모달 결과로 교체. 빠진 캐릭터는 배율도 삭제 */
  const applyUsers = (users: User[], characters: Character[]) =>
    setState((s) => {
      const kept = new Set(characters.map((c) => c.id))
      const removed = new Set(s.characters.filter((c) => !kept.has(c.id)).map((c) => c.id))
      return { ...s, users, characters, ratios: withoutCharacters(s.ratios, removed) }
    })

  /** 모달에서 고른 목록으로 교체. 기존 보스는 목표 배율 유지, 빠진 보스는 배율도 삭제 */
  const selectBosses = (ids: string[]) =>
    setState((s) => {
      const selected = new Set(ids)
      const kept = s.bosses.filter((b) => selected.has(b.id))
      const added = ids
        .filter((id) => !kept.some((b) => b.id === id))
        .map((id) => ({ id, targetRatio: CLEAR_THRESHOLD }))
      const removed = new Set(s.bosses.filter((b) => !selected.has(b.id)).map((b) => b.id))
      return { ...s, bosses: [...kept, ...added], ratios: withoutBosses(s.ratios, removed) }
    })

  const changeBoss = (id: string, patch: Partial<Omit<StoredBoss, 'id'>>) =>
    setState((s) => ({ ...s, bosses: s.bosses.map((b) => (b.id === id ? { ...b, ...patch } : b)) }))

  const changeRatio = (characterId: string, bossId: string, ratio: number | null) =>
    setState((s) => {
      const { [bossId]: _old, ...rest } = s.ratios[characterId] ?? {}
      const byBoss = ratio === null ? rest : { ...rest, [bossId]: ratio }
      return { ...s, ratios: { ...s.ratios, [characterId]: byBoss } }
    })

  return (
    <main className="app">
      <header>
        <div className="app-title">
          <h1>메이플스토리 보스 파티 조합기</h1>
          <p className="muted">캐릭터별 배율에 따라 최적의 보스 파티를 구성해줍니다.</p>
        </div>
        <div className="grid-toolbar">
          <UserSettings users={users} characters={characters} onApply={applyUsers} />
          <BossSelect bosses={bosses} onApply={selectBosses} />
        </div>
      </header>
      <RatioGrid
        users={users}
        characters={characters}
        bosses={bosses}
        ratios={ratios}
        onChangeBoss={changeBoss}
        onChangeRatio={changeRatio}
      />
      <PartyResults splits={splits} users={users} />
    </main>
  )
}
