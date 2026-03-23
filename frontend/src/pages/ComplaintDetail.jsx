import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import SLABadge from '../components/SLABadge'
import toast from 'react-hot-toast'
import ChatBox from '../components/ChatBox'
import {
  ArrowLeft, Sparkles, Loader2, Copy, MessageSquare,
  Mail, Phone, Globe, GitBranch, Clock, User
} from 'lucide-react'

const STATUS_OPTIONS = ['open', 'in-progress', 'resolved']

const channelIcons = { whatsapp: MessageSquare, email: Mail, phone: Phone, web: Globe, chat: MessageSquare }

export default function ComplaintDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [suggestion, setSuggestion] = useState('')
  const [suggesting, setSuggesting] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [escalating, setEscalating] = useState(false)

  useEffect(() => {
    api.get(`/complaints/${id}`)
      .then(({ data }) => setComplaint(data))
      .catch(() => toast.error('Failed to load complaint'))
      .finally(() => setLoading(false))
  }, [id])

  const getSuggestion = async () => {
    setSuggesting(true)
    try {
      const { data } = await api.post(`/complaints/${id}/suggest-reply`)
      setSuggestion(data.suggestion)
    } catch { toast.error('Failed to get suggestion') }
    finally { setSuggesting(false) }
  }

  const updateStatus = async (status) => {
    setUpdatingStatus(true)
    try {
      const { data } = await api.patch(`/complaints/${id}`, { status })
      setComplaint(data)
      toast.success('Status updated')
      if (status === 'resolved') {
        addNotification({
          type: 'resolved',
          message: 'Your complaint has been resolved',
          detail: data.title,
          forRoles: ['user', 'admin'],
        })
      }
    } catch { toast.error('Update failed') }
    finally { setUpdatingStatus(false) }
  }

  const escalate = async () => {
    setEscalating(true)
    try {
      const { data } = await api.post(`/complaints/${id}/escalate`)
      setComplaint(data)
      toast.success(`Escalated to ${data.escalated_to} agent`)
      addNotification({
        type: 'escalation',
        message: `Complaint escalated to ${data.escalated_to} agent`,
        detail: complaint?.title,
        forRoles: ['user', 'admin'],
      })
    } catch { toast.error('Escalation failed') }
    finally { setEscalating(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full py-32">
      <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!complaint) return <div className="p-6 text-slate-500">Complaint not found.</div>

  const {
    title, description, category, priority, status, sentiment,
    summary, sla_deadline, channel, is_duplicate, escalation_history = [],
    assigned_agent
  } = complaint

  const ChannelIcon = channelIcons[channel] || Globe

  const priorityCls = {
    high: 'text-red-400 bg-red-400/10 border-red-400/20',
    medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    low: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  }[priority] || 'text-slate-400 bg-slate-800 border-slate-700'

  const sentimentCls = { negative: 'text-red-400 bg-red-400/10 border-red-400/20', positive: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', neutral: 'text-slate-400 bg-slate-800 border-slate-700' }[sentiment] || 'text-slate-400 bg-slate-800 border-slate-700'

  const canEdit = user?.role === 'admin' || user?.role === 'agent'

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-100 mb-6 transition-colors">
        <ArrowLeft size={15} /> Back
      </button>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        {/* Title row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-xl font-semibold leading-snug">{title}</h1>
          <SLABadge deadline={sla_deadline} status={status} />
        </div>

        {/* Duplicate warning */}
        {is_duplicate && (
          <div className="flex items-center gap-2 bg-orange-400/8 border border-orange-400/20 text-orange-300 text-sm rounded-xl px-4 py-3 mb-4">
            <Copy size={14} className="shrink-0" />
            This complaint may be a duplicate of an existing ticket.
          </div>
        )}

        {/* Meta badges */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className={`badge border ${priorityCls}`}>{priority} priority</span>
          <span className={`badge border ${sentimentCls}`}>{sentiment}</span>
          <span className="badge border border-slate-700/50 text-slate-400 bg-slate-800/50">{category}</span>
          <span className="badge border border-slate-700/50 text-slate-400 bg-slate-800/50 flex items-center gap-1">
            <ChannelIcon size={11} /> {channel}
          </span>
          {assigned_agent && (
            <span className="badge border border-violet-500/20 text-violet-400 bg-violet-400/10 flex items-center gap-1">
              <User size={11} /> {assigned_agent}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Description */}
            <div className="bg-[#0d1117] border border-slate-800/60 rounded-2xl p-5">
              <div className="text-xs text-slate-500 mb-3">Description</div>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{description}</p>
            </div>

            {/* AI Summary */}
            {summary && (
              <div className="bg-violet-500/5 border border-violet-500/15 rounded-2xl p-5">
                <div className="flex items-center gap-1.5 text-xs text-violet-400 mb-2">
                  <Sparkles size={12} /> AI Summary
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{summary}</p>
              </div>
            )}

            {/* Escalation history */}
            {escalation_history.length > 0 && (
              <div className="bg-[#0d1117] border border-slate-800/60 rounded-2xl p-5">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                  <GitBranch size={12} /> Escalation History
                </div>
                <div className="space-y-3">
                  {escalation_history.map((e, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                      <div>
                        <span className="text-slate-300">Escalated to <span className="text-violet-400">{e.to}</span> agent</span>
                        <div className="text-xs text-slate-600 mt-0.5">{e.reason}</div>
                        <div className="text-xs text-slate-700">{new Date(e.at).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agent Assist */}
            {canEdit && (
              <div className="bg-[#0d1117] border border-slate-800/60 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-medium">Agent Assist</div>
                  <button onClick={getSuggestion} disabled={suggesting}
                    className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3">
                    {suggesting ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    Generate Reply
                  </button>
                </div>
                {suggestion ? (
                  <div className="relative">
                    <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/50 rounded-xl p-4 pr-10">{suggestion}</p>
                    <button
                      onClick={() => { navigator.clipboard.writeText(suggestion); toast.success('Copied') }}
                      className="absolute top-3 right-3 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600">AI will generate a contextual reply based on the complaint and its history.</p>
                )}
              </div>
            )}

            {/* Chat */}
            <ChatBox complaintId={id} assignedAgent={assigned_agent} />
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Status control */}
            {canEdit && (
              <div className="bg-[#0d1117] border border-slate-800/60 rounded-2xl p-5">
                <div className="text-xs text-slate-500 mb-3">Update Status</div>
                <div className="space-y-1.5">
                  {STATUS_OPTIONS.map(s => (
                    <button key={s} disabled={updatingStatus} onClick={() => updateStatus(s)}
                      className={`w-full px-3 py-2 rounded-xl text-xs capitalize text-left transition-colors ${
                        status === s
                          ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                          : 'text-slate-500 hover:bg-slate-800/60 hover:text-slate-300 border border-transparent'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Escalate */}
            {canEdit && status !== 'resolved' && (
              <div className="bg-[#0d1117] border border-slate-800/60 rounded-2xl p-5">
                <div className="text-xs text-slate-500 mb-3">Escalation</div>
                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                  Escalate to another channel agent. They'll receive the full complaint history.
                </p>
                <button onClick={escalate} disabled={escalating}
                  className="btn-ghost w-full flex items-center justify-center gap-2 text-xs">
                  {escalating ? <Loader2 size={12} className="animate-spin" /> : <GitBranch size={12} />}
                  Escalate Complaint
                </button>
              </div>
            )}

            {/* SLA info */}
            <div className="bg-[#0d1117] border border-slate-800/60 rounded-2xl p-5">
              <div className="text-xs text-slate-500 mb-3 flex items-center gap-1.5"><Clock size={12} /> SLA</div>
              <SLABadge deadline={sla_deadline} status={status} />
              {sla_deadline && (
                <div className="text-xs text-slate-600 mt-2">
                  Deadline: {new Date(sla_deadline).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
