import { jobImage } from '../jobs.ts'

/** 직업 초상화. 직업이 없으면 같은 크기의 물음표 칸 */
export function JobPortrait({ job, className = '' }: { job: string | undefined; className?: string }) {
  const src = jobImage(job)
  return src ? (
    <img className={`job-portrait ${className}`} src={src} alt="" title={job} />
  ) : (
    <span className={`job-portrait empty ${className}`} aria-hidden>
      ?
    </span>
  )
}
