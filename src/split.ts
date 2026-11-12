import type { Boss, BossSplit, Character, Party, PartySlot, Ratios } from './types.ts'

/** 혼자 딱 최소컷으로 클리어하는 배율 */
export const CLEAR_THRESHOLD = 100

function toParty(slots: PartySlot[]): Party {
  return { slots, total: slots.reduce((sum, s) => sum + s.ratio, 0) }
}

/** 유저별 가장 센 캐릭터의 배율 */
function bestByUser(slots: PartySlot[]): Map<string, number> {
  const best = new Map<string, number>()
  for (const s of slots) best.set(s.character.userId, Math.max(best.get(s.character.userId) ?? 0, s.ratio))
  return best
}

const sumValues = (map: Map<string, number>) => [...map.values()].reduce((sum, v) => sum + v, 0)

const hasUser = (slots: PartySlot[], userId: string) => slots.some((s) => s.character.userId === userId)

/**
 * 한 보스에 대한 파티 분배. 같은 유저의 캐릭터끼리는 한 파티에 넣지 않는다.
 * 1. 혼자 목표 배율을 넘는 캐릭터는 솔로 파티
 * 2. 나머지는 목표를 넘는 파티 수가 최대가 되도록 묶음 (가장 센 캐릭터 + 필요한 만큼만 약한 캐릭터)
 * 3. 그래도 남는 캐릭터는 같은 유저가 없는 파티 중 인원이 가장 적은 파티에 캐리로 합류, 들어갈 파티가 없으면 클리어 불가
 */
export function splitBoss(boss: Boss, characters: Character[], ratios: Ratios): BossSplit {
  const target = boss.targetRatio
  const players = characters
    .map((character) => ({ character, ratio: ratios[character.id]?.[boss.id] ?? 0 }))
    .filter((p) => p.ratio > 0)
    .sort((a, b) => b.ratio - a.ratio)

  const parties: PartySlot[][] = []
  const pool: PartySlot[] = []
  for (const p of players) {
    if (p.ratio >= target) parties.push([p])
    else pool.push(p)
  }

  // 남은 캐릭터를 유저당 하나씩(가장 센 캐릭터) 모아도 목표에 못 미치면 더 이상 파티를 만들 수 없음
  while (sumValues(bestByUser(pool)) >= target) {
    const party = [pool.shift()!]
    let total = party[0].ratio
    while (total < target) {
      const need = target - total
      const candidates = pool.filter((p) => !hasUser(party, p.character.userId))
      const best = bestByUser(candidates)
      const bestSum = sumValues(best)
      // 혼자 부족분을 채우는 캐릭터 중 가장 약한 캐릭터, 없으면 가장 약한 캐릭터부터.
      // 단, 그 유저의 다른 캐릭터를 못 쓰게 되어도 나머지 유저로 목표에 닿을 수 있는 캐릭터만 (유저별 최강 캐릭터는 항상 가능)
      const pick =
        candidates.findLast((p) => p.ratio >= need) ??
        candidates.findLast((p) => total + p.ratio + bestSum - best.get(p.character.userId)! >= target)!
      pool.splice(pool.indexOf(pick), 1)
      party.push(pick)
      total += pick.ratio
    }
    parties.push(party)
  }

  const unassigned: PartySlot[] = []
  for (const p of pool) {
    const party = parties
      .filter((party) => !hasUser(party, p.character.userId))
      .toSorted((a, b) => a.length - b.length)[0]
    if (party) party.push(p)
    else unassigned.push(p)
  }

  return { boss, parties: parties.map(toParty), unassigned }
}
