import { useMemo } from 'react'
import { PartyResults } from './components/PartyResults.tsx'
import { RatioGrid } from './components/RatioGrid.tsx'
import { CLEAR_THRESHOLD, splitBoss } from './split.ts'
import type { AppState, Boss } from './types.ts'
import { useStoredState } from './useStoredState.ts'

const EMPTY: AppState = { members: [], bosses: [], ratios: {} }

export default function App() {
  const [state, setState] = useStoredState<AppState>('maple-party-split', EMPTY)
  const { members, ratios } = state
  // 목표 배율이 없던 이전 데이터는 기본값으로
  const bosses = useMemo(
    () => state.bosses.map((b) => ({ ...b, targetRatio: b.targetRatio ?? CLEAR_THRESHOLD })),
    [state.bosses],
  )

  const splits = useMemo(
    () => bosses.map((boss) => splitBoss(boss, members, ratios)),
    [bosses, members, ratios],
  )

  const addMember = () =>
    setState((s) => ({
      ...s,
      members: [...s.members, { id: crypto.randomUUID(), name: `플레이어 ${s.members.length + 1}` }],
    }))

  const renameMember = (id: string, name: string) =>
    setState((s) => ({ ...s, members: s.members.map((m) => (m.id === id ? { ...m, name } : m)) }))

  const removeMember = (id: string) =>
    setState((s) => {
      const { [id]: _removed, ...ratios } = s.ratios
      return { ...s, members: s.members.filter((m) => m.id !== id), ratios }
    })

  const addBoss = () =>
    setState((s) => ({
      ...s,
      bosses: [
        ...s.bosses,
        { id: crypto.randomUUID(), name: `보스 ${s.bosses.length + 1}`, targetRatio: CLEAR_THRESHOLD },
      ],
    }))

  const changeBoss = (id: string, patch: Partial<Omit<Boss, 'id'>>) =>
    setState((s) => ({ ...s, bosses: s.bosses.map((b) => (b.id === id ? { ...b, ...patch } : b)) }))

  const removeBoss = (id: string) =>
    setState((s) => ({
      ...s,
      bosses: s.bosses.filter((b) => b.id !== id),
      ratios: Object.fromEntries(
        Object.entries(s.ratios).map(([memberId, byBoss]) => {
          const { [id]: _removed, ...rest } = byBoss
          return [memberId, rest]
        }),
      ),
    }))

  const changeRatio = (memberId: string, bossId: string, ratio: number | null) =>
    setState((s) => {
      const { [bossId]: _old, ...rest } = s.ratios[memberId] ?? {}
      const byBoss = ratio === null ? rest : { ...rest, [bossId]: ratio }
      return { ...s, ratios: { ...s.ratios, [memberId]: byBoss } }
    })

  return (
    <main className="app">
      <header>
        <h1>메이플스토리 보스 파티 조합기</h1>
        <p className="muted">각자 보스별 클리어 배율을 입력하면, 최적의 보스 파티를 구성해줍니다.</p>
      </header>
      <RatioGrid
        members={members}
        bosses={bosses}
        ratios={ratios}
        onAddMember={addMember}
        onRenameMember={renameMember}
        onRemoveMember={removeMember}
        onAddBoss={addBoss}
        onChangeBoss={changeBoss}
        onRemoveBoss={removeBoss}
        onChangeRatio={changeRatio}
      />
      <PartyResults splits={splits} />
    </main>
  )
}
