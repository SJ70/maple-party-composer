import { useRef, useState, type CSSProperties } from 'react'
import type { Character, User } from '../types.ts'
import { userColor } from '../userColors.ts'

type Props = {
  users: User[]
  characters: Character[]
  onApply: (users: User[], characters: Character[]) => void
}

type Draft = { users: User[]; characters: Character[] }

const newCharacter = (id: string, userId: string, characters: Character[]): Character => ({
  id,
  userId,
  name: `캐릭터 ${characters.length + 1}`,
})

/** 유저 · 캐릭터를 추가 / 이름 변경 / 삭제하는 모달. 유저마다 캐릭터는 최소 1개 */
export function UserSettings({ users, characters, onApply }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [draft, setDraft] = useState<Draft>({ users: [], characters: [] })
  /** 방금 추가한 유저 · 캐릭터 이름 칸에 포커스 */
  const [focusId, setFocusId] = useState<string | null>(null)

  const addUser = () => {
    const userId = crypto.randomUUID()
    const characterId = crypto.randomUUID()
    setFocusId(userId)
    setDraft((d) => ({
      users: [...d.users, { id: userId, name: `유저 ${d.users.length + 1}` }],
      characters: [...d.characters, newCharacter(characterId, userId, d.characters)],
    }))
  }

  const open = () => {
    setDraft({ users, characters })
    setFocusId(null)
    // 유저가 없으면 바로 입력할 수 있게 1명 추가해서 열기
    if (users.length === 0) addUser()
    dialog.current?.showModal()
  }
  const close = () => dialog.current?.close()

  const renameUser = (id: string, name: string) =>
    setDraft((d) => ({ ...d, users: d.users.map((u) => (u.id === id ? { ...u, name } : u)) }))

  const removeUser = (id: string) =>
    setDraft((d) => ({ users: d.users.filter((u) => u.id !== id), characters: d.characters.filter((c) => c.userId !== id) }))

  const addCharacter = (userId: string) => {
    const id = crypto.randomUUID()
    setFocusId(id)
    setDraft((d) => ({ ...d, characters: [...d.characters, newCharacter(id, userId, d.characters)] }))
  }

  const renameCharacter = (id: string, name: string) =>
    setDraft((d) => ({ ...d, characters: d.characters.map((c) => (c.id === id ? { ...c, name } : c)) }))

  const removeCharacter = (id: string) =>
    setDraft((d) => ({ ...d, characters: d.characters.filter((c) => c.id !== id) }))

  const apply = () => {
    onApply(draft.users, draft.characters)
    close()
  }

  return (
    <>
      <button className="add" onClick={open}>
        + 유저
      </button>
      <dialog
        ref={dialog}
        className="modal user-modal"
        aria-labelledby="user-modal-title"
        // 바깥(backdrop) 클릭 시 닫기
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        <div className="modal-head">
          <h2 id="user-modal-title">유저 설정</h2>
          <button className="ghost" onClick={close} aria-label="닫기">
            ✕
          </button>
        </div>
        <ul className="user-modal-list">
          {draft.users.map((u, i) => {
            const owned = draft.characters.filter((c) => c.userId === u.id)
            return (
              <li key={u.id} style={{ '--user-color': userColor(i) } as CSSProperties}>
                <div className="user-modal-user">
                  <input
                    value={u.name}
                    onChange={(e) => renameUser(u.id, e.target.value)}
                    onFocus={(e) => e.target.select()}
                    autoFocus={focusId === u.id}
                    aria-label="유저 이름"
                  />
                  <button className="ghost" onClick={() => removeUser(u.id)} aria-label={`${u.name} 삭제`}>
                    ✕
                  </button>
                </div>
                <div className="user-modal-characters">
                  {owned.map((c) => (
                    <span key={c.id} className="user-modal-character">
                      <input
                        value={c.name}
                        onChange={(e) => renameCharacter(c.id, e.target.value)}
                        onFocus={(e) => e.target.select()}
                        autoFocus={focusId === c.id}
                        aria-label="캐릭터 이름"
                      />
                      {/* 마지막 캐릭터는 삭제 불가. 자리는 남겨 입력칸 너비를 맞춤 */}
                      <button
                        className="ghost"
                        onClick={() => removeCharacter(c.id)}
                        disabled={owned.length === 1}
                        aria-label={`${c.name} 삭제`}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  <button className="add" onClick={() => addCharacter(u.id)}>
                    + 캐릭터
                  </button>
                </div>
              </li>
            )
          })}
          <li className="user-modal-add">
            <button className="add" onClick={addUser}>
              + 유저
            </button>
          </li>
        </ul>
        <div className="modal-foot">
          <span className="muted">
            유저 {draft.users.length}명 · 캐릭터 {draft.characters.length}개
          </span>
          <button className="ghost" onClick={close}>
            취소
          </button>
          <button onClick={apply}>적용</button>
        </div>
      </dialog>
    </>
  )
}
