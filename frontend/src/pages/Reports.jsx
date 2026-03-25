import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/axios'
import toast from 'react-hot-toast'
import {
  FileText, Download, Loader2, Sparkles, AlertTriangle,
  CheckCircle2, Clock, TrendingUp, BarChart2, Shield,
  Filter, Calendar, RefreshCw, ChevronDown, Printer,
  MessageSquare, Mail, Phone, Globe, MessageCircle, Activity
} from 'lucide-react'

const CHANNELS = ['all','web','email','whatsapp','phone','chat']
const STATUSES = ['all','open','in-progress','resolved']

const CHANNEL_ICONS = { web: Globe, email: Mail, whatsapp: MessageSquare, phone: Phone, chat: MessageCircle }

const STATUS_COLOR = {
  open:          'text-blue-400 bg-blue-400/10 border-blue-400/20',
  'in-progress': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  resolved:      'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
}
const PRIORITY_COLOR = {
  high:   'text-red-400',
  medium: 'text-yellow-400',
  low:    'text-emerald-400',
}
const SLA_COLOR = {
  'Met':         'text-emerald-400 bg-emerald-400/10',
  'Breached':    'text-red-400 bg-red-400/10',
  'Within SLA':  'text-blue-400 bg-blue-400/10',
  'N/A':         'text-slate-400 bg-slate-400/10',
}

function KPICard({ label, value, sub, color, bg, icon: Icon }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{label}</span>
        <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon size={13} className={color} />
        </div>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  )
}

function BreakdownBar({ label, data, colorFn }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0)
  if (!total) return null
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>{label}</p>
      <div className="space-y-2">
        {Object.entries(data).sort((a,b) => b[1]-a[1]).map(([k, v]) => {
          const pct = Math.round((v / total) * 100)
          return (
            <div key={k}>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="capitalize" style={{ color: 'var(--text-secondary)' }}>{k}</span>
                <span style={{ color: 'var(--text-muted)' }}>{v} ({pct}%)</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                <motion.div
                  className={`h-full rounded-full ${colorFn ? colorFn(k) : 'bg-violet-500'}`}
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Reports() {
  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]

  const [filters, setFilters] = useState({ date_from: thirtyDaysAgo, date_to: today, channel: 'all', status: 'all' })
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const printRef = u