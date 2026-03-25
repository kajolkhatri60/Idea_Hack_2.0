import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications } from '../context/NotificationContext'
import { useAuth } from '../context/AuthContext'
import { Bell, GitBranch, CheckCircle, X, Trash2, CheckCheck, UserCheck } from 'lucide-react'

const iconMap = {
  escalation: GitBranch,
  resolved: CheckCircle,
  assignment: UserCheck,
  default: Bell,
}

const colorMap = {
  escalation: 'text-orange-400 bg-orange-400/10',
  resolved: 'text-emerald-400 bg-emerald-400/10',
  assignment: 'text-blue-400 bg-blue-400/10',
  default: 'text-violet-400 bg-violet-400/10',
}

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function NotificationPanel({ open, onClose }) {
  const { forRole, markRead, markAllRead, clearAll, unreadForRole } = useNotifications()
  // Get role from AuthContext via prop or re-import
  const { user } = useAuth()
  const notifications = forRole(user?.role)
  const unreadCount = unreadForRole(user?.role)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.15 }}
          className="absolute right-0 top-12 w-80 border rounded-2xl shadow-2xl z-50 overflow-hidden"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-violet-600 text-white px-1.5 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button onClick={markAllRead} title="Mark all read"
                  className="p-1.5 rounded-lg transition-colors hover:bg-slate-800/30"
                  style={{ color: 'var(--text-muted)' }}>
                  <CheckCheck size={13} />
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} title="Clear all"
                  className="p-1.5 rounded-lg hover:text-red-400 transition-colors hover:bg-slate-800/30"
                  style={{ color: 'var(--text-muted)' }}>
                  <Trash2 size={13} />
                </button>
              )}
              <button onClick={onClose}
                className="p-1.5 rounded-lg transition-colors hover:bg-slate-800/30"
                style={{ color: 'var(--text-muted)' }}>
                <X size={13} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12" style={{ color: 'var(--text-muted)' }}>
                <Bell size={24} className="mb-2 opacity-40" />
                <p className="text-xs">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => {
                const Icon = iconMap[n.type] || iconMap.default
                const color = colorMap[n.type] || colorMap.default
                return (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`flex items-start gap-3 px-4 py-3 last:border-0 cursor-pointer transition-colors hover:bg-slate-800/20 ${!n.read ? 'bg-slate-800/10' : ''}`}
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs leading-snug" style={{ color: 'var(--text-primary)' }}>{n.message}</p>
                      {n.detail && <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{n.detail}</p>}
                      <p className="text-[10px] mt-1" style={{ color: 'var(--text-faint)' }}>{timeAgo(n.at)}</p>
                    </div>
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0 mt-1.5" />}
                  </div>
                )
              })
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
