import type { BossPreset } from './bosses.ts'

/** 실제 사람. 한 유저가 여러 캐릭터를 가짐 */
export type User = {
  id: string
  name: string
}

export type Character = {
  id: string
  userId: string
  name: string
  /** 직업 이름 (jobs.ts의 JOBS). 없으면 미선택 */
  job?: string
}

/** 저장되는 보스. id = BossPreset id (예: lucid-hard) */
export type StoredBoss = {
  id: string
  /** 파티 배율 합이 이 값(%) 이상이어야 클리어로 본다 */
  targetRatio: number
  /** 한 파티 최대 인원 (1 ~ 보스 최대 인원). 없으면 보스 최대 인원 */
  targetPlayers?: number
}

export type Boss = BossPreset & StoredBoss & { targetPlayers: number }

/** ratios[characterId][bossId] = 클리어 배율(%). 값이 없으면 해당 보스 불참 */
export type Ratios = Record<string, Record<string, number>>

export type AppState = {
  users: User[]
  characters: Character[]
  bosses: StoredBoss[]
  ratios: Ratios
}

export type PartySlot = {
  character: Character
  ratio: number
}

export type Party = {
  slots: PartySlot[]
  total: number
}

export type BossSplit = {
  boss: Boss
  parties: Party[]
  /** 어떤 파티에도 넣을 수 없어 클리어 불가한 캐릭터 */
  unassigned: PartySlot[]
}
