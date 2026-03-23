import { Clock } from 'lucide-react'

export default function SLABadge({ deadline, status }) {
  if (!deadline) return null
  const d = new Date(deadline)
  const now = new Date()
  const diffMs = d - now
  const diffHrs = Math.floor(diffMs / 3600000)
  const isOverdue = diffMs < 0 && status !== 'resolved'
  const isWarning = diffHrs < 4 && diffHrs >= 0

  let cls = 'text-green-400 bg-green-400/10'
  let label = `${diffHrs}h remaining`

  if (isOverdue) { cls = 'text-red-400 bg-red-400/10'; label = 'SLA Breached' }
  else if (isWarning) { cls = 'text-yellow-400 bg-yellow-400/10'; label = `${diffHrs}h left` }

  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${cls}`}>
      <Clock size={12} /> {label}
    </span>
  )
}
