import { useNavigate } from 'react-router-dom'
import { Clock, AlertTriangle, CheckCircle, Loader2, Copy, MessageSquare, Mail, Phone, Globe } from 'lucide-react'

const priorityMap = {
  high:   { cls: 'text-red-400 bg-red-400/10 border-red-400/20', dot: 'bg-red-400' },
  medium: { cls: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', dot: 'bg-yellow-400' },
  low:    { cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', dot: 'bg-emerald-400' },
}

const sentimentMap = {
  positive: 'text-emerald-400',
  neutral:  'text-slate-400',
  negative: 'text-red-400',
}

const statusMap = {
  open:         { icon: Loader2, cls: 'text-blue-400', spin: true },
  'in-progress':{ icon: AlertTriangle, cls: 'text-yellow-400' },
  resolved:     { icon: CheckCircle, cls: 'text-emerald-400' },
}

const channelIcons = {
  whatsapp: MessageSquare,
  email: Mail,
  phone: Phone,
  web: Globe,
  chat: MessageSquare,
}

export default function ComplaintCard({ complaint }) {
  const navigate = useNavigate()
  const { _id, title, category, priority, status, sentiment, sla_deadline, channel, is_duplicate } = complaint

  const p = priorityMap[priority] || priorityMap.medium
  const s = statusMap[status] || statusMap.open
  const StatusIcon = s.icon
  const ChannelIcon = channelIcons[channel] || Globe

  const deadline = sla_deadline ? new Date(sla_deadline) : null
  const isOverdue = deadline && deadline < new Date() && status !== 'resolved'

  return (
    <div
      onClick={() => navigate(`/app/complaints/${_id}`)}
      className="card-hover border rounded-2xl p-5 cursor-pointer group"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-medium text-sm line-clamp-2 leading-snug group-hover:text-violet-400 transition-colors" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        {is_duplicate && (
          <span className="badge border border-orange-400/20 text-orange-400 bg-orange-400/10 shrink-0">Dup</span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        <span className="badge border text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-elevated)' }}>{category}</span>
        <span className={`badge border ${p.cls}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />{priority}
        </span>
        <span className={`text-xs ${sentimentMap[sentiment] || 'text-slate-400'}`}>{sentiment}</span>
      </div>

      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1 ${s.cls}`}>
            <StatusIcon size={12} className={s.spin ? 'animate-spin' : ''} />
            <span className="capitalize">{status}</span>
          </span>
          <span className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <ChannelIcon size={11} />
            <span className="capitalize">{channel}</span>
          </span>
        </div>
        {deadline && (
          <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-400' : ''}`} style={!isOverdue ? { color: 'var(--text-muted)' } : {}}>
            <Clock size={11} />
            {isOverdue ? 'Overdue' : deadline.toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  )
}
