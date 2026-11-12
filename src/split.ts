import type { Boss, BossSplit, Character, Party, PartySlot, Ratios } from './types.ts'

/** 혼자 딱 최소컷으로 클리어하는 배율 */
export const CLEAR_THRESHOLD = 100

/** 배율은 소수점 둘째 자리까지 입력받으므로 100배 정수로 계산해 부동소수점 오차를 없앤다 */
const SCALE = 100
const toInt = (ratio: number) => Math.round(ratio * SCALE)

/** 비트마스크로 탐색하는 최대 캐릭터 수 (솔로 파티 제외). 넘는 약한 캐릭터는 낙오 */
const MAX_SEARCH = 30

/** 탐색 노드 예산. 넘으면 그때까지 찾은 최선의 조합을 쓴다 (입력할 때마다 다시 계산하므로 UI가 멈추지 않게) */
const NODE_BUDGET = 100_000

type Player = { character: Character; ratio: number }

const toParty = (slots: PartySlot[]): Party => ({ slots, total: slots.reduce((sum, s) => sum + s.ratio, 0) })

/**
 * 파티 구성의 점수. 앞 항목부터 비교
 * 1. 파티 수 ↑ (클리어 파티가 많을수록)
 * 2. 배율 합 ↓ (목표를 넘기는 데 꼭 필요한 만큼만)
 * 3. 인원 수 ↓
 * 4. 배율 제곱 합 ↓ (파티 수·배율 합이 같으면 = 파티 간 배율 편차가 작을수록)
 * 모두 파티별 값의 합이라 부분해에 더해 가며 계산할 수 있다.
 */
type Score = { count: number; sum: number; size: number; sumSq: number }

const better = (a: Score, b: Score) =>
  a.count !== b.count
    ? a.count > b.count
    : a.sum !== b.sum
      ? a.sum < b.sum
      : a.size !== b.size
        ? a.size < b.size
        : a.sumSq < b.sumSq

type Plan = Score & { parties: number[][] }

/**
 * 한 보스에 대한 파티 분배
 * - 같은 유저의 캐릭터끼리는 한 파티에 넣지 않는다
 * - 파티 인원은 목표인원(보스 최대 인원 이하) 이하. 1명이면 솔로 파티만
 * - 클리어 파티 수가 최대가 되도록 하고, 그중 배율 합 → 인원 수 → 파티 간 편차가 가장 작은 조합 (Score 참고)
 * - 빼도 목표를 넘는 캐릭터는 넣지 않고 낙오시킨다 (예: 목표 100, A200 B100 C20 → [A] [B], C 낙오)
 */
export function splitBoss(boss: Boss, characters: Character[], ratios: Ratios): BossSplit {
  const target = toInt(boss.targetRatio)
  const players = characters
    .map((character) => ({ character, ratio: ratios[character.id]?.[boss.id] ?? 0 }))
    .filter((p) => p.ratio > 0)
    .sort((a, b) => b.ratio - a.ratio)

  // 혼자 목표를 넘는 캐릭터는 다른 캐릭터를 더하면 배율 합만 늘고, 빼면 파티 수가 줄어드므로 항상 솔로
  const solos = players.filter((p) => toInt(p.ratio) >= target)
  const pool = players.filter((p) => toInt(p.ratio) < target)
  const searched = pool.slice(0, MAX_SEARCH)
  const overflow = pool.slice(MAX_SEARCH)

  const maxPlayers = Math.min(boss.targetPlayers, boss.maxPlayers)
  const plan = maxPlayers >= 2 && target > 0 ? search(searched, target, maxPlayers) : undefined
  const grouped = (plan?.parties ?? []).map((indexes) => indexes.map((i) => searched[i]))
  const used = new Set(grouped.flat())

  const parties = [...solos.map((p) => [p]), ...grouped].map(toParty).toSorted((a, b) => b.total - a.total)
  const unassigned = [...searched.filter((p) => !used.has(p)), ...overflow]
  return { boss, parties, unassigned }
}

/**
 * players(배율 내림차순, 모두 목표 미만)를 최적으로 파티 분배. 반환값의 parties는 players 인덱스 묶음.
 *
 * 분기 한정법: 남은 캐릭터 중 가장 센 캐릭터를 포함한 "최소 파티"(아무나 빼면 목표 미달인 파티)를 하나 만들거나
 * 그 캐릭터를 낙오시키고 나머지를 재귀로 푼다. 최적해의 모든 파티는 최소 파티다:
 * 빼도 되는 캐릭터가 있으면 빼는 쪽이 배율 합·인원 수가 더 낮으므로.
 * 남은 캐릭터로 만들 수 있는 파티 수 상한과, 파티 하나당 하한(배율 = 목표, 인원 = 2)으로 가망 없는 가지를 잘라낸다.
 */
function search(players: Player[], target: number, maxPlayers: number): Plan {
  const n = players.length
  const ratio = players.map((p) => toInt(p.ratio))
  const user = players.map((p) => p.character.userId)

  let best: Plan = { count: 0, sum: 0, size: 0, sumSq: 0, parties: [] }
  const parties: number[][] = []
  let nodes = 0

  /** first 이후의 캐릭터로 first를 포함한 최소 파티를 모두 나열 (배율 합 → 인원 수 오름차순) */
  const minimalParties = (first: number, rest: number) => {
    const found: { members: number[]; mask: number; total: number }[] = []
    const members = [first]
    const users = new Set([user[first]])
    const extend = (from: number, total: number) => {
      const slots = maxPlayers - members.length
      for (let i = from; i < n; i++) {
        if (!(rest & (1 << i)) || users.has(user[i])) continue
        // 배율 내림차순이므로 i부터 남은 자리를 모두 채워도 목표 미달이면 이후도 불가
        if (total + ratio[i] * slots < target) return
        const next = total + ratio[i]
        members.push(i)
        if (next >= target) {
          let mask = 0
          for (const m of members) mask |= 1 << m
          found.push({ members: [...members], mask, total: next })
        } else if (slots > 1) {
          users.add(user[i])
          extend(i + 1, next)
          users.delete(user[i])
        }
        members.pop()
      }
    }
    extend(first + 1, ratio[first])
    return found.sort((a, b) => a.total - b.total || a.members.length - b.members.length)
  }

  /** mask의 캐릭터로 더 만들 수 있는 파티 수 상한: k파티면 센 캐릭터 k × 최대 인원 명의 배율 합이 k × 목표 이상 */
  const partyBound = (mask: number) => {
    let k = 0
    let taken = 0
    let total = 0
    for (let i = 0; i < n; i++) {
      if (!(mask & (1 << i))) continue
      taken++
      total += ratio[i]
      // 가장 센 캐릭터부터 채우므로, 처음 k+1파티 조건을 만족하는 순간 상한이 k+1로 올라감
      while (taken >= 2 * (k + 1) && total >= (k + 1) * target) k++
      if (taken === (k + 1) * maxPlayers && total < (k + 1) * target) break
    }
    return k
  }

  const dfs = (mask: number, score: Score) => {
    if (++nodes > NODE_BUDGET) return
    const bound = partyBound(mask)
    if (bound === 0) {
      if (better(score, best)) best = { ...score, parties: parties.map((p) => [...p]) }
      return
    }
    if (score.count + bound < best.count) return
    if (score.count + bound === best.count) {
      // 파티 수를 더 늘릴 수 없으면, 남은 파티가 모두 하한(딱 목표 배율, 2명)이어도 지금 최선보다 나아야 함
      const need = best.count - score.count
      const lower = {
        count: best.count,
        sum: score.sum + need * target,
        size: score.size + need * 2,
        sumSq: score.sumSq + need * target * target,
      }
      if (!better(lower, best)) return
    }

    const first = 31 - Math.clz32(mask & -mask)
    const rest = mask & ~(1 << first)
    for (const party of minimalParties(first, rest)) {
      parties.push(party.members)
      dfs(mask & ~party.mask, {
        count: score.count + 1,
        sum: score.sum + party.total,
        size: score.size + party.members.length,
        sumSq: score.sumSq + party.total * party.total,
      })
      parties.pop()
    }
    // 가장 센 캐릭터 낙오
    dfs(rest, score)
  }

  // n ≤ 30 이므로 32비트 정수 비트마스크로 충분
  dfs(n === 0 ? 0 : 2 ** n - 1, best)
  return best
}
