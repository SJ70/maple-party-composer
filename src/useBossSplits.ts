import { useMemo, useState } from 'react'
import { splitBoss } from './split.ts'
import type { Boss, BossSplit, Character, Ratios } from './types.ts'

type Entry = { characters: Character[]; targetRatio: number; targetPlayers: number; ratioKey: string; split: BossSplit }

/**
 * 보스별 결과 캐시. 보스마다 입력(캐릭터 목록, 목표 배율·인원, 그 보스의 배율들)이 그대로면 이전 결과를 재사용한다.
 * splitBoss는 순수 함수라 같은 입력에 같은 결과이므로, 렌더 중에 캐시를 갱신해도 안전하다.
 */
function createSplitCache() {
  let cache = new Map<string, Entry>()
  return (bosses: Boss[], characters: Character[], ratios: Ratios): BossSplit[] => {
    const next = new Map<string, Entry>()
    const splits = bosses.map((boss) => {
      const ratioKey = characters.map((c) => ratios[c.id]?.[boss.id] ?? 0).join(',')
      const prev = cache.get(boss.id)
      const entry =
        prev &&
        prev.characters === characters &&
        prev.targetRatio === boss.targetRatio &&
        prev.targetPlayers === boss.targetPlayers &&
        prev.ratioKey === ratioKey
          ? prev
          : {
              characters,
              targetRatio: boss.targetRatio,
              targetPlayers: boss.targetPlayers,
              ratioKey,
              split: splitBoss(boss, characters, ratios),
            }
      next.set(boss.id, entry)
      return entry.split
    })
    // 빠진 보스는 캐시에서도 제거
    cache = next
    return splits
  }
}

/** 보스별 파티 분배. 배율 하나를 고치면 그 보스만 다시 계산한다 */
export function useBossSplits(bosses: Boss[], characters: Character[], ratios: Ratios): BossSplit[] {
  const [split] = useState(createSplitCache)
  return useMemo(() => split(bosses, characters, ratios), [split, bosses, characters, ratios])
}
