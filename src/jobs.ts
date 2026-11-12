/** 직업 선택 목록 순서. 이미지 = src/assets/jobs/{name}.webp */
const JOB_NAMES = [
  '히어로',
  '팔라딘',
  '다크나이트',
  '소울마스터',
  '미하일',
  '블래스터',
  '데몬슬레이어',
  '데몬어벤져',
  '아란',
  '카이저',
  '아델',
  '렌',
  '제로',
  '아크메이지 (불,독)',
  '아크메이지 (썬,콜)',
  '비숍',
  '플레임위자드',
  '배틀메이지',
  '에반',
  '루미너스',
  '일리움',
  '라라',
  '키네시스',
  '레테',
  '보우마스터',
  '신궁',
  '패스파인더',
  '윈드브레이커',
  '와일드헌터',
  '메르세데스',
  '카인',
  '나이트로드',
  '섀도어',
  '듀얼블레이드',
  '나이트워커',
  '팬텀',
  '카데나',
  '칼리',
  '호영',
  '바이퍼',
  '캡틴',
  '캐논슈터',
  '스트라이커',
  '메카닉',
  '은월',
  '엔젤릭버스터',
  '아크',
  '제논',
] as const

const images = Object.fromEntries(
  Object.entries(import.meta.glob<string>('./assets/jobs/*.webp', { eager: true, import: 'default' })).map(
    ([path, url]) => [path.replace(/^.*\/|\.webp$/g, ''), url],
  ),
)

export type Job = { name: string; image: string | undefined }

export const JOBS: Job[] = JOB_NAMES.map((name) => ({ name, image: images[name] }))

const byName = new Map(JOBS.map((j) => [j.name, j]))

/** 직업 이름 → 초상화. 직업이 없거나 목록에 없으면 undefined */
export const jobImage = (job: string | undefined) => (job ? byName.get(job)?.image : undefined)
