import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import api from '../api/axios'
import {
  Settings, AlertTriangle, CheckCircle2, Clock, TrendingUp,
  Trash2, Edit2, Save, X, MessageSquare, Mail, Phone, Globe, MessageCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

const CHANNEL_OPTIONS = [
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: 'text-emerald-400' },
  { value: 'email',    label: 'Email',    icon: Mail,          color: 'text-blue-400' },
  { value: 'phone',    label: 'Phone',    icon: Phone,         color: 'text-yellow-400' },
  { value: 'chat',     label: 'Live Chat',icon: MessageCircle, color: 'text-violet-400' },
  { value: 'web',      label: 'Web',      icon: Globe,         color: 'text-slate-400' },
]

function AgentRow({ agent, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(false)
  const [channel, setChannel] = useState(agent.agent_channel)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await onUpdate(agent.id, { agent_channel: channel })
      setEditing(false)
      toast.success('Agent updated')
    } catch { toast.error('Update failed') }
    finally { setSaving(false) }
  }

  const ch = CHANNEL_OPTIONS.find(c => c.value === agent.agent_channel)
  const ChIcon = ch?.icon || Globe

  return (
    <div className="flex items-center justify-between py-3 border-b border-theme last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300">
          {agent.name[0]?.toUpperCase()}
        </div>
        <div>
          <div className="text-sm font-medium">{agent.name}</div>
          <div className="text-xs text-slate-500">{agent.email}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {editing ? (
          <div className="flex items-center gap-2">
            <select value={channel} onChange={e => setChannel(e.target.value)}
              className="input-field py-1 text-xs w-36">
              {CHANNEL_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <button onClick={save} disabled={saving}
              className="w-7 h-7 rounded-lg bg-violet-600 hover:bg-violet-700 flex items-center justify-center transition-colors">
              {saving
                ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                : <Save size={12} />}
            </button>
            <button onClick={() => setEditing(false)}
              className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors">
              <X size={12} />
            </button>
          </div>
        ) : (
          <span className={`flex items-center gap-1.5 text-xs badge border border-slate-700/50 bg-slate-800/50 ${ch?.color || 'text-slate-400'}`}>
            <ChIcon size={11} /> {ch?.label || agent.agent_channel}
          </span>
        )}

        <span className={`text-xs badge border ${
          agent.active !== false
            ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
            : 'text-slate-500 bg-slate-800 border-slate-700'
        }`}>
          {agent.active !== false ? 'Active' : 'Inactive'}
        </span>

        {!editing && (
          <div className="flex items-center gap-1">
            <button onClick={() => setEditing(true)}
              className="w-7 h-7 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 flex items-center justify-center transition-colors">
              <Edit2 size={12} />
            </button>
            <button onClick={() => onRemove(agent.id)}
              className="w-7 h-7 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 flex items-center justify-center transition-colors">
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminPanel() {
  const [insights, setInsights] = useState(null)
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [insRes, agRes] = await Promise.all([
        api.get('/complaints/insights'),
        api.get('/admin/agents'),
      ])
      setInsights(insRes.data)
      setAgents(agRes.data)
    } catch { toast.error('Failed to load data') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const handleUpdate = async (id, patch) => {
    const { data } = await api.patch(`/admin/agents/${id}`, patch)
    setAgents(prev => prev.map(a => a.id === id ? data : a))
  }

  const handleRemove = async (id) => {
    if (!confirm('Remove this agent? They will lose agent access.')) return
    await api.delete(`/admin/agents/${id}`)
    setAgents(prev => prev.filter(a => a.id !== id))
    toast.success('Agent removed')
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const kpis = [
    { label: 'Total Complaints', value: insights?.total ?? 0,          icon: TrendingUp,   color: 'text-violet-400',  bg: 'bg-violet-400/10' },
    { label: 'SLA Breaches',     value: insights?.sla_breaches ?? 0,   icon: AlertTriangle, color: 'text-red-400',     bg: 'bg-red-400/10' },
    { label: 'Avg Resolution',   value: insights?.avg_resolution_time ? `${insights.avg_resolution_time}h` : 'N/A', icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { label: 'Resolved',         value: insights?.by_status?.resolved ?? 0, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-xl bg-emerald-400/10 flex items-center justify-center">
          <Settings size={18} className="text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Admin Panel</h1>
          <p className="text-xs text-slate-500 mt-0.5">Platform overview & agent management</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((k, i) => (
          <motion.div key={k.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500">{k.label}</span>
              <div className={`w-8 h-8 rounded-xl ${k.bg} flex items-center justify-center`}>
                <k.icon size={15} className={k.color} />
              </div>
            </div>
            <div className={`text-3xl font-bold ${k.color}`}>{k.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Agent management */}
        <div className="card p-5">
          <div className="text-sm font-medium mb-4">Agents ({agents.length})</div>
          {agents.length === 0 ? (
            <p className="text-xs text-slate-600 py-4 text-center">No agents registered yet.</p>
          ) : (
            agents.map(a => (
              <AgentRow key={a.id} agent={a} onUpdate={handleUpdate} onRemove={handleRemove} />
            ))
          )}
        </div>

        {/* Category breakdown */}
        <div className="card p-5">
          <div className="text-sm font-medium mb-4">By Category</div>
          {insights?.by_category && Object.entries(insights.by_category).length > 0 ? (
            <div className="space-y-2.5">
              {Object.entries(insights.by_category).map(([k, v]) => {
                const total = Object.values(insights.by_category).reduce((a, b) => a + b, 0)
                const pct = total ? Math.round((v / total) * 100) : 0
                return (
                  <div key={k}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400 capitalize">{k}</span>
                      <span className="text-slate-500">{v}</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : <p className="text-xs text-slate-600">No data yet</p>}
        </div>
      </div>

      {/* Top issues */}
      {insights?.top_issues?.length > 0 && (
        <div className="card p-5">
          <div className="text-sm font-medium mb-4">Frequent Issues</div>
          <div className="space-y-2">
            {insights.top_issues.map((issue, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-theme last:border-0">
                <span className="text-sm text-slate-300">{issue.title}</span>
                <span className="badge border border-slate-700/50 text-slate-500 bg-slate-800/50">{issue.count}×</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
