const DURATION = 200
const EASING = 'cubic-bezier(0.2, 0, 0, 1)'

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/** 지금 크기 → 높이 0 (위아래 padding · margin · 테두리 포함, 투명) 키프레임 */
function frames(el: HTMLElement): Keyframe[] {
  const style = getComputedStyle(el)
  return [
    {
      height: `${el.offsetHeight}px`,
      paddingTop: style.paddingTop,
      paddingBottom: style.paddingBottom,
      marginTop: style.marginTop,
      marginBottom: style.marginBottom,
      borderTopWidth: style.borderTopWidth,
      borderBottomWidth: style.borderBottomWidth,
      opacity: 1,
    },
    {
      height: '0px',
      paddingTop: '0px',
      paddingBottom: '0px',
      marginTop: '0px',
      marginBottom: '0px',
      borderTopWidth: '0px',
      borderBottomWidth: '0px',
      opacity: 0,
    },
  ]
}

function run(el: HTMLElement, keyframes: Keyframe[], fill: FillMode): Animation {
  el.style.overflow = 'hidden'
  const animation = el.animate(keyframes, { duration: DURATION, easing: EASING, fill })
  // 접기를 취소하고 바로 펼치는 경우, 늦게 오는 cancel 이벤트가 펼치는 중인 overflow를 풀지 않게
  const restore = () => {
    if (el.getAnimations().length === 0) el.style.overflow = ''
  }
  animation.addEventListener('finish', restore)
  animation.addEventListener('cancel', restore)
  return animation
}

/** 새로 생긴 요소를 높이 0에서 펼침 */
export function expand(el: HTMLElement) {
  if (reducedMotion()) return
  run(el, frames(el).reverse(), 'none')
}

/** 요소를 높이 0으로 접음. 끝난 뒤에도 접힌 채로 두니 finish에서 DOM에서 빼야 함. 모션 줄이기 설정이면 null */
export function collapse(el: HTMLElement): Animation | null {
  if (reducedMotion()) return null
  el.inert = true
  const animation = run(el, frames(el), 'forwards')
  animation.addEventListener('cancel', () => (el.inert = false))
  return animation
}
