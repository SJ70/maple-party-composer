export type Member = {
  id: string
  name: string
}

export type Boss = {
  id: string
  name: string
  /** 파티 배율 합이 이 값(%) 이상이어야 클리어로 본다 */
  targetRatio: number
}

/** ratios[memberId][bossId] = 클리어 배율(%). 값이 없으면 해당 보스 불참 */
export type Ratios = Record<string, Record<string, number>>

export type AppState = {
  members: Member[]
  bosses: Boss[]
  ratios: Ratios
}

export type PartySlot = {
  member: Member
  ratio: number
}

export type Party = {
  slots: PartySlot[]
  total: number
}

export type BossSplit = {
  boss: Boss
  parties: Party[]
  /** 어떤 파티에도 넣을 수 없어 클리어 불가한 인원 */
  unassigned: PartySlot[]
}
