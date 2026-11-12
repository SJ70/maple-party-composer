import { useRef, useState } from 'react'
import { BOSS_OPTIONS, DIFFICULTIES, presetId } from '../bosses.ts'
import type { Boss } from '../types.ts'
import { BossImage, DifficultyBadge } from './BossLabel.tsx'

type Props = {
  bosses: Boss[]
  onApply: (ids: string[]) => void
}

/** "보스 설정" 버튼과 보스별 난이도를 체크하는 모달 */
export function BossSelect({ bosses, onApply }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const open = () => {
    setChecked(new Set(bosses.map((b) => b.id)))
    dialog.current?.showModal()
  }
  const close = () => dialog.current?.close()

  const toggle = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const apply = () => {
    // 보스 목록 순서, 난이도는 이지 → 익스트림 순
    onApply(BOSS_OPTIONS.flatMap((b) => b.difficulties.map((d) => presetId(b.id, d))).filter((id) => checked.has(id)))
    close()
  }

  return (
    <>
      <button onClick={open}>
        보스 설정
      </button>
      <dialog
        ref={dialog}
        className="modal"
        aria-labelledby="boss-modal-title"
        // 바깥(backdrop) 클릭 시 닫기
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        <div className="modal-head">
          <h2 id="boss-modal-title">보스 선택</h2>
          <button className="ghost" onClick={close} aria-label="닫기">
            ✕
          </button>
        </div>
        <ul className="boss-modal-list">
          {BOSS_OPTIONS.map((b) => (
            <li key={b.id}>
              <span className="boss-modal-name">
                <BossImage src={b.image} />
                <strong>{b.name}</strong>
              </span>
              <span className="boss-modal-difficulties">
                {b.difficulties.map((d) => {
                  const id = presetId(b.id, d)
                  return (
                    <label key={d} className="difficulty-option">
                      <input
                        type="checkbox"
                        checked={checked.has(id)}
                        onChange={() => toggle(id)}
                        aria-label={`${DIFFICULTIES[d]} ${b.name}`}
                      />
                      <DifficultyBadge difficulty={d} />
                    </label>
                  )
                })}
              </span>
            </li>
          ))}
        </ul>
        <div className="modal-foot">
          <span className="muted">{checked.size}개 선택</span>
          <button className="ghost" onClick={close}>
            취소
          </button>
          <button onClick={apply}>적용</button>
        </div>
      </dialog>
    </>
  )
}
