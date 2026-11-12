import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { splitBoss } from './split.ts'
import type { Boss, BossSplit, Character, Ratios } from './types.ts'

const BOSS_ID = 'test-boss'

/** 캐릭터 이름 → 배율. 이름 뒤 `@유저`로 유저 지정 (없으면 캐릭터마다 다른 유저) */
function run(target: number, maxPlayers: number, input: Record<string, number>): BossSplit {
  const boss = { id: BOSS_ID, name: '테스트', targetRatio: target, maxPlayers, order: 0 } as Boss
  const characters: Character[] = []
  const ratios: Ratios = {}
  for (const [key, ratio] of Object.entries(input)) {
    const [name, userId = name] = key.split('@')
    characters.push({ id: name, userId, name })
    ratios[name] = { [BOSS_ID]: ratio }
  }
  return splitBoss(boss, characters, ratios)
}

/** 파티별 캐릭터 이름(정렬) 목록, 파티도 정렬해 순서 무관하게 비교 */
const names = (split: BossSplit) => split.parties.map((p) => p.slots.map((s) => s.character.name).sort().join('')).sort()
const leftover = (split: BossSplit) => split.unassigned.map((s) => s.character.name).sort()

/** 모든 파티가 지켜야 하는 조건 */
function assertValid(split: BossSplit, target: number, maxPlayers: number) {
  for (const party of split.parties) {
    const ratios = party.slots.map((s) => s.ratio)
    assert.ok(party.total >= target - 1e-9, '목표 배율 이상')
    assert.ok(party.slots.length <= maxPlayers, '보스 최대 인원 이하')
    assert.equal(new Set(party.slots.map((s) => s.character.userId)).size, party.slots.length, '같은 유저 금지')
    // 누구를 빼도 목표 미달이어야 함 = 목표 초과를 위해 굳이 넣은 캐릭터 없음
    assert.ok(party.total - Math.min(...ratios) < target - 1e-9, '불필요한 캐릭터 없음')
  }
}

describe('splitBoss', () => {
  test('가장 낮은 합의 배율로 파티를 구성한다', () => {
    const split = run(100, 6, { A: 60, B: 50, C: 50 })
    assert.deepEqual(names(split), ['BC'])
    assert.deepEqual(leftover(split), ['A'])
  })

  test('배율 합이 같으면 가장 적은 인원으로 구성한다', () => {
    // A+B, A+C+D 모두 100 → 2명인 A+B
    const split = run(100, 6, { A: 60, B: 40, C: 20, D: 20 })
    assert.deepEqual(names(split), ['AB'])
    assert.deepEqual(leftover(split), ['C', 'D'])
  })

  test('보스 최대 인원을 넘는 파티는 만들지 않는다', () => {
    const input = { A: 30, B: 30, C: 30, D: 30 }
    assert.deepEqual(names(run(100, 6, input)), ['ABCD'])
    const limited = run(100, 3, input)
    assert.deepEqual(names(limited), [])
    assert.deepEqual(leftover(limited), ['A', 'B', 'C', 'D'])
  })

  test('최대 인원 안에서 가능한 조합을 찾는다', () => {
    // 3인 제한에서 2파티: ADE 105 + BCF 109 가 편차 최소
    const split = run(100, 3, { A: 50, B: 45, C: 40, D: 30, E: 25, F: 24 })
    assert.deepEqual(names(split), ['ADE', 'BCF'])
    assertValid(split, 100, 3)
  })

  test('2인 보스', () => {
    const split = run(100, 2, { A: 70, B: 60, C: 40, D: 30 })
    assert.deepEqual(names(split), ['AD', 'BC'])
  })

  test('같은 유저의 캐릭터는 파티를 맺을 수 없다', () => {
    // A·B 같은 유저 → A+B 불가, A+C로
    const split = run(100, 6, { 'A@u1': 60, 'B@u1': 50, 'C@u2': 45 })
    assert.deepEqual(names(split), ['AC'])
    assert.deepEqual(leftover(split), ['B'])

    // 한 유저의 캐릭터뿐이면 파티 불가
    const blocked = run(100, 6, { 'A@u1': 60, 'B@u1': 50 })
    assert.deepEqual(names(blocked), [])
    assert.deepEqual(leftover(blocked), ['A', 'B'])

    // 유저 제한이 없으면 A+D(101), B+C(110) 이지만 A·D 같은 유저 → A+C(111), B+D(100)
    const free = run(100, 6, { A: 71, B: 70, C: 40, D: 30 })
    assert.deepEqual(names(free), ['AD', 'BC'])
    const swapped = run(100, 6, { 'A@u1': 71, 'B@u2': 70, 'C@u3': 40, 'D@u1': 30 })
    assert.deepEqual(names(swapped), ['AC', 'BD'])
  })

  test('인원이 남아도 목표 초과 파티를 굳이 만들지 않는다 (낙오자 발생 가능)', () => {
    const split = run(100, 6, { A: 200, B: 100, C: 20 })
    assert.deepEqual(names(split), ['A', 'B'])
    assert.deepEqual(leftover(split), ['C'])
  })

  test('파티 간 배율 편차가 작도록 구성한다', () => {
    const split = run(100, 6, { A: 80, B: 70, C: 60, D: 50, E: 10 })
    assert.deepEqual(names(split), ['AD', 'BC'])
    assert.deepEqual(leftover(split), ['E'])
    assert.deepEqual(
      split.parties.map((p) => p.total),
      [130, 130],
    )
  })

  test('파티 수를 최대로 만든다', () => {
    // 그리디로 A+B를 묶으면 1파티지만 A+D, B+C로 2파티 가능
    const split = run(100, 6, { A: 60, B: 55, C: 45, D: 40 })
    assert.deepEqual(names(split), ['AD', 'BC'])
  })

  test('소수점 배율도 정확히 목표를 판정한다', () => {
    assert.deepEqual(names(run(100, 6, { A: 33.33, B: 33.33, C: 33.34 })), ['ABC'])
    assert.equal(run(100, 6, { A: 33.33, B: 33.33, C: 33.33 }).parties.length, 0)
  })

  test('배율이 0이거나 없는 캐릭터는 불참', () => {
    const split = run(100, 6, { A: 100, B: 0 })
    assert.deepEqual(names(split), ['A'])
    assert.deepEqual(leftover(split), [])
  })

  test('무작위 입력에서도 모든 조건을 지킨다', () => {
    let seed = 42
    const random = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31
    for (let iter = 0; iter < 500; iter++) {
      const target = [80, 100, 150][iter % 3]
      const maxPlayers = [2, 3, 6][Math.floor(iter / 3) % 3]
      const input: Record<string, number> = {}
      const count = 1 + Math.floor(random() * 16)
      const users = 1 + Math.floor(random() * 8)
      for (let i = 0; i < count; i++) input[`c${i}@u${Math.floor(random() * users)}`] = Math.round(random() * 12000) / 100
      const split = run(target, maxPlayers, input)
      assertValid(split, target, maxPlayers)
      assert.equal(split.parties.flatMap((p) => p.slots).length + split.unassigned.length, Object.values(input).filter((r) => r > 0).length)
    }
  })

  test('많은 인원도 빠르게 계산한다', () => {
    const input: Record<string, number> = {}
    for (let i = 0; i < 30; i++) input[`c${i}@u${i % 10}`] = 17
    const start = performance.now()
    const split = run(100, 6, input)
    const elapsed = performance.now() - start
    assert.ok(elapsed < 1000, `${elapsed}ms`)
    assertValid(split, 100, 6)
    assert.equal(split.parties.length, 5)
  })
})
