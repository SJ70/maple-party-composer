import { useRef, useState, type CSSProperties } from 'react'
import type { Character, User } from '../types.ts'
import { JOBS } from '../jobs.ts'
import { userColor } from '../userColors.ts'
import { collapse, expand } from '../heightMotion.ts'
import { JobPortrait } from './JobPortrait.tsx'

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
  /** 직업 목록을 펼친 캐릭터 id */
  const [pickerFor, setPickerFor] = useState<string | null>(null)
  /** 접히는 중인 직업 목록 (캐릭터 id → 애니메이션). 끝날 때까지 그려 둠 */
  const [closingPickers, setClosingPickers] = useState<ReadonlyMap<string, Animation>>(new Map())
  /** 삭제 애니메이션 중인 유저 · 캐릭터 id. 끝나면 draft에서 뺌 */
  const [leaving, setLeaving] = useState<ReadonlySet<string>>(new Set())
  const leavingAnimations = useRef(new Set<Animation>())
  /** 방금 추가해서 펼침 애니메이션을 줄 유저 · 캐릭터 id */
  const entering = useRef(new Set<string>())

  const enterRef = (id: string) => (el: HTMLElement | null) => {
    if (el && entering.current.delete(id)) expand(el)
  }

  /** el을 접는 애니메이션이 끝나면 remove 실행 */
  const removeAnimated = (id: string, el: Element | null, remove: () => void) => {
    const animation = el instanceof HTMLElement ? collapse(el) : null
    if (!animation) return remove()
    setLeaving((s) => new Set(s).add(id))
    leavingAnimations.current.add(animation)
    animation.addEventListener('finish', () => {
      leavingAnimations.current.delete(animation)
      setLeaving((s) => {
        const next = new Set(s)
        next.delete(id)
        return next
      })
      remove()
    })
  }

  const addUser = (animate = true) => {
    const userId = crypto.randomUUID()
    const characterId = crypto.randomUUID()
    if (animate) entering.current.add(userId)
    setFocusId(userId)
    setDraft((d) => ({
      users: [...d.users, { id: userId, name: `유저 ${d.users.length + 1}` }],
      characters: [...d.characters, newCharacter(characterId, userId, d.characters)],
    }))
  }

  const open = () => {
    // 닫기 전에 진행 중이던 삭제가 새 draft를 건드리지 않게 취소
    leavingAnimations.current.forEach((a) => a.cancel())
    leavingAnimations.current.clear()
    closingPickers.forEach((a) => a.cancel())
    setClosingPickers(new Map())
    entering.current.clear()
    setLeaving(new Set())
    setDraft({ users, characters })
    setFocusId(null)
    setPickerFor(null)
    // 유저가 없으면 바로 입력할 수 있게 1명 추가해서 열기
    if (users.length === 0) addUser(false)
    dialog.current?.showModal()
  }
  const close = () => dialog.current?.close()

  const renameUser = (id: string, name: string) =>
    setDraft((d) => ({ ...d, users: d.users.map((u) => (u.id === id ? { ...u, name } : u)) }))

  const removeUser = (id: string, el: Element | null) =>
    removeAnimated(id, el, () =>
      setDraft((d) => ({ users: d.users.filter((u) => u.id !== id), characters: d.characters.filter((c) => c.userId !== id) })),
    )

  const addCharacter = (userId: string) => {
    const id = crypto.randomUUID()
    entering.current.add(id)
    setFocusId(id)
    setDraft((d) => ({ ...d, characters: [...d.characters, newCharacter(id, userId, d.characters)] }))
  }

  const renameCharacter = (id: string, name: string) =>
    setDraft((d) => ({ ...d, characters: d.characters.map((c) => (c.id === id ? { ...c, name } : c)) }))

  const removeCharacter = (id: string, el: Element | null) =>
    removeAnimated(id, el, () => setDraft((d) => ({ ...d, characters: d.characters.filter((c) => c.id !== id) })))

  /** 펼쳐진 직업 목록을 접음 (한 번에 하나만 펼쳐짐) */
  const closePicker = () => {
    const id = pickerFor
    if (id === null) return
    setPickerFor(null)
    const el = dialog.current?.querySelector(`.job-picker[data-character="${id}"]`)
    const animation = el instanceof HTMLElement ? collapse(el) : null
    if (!animation) return
    setClosingPickers((m) => new Map(m).set(id, animation))
    animation.addEventListener('finish', () =>
      setClosingPickers((m) => {
        const next = new Map(m)
        next.delete(id)
        return next
      }),
    )
  }

  const togglePicker = (id: string) => {
    const wasOpen = pickerFor === id
    closePicker()
    if (wasOpen) return
    // 접히던 중이면 접기를 멈추고 다시 펼침
    const closing = closingPickers.get(id)
    if (closing) {
      closing.cancel()
      setClosingPickers((m) => {
        const next = new Map(m)
        next.delete(id)
        return next
      })
    }
    entering.current.add(`picker:${id}`)
    setPickerFor(id)
  }

  const setJob = (id: string, job: string | undefined) => {
    setDraft((d) => ({ ...d, characters: d.characters.map((c) => (c.id === id ? { ...c, job } : c)) }))
    closePicker()
  }

  const apply = () => {
    onApply(draft.users, draft.characters)
    close()
  }

  return (
    <>
      <button onClick={open}>
        파티 설정
      </button>
      <dialog
        ref={dialog}
        className="modal user-modal"
        aria-labelledby="user-modal-title"
        // 바깥(backdrop) 클릭 시 닫기
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        <div className="modal-head">
          <h2 id="user-modal-title">파티 설정</h2>
          <button className="ghost" onClick={close} aria-label="닫기">
            ✕
          </button>
        </div>
        <ul className="user-modal-list">
          {draft.users.map((u, i) => {
            const owned = draft.characters.filter((c) => c.userId === u.id)
            // 사라지는 중인 캐릭터를 빼고 마지막 1개면 삭제 불가
            const remaining = owned.filter((c) => !leaving.has(c.id)).length
            return (
              <li
                key={u.id}
                ref={enterRef(u.id)}
                style={{ '--user-color': userColor(i, draft.users.length) } as CSSProperties}
              >
                <div className="user-modal-user">
                  <input
                    value={u.name}
                    onChange={(e) => renameUser(u.id, e.target.value)}
                    onFocus={(e) => e.target.select()}
                    autoFocus={focusId === u.id}
                    aria-label="유저 이름"
                  />
                  <button
                    className="ghost"
                    onClick={(e) => removeUser(u.id, e.currentTarget.closest('li'))}
                    aria-label={`${u.name} 삭제`}
                  >
                    ✕
                  </button>
                </div>
                <div className="user-modal-characters">
                  {owned.map((c) => (
                    <div key={c.id} ref={enterRef(c.id)} className="user-modal-character">
                      <button
                        className="job-button"
                        onClick={() => togglePicker(c.id)}
                        aria-expanded={pickerFor === c.id}
                        aria-label={`${c.name} 직업 선택${c.job ? ` (현재 ${c.job})` : ''}`}
                        title={c.job ?? '직업 선택'}
                      >
                        <JobPortrait job={c.job} />
                      </button>
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
                        onClick={(e) => removeCharacter(c.id, e.currentTarget.closest('.user-modal-character'))}
                        disabled={remaining === 1}
                        aria-label={`${c.name} 삭제`}
                      >
                        ✕
                      </button>
                      {(pickerFor === c.id || closingPickers.has(c.id)) && (
                        <div
                          ref={enterRef(`picker:${c.id}`)}
                          className="job-picker"
                          data-character={c.id}
                          role="group"
                          aria-label={`${c.name} 직업`}
                        >
                          {JOBS.map((j) => (
                            <button
                              key={j.name}
                              className={`job-option${c.job === j.name ? ' selected' : ''}`}
                              onClick={() => setJob(c.id, j.name)}
                              aria-pressed={c.job === j.name}
                              aria-label={j.name}
                              title={j.name}
                            >
                              <JobPortrait job={j.name} />
                            </button>
                          ))}
                          {c.job && (
                            <button
                              className="job-option job-clear"
                              onClick={() => setJob(c.id, undefined)}
                              aria-label="선택 해제"
                              title="선택 해제"
                            >
                              <JobPortrait job={undefined} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  <button className="add" onClick={() => addCharacter(u.id)}>
                    + 캐릭터
                  </button>
                </div>
              </li>
            )
          })}
          <li className="user-modal-add">
            <button className="add" onClick={() => addUser()}>
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
