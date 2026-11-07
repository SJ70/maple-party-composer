import type { Boss, BossSplit, Member, Party, PartySlot, Ratios } from './types.ts'

/** 혼자 딱 최소컷으로 클리어하는 배율 */
export const CLEAR_THRESHOLD = 100

function toParty(slots: PartySlot[]): Party {
  return { slots, total: slots.reduce((sum, s) => sum + s.ratio, 0) }
}

/**
 * 한 보스에 대한 파티 분배.
 * 1. 혼자 목표 배율을 넘는 인원은 솔로 파티
 * 2. 나머지는 목표를 넘는 파티 수가 최대가 되도록 묶음 (가장 센 사람 + 필요한 만큼만 약한 사람)
 * 3. 그래도 남는 인원은 인원이 가장 적은 파티에 캐리로 합류, 파티가 하나도 없으면 클리어 불가
 */
export function splitBoss(boss: Boss, members: Member[], ratios: Ratios): BossSplit {
  const target = boss.targetRatio
  const players = members
    .map((member) => ({ member, ratio: ratios[member.id]?.[boss.id] ?? 0 }))
    .filter((p) => p.ratio > 0)
    .sort((a, b) => b.ratio - a.ratio)

  const parties: PartySlot[][] = []
  const pool: PartySlot[] = []
  for (const p of players) {
    if (p.ratio >= target) parties.push([p])
    else pool.push(p)
  }

  // 남은 인원을 전부 합쳐도 목표에 못 미치면 더 이상 파티를 만들 수 없음
  while (pool.reduce((sum, p) => sum + p.ratio, 0) >= target) {
    const party = [pool.shift()!]
    let total = party[0].ratio
    while (total < target) {
      const need = target - total
      // 혼자 부족분을 채우는 사람 중 가장 약한 사람, 없으면 가장 약한 사람부터
      const fill = pool.findLastIndex((p) => p.ratio >= need)
      const [pick] = pool.splice(fill === -1 ? pool.length - 1 : fill, 1)
      party.push(pick)
      total += pick.ratio
    }
    parties.push(party)
  }

  const unassigned: PartySlot[] = []
  for (const p of pool) {
    const target = parties.toSorted((a, b) => a.length - b.length)[0]
    if (target) target.push(p)
    else unassigned.push(p)
  }

  return { boss, parties: parties.map(toParty), unassigned }
}
