import { useMemo } from 'react'
import { PRESETS } from './bosses.ts'
import { PartyResults } from './components/PartyResults.tsx'
import { RatioGrid } from './components/RatioGrid.tsx'
import { CLEAR_THRESHOLD, splitBoss } from './split.ts'
import type { AppState, Boss, Ratios, StoredBoss } from './types.ts'
import { useStoredState } from './useStoredState.ts'

const EMPTY: AppState = { members: [], bosses: [], ratios: {} }

const withoutBosses = (ratios: Ratios, bossIds: Set<string>): Ratios =>
  Object.fromEntries(
    Object.entries(ratios).map(([memberId, byBoss]) => [
      memberId,
      Object.fromEntries(Object.entries(byBoss).filter(([bossId]) => !bossIds.has(bossId))),
    ]),
  )

export default function App() {
  const [state, setState] = useStoredState<AppState>('maple-party-split', EMPTY)
  const { members, ratios } = state
  // 보스 목록에 없는 이전 데이터(직접 입력한 보스)는 버리고, 목표 배율이 없으면 기본값으로
  const bosses = useMemo(
    () =>
      state.bosses.flatMap((b): Boss[] => {
        const preset = PRESETS.get(b.id)
        return preset ? [{ ...preset, targetRatio: b.targetRatio ?? CLEAR_THRESHOLD }] : []
      }),
    [state.bosses],
  )

  const splits = useMemo(
    () => bosses.toSorted((a, b) => a.order - b.order).map((boss) => splitBoss(boss, members, ratios)),
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

  /** 모달에서 고른 목록으로 교체. 기존 보스는 순서·목표 배율 유지, 빠진 보스는 배율도 삭제 */
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

  const removeBoss = (id: string) =>
    setState((s) => ({
      ...s,
      bosses: s.bosses.filter((b) => b.id !== id),
      ratios: withoutBosses(s.ratios, new Set([id])),
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
        onSelectBosses={selectBosses}
        onChangeBoss={changeBoss}
        onRemoveBoss={removeBoss}
        onChangeRatio={changeRatio}
      />
      <PartyResults splits={splits} />
    </main>
  )
}
