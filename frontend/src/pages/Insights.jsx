import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts'
import {
  TrendingUp, Clock, AlertTriangle, CheckCircle2, BarChart2,
  Download, FileText, Loader2, Sparkles, RefreshCw, Shield
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const COLORS = ['#7c3aed', '#2563eb', '#16a34a', '#d97706', '#dc2626', '#0891b2']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="border rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">{p.value}</p>
      ))}
    </div>
  )
}

export default function Insights() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rootCause, setRootCause] = useState(null)
  const [loadingRC, setLoadingRC] = useState(false)
  const [exportingCSV, setExportingCSV] = useState(false)

  useEffect(() => {
    api.get('/complaints/insights')
      .then(({ data }) => setData(data))
      .catch(() => toast.error('Failed to load insights'))
      .finally(() => setLoading(false))
  }, [])

  const generateRootCause = async () => {
    setLoadingRC(true)
    setRootCause(null)
    try {
      const { data } = await api.get('/complaints/report/root-cause')
      setRootCause(data)
    } catch { toast.error('Failed to generate report') }
    finally { setLoadingRC(false) }
  }

  const exportCSV = async () => {
    setExportingCSV(true)
    try {
      const resp = await api.get('/complaints/export/csv', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([resp.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `complaints_report_${new Date().toISOString().slice(0,10)}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('Report downloaded')
    } catch { toast.error('Export failed') }
    finally { setExportingCSV(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!data) return null

  const categoryData = Object.entries(data.by_category || {}).map(([name, value]) => ({ name, value }))
  const sentimentData = Object.entries(data.by_sentiment || {}).map(([name, value]) => ({ name, value }))
  const priorityData  = Object.entries(data.by_priority  || {}).map(([name, value]) => ({ name, value }))
  const trendData     = data.daily_trend || []

  const kpis = [
    { label: 'Total Complaints', value: data.total, icon: BarChart2, color: 'text-violet-400', bg: 'bg-violet-400/10' },
    { label: 'Avg Resolution', value: data.avg_resolution_time ? `${data.avg_resolution_time}h` : '—', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'SLA Breaches', value: data.sla_breaches ?? 0, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-400/10' },
    { label: 'Resolved', value: data.by_status?.resolved ?? 0, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  ]

  const axisStyle = { fill: '#475569', fontSize: 11 }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-400/10 flex items-center justify-center">
            <TrendingUp size={18} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Insights</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {user?.role === 'admin' ? 'All complaints' : 'Your assigned complaints'}
            </p>
          </div>
        </div>
        {user?.role === 'admin' && (
          <div className="flex items-center gap-2">
            <button onClick={exportCSV} disabled={exportingCSV}
              className="btn-ghost flex items-center gap-2 text-xs">
              {exportingCSV ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              Export CSV
            </button>
            <button onClick={generateRootCause} disabled={loadingRC}
              className="btn-primary flex items-center gap-2 text-xs">
              {loadingRC ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              AI Root Cause Report
            </button>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((k, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500">{k.label}</span>
              <div className={`w-8 h-8 rounded-xl ${k.bg} flex items-center justify-center`}>
                <k.icon size={15} className={k.color} />
              </div>
            </div>
            <div className={`text-3xl font-bold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Category bar */}
        <div className="card p-5">
          <p className="text-sm font-medium mb-5">By Category</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryData} barSize={20}>
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sentiment pie */}
        <div className="card p-5">
          <p className="text-sm font-medium mb-5">Sentiment Distribution</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={sentimentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={72} innerRadius={36}>
                {sentimentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily trend */}
      {trendData.length > 0 && (
        <div className="card p-5 mb-5">
          <p className="text-sm font-medium mb-5">Daily Trend (last 14 days)</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trendData}>
              <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={2} dot={{ fill: '#7c3aed', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Priority breakdown + top issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <p className="text-sm font-medium mb-5">By Priority</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={priorityData} barSize={20} layout="vertical">
              <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} width={55} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {priorityData.map((entry, i) => {
                  const c = entry.name === 'high' ? '#ef4444' : entry.name === 'medium' ? '#f59e0b' : '#10b981'
                  return <Cell key={i} fill={c} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {data.top_issues?.length > 0 && (
          <div className="card p-5">
            <p className="text-sm font-medium mb-4">Frequent Issues</p>
            <div className="space-y-3">
              {data.top_issues.map((issue, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm truncate mr-3" style={{ color: 'var(--text-primary)' }}>{issue.title}</span>
                  <span className="text-xs shrink-0 px-2 py-0.5 rounded-lg" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>{issue.count}×</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Regulatory Reporting Section — admin only */}
      {user?.role === 'admin' && (
        <div className="mt-5">
          <AnimatePresence>
            {(loadingRC || rootCause) && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-violet-400/10 flex items-center justify-center">
                      <Shield size={15} className="text-violet-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>AI Root Cause Analysis Report</p>
                      {rootCause?.generated_at && (
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          Generated {new Date(rootCause.generated_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={generateRootCause} disabled={loadingRC}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-violet-500/10 text-violet-400">
                      <RefreshCw size={11} className={loadingRC ? 'animate-spin' : ''} /> Regenerate
                    </button>
                    {rootCause?.report && (
                      <button onClick={() => {
                        const blob = new Blob([rootCause.report], { type: 'text/plain' })
                        const a = document.createElement('a')
                        a.href = URL.createObjectURL(blob)
                        a.download = `root_cause_report_${new Date().toISOString().slice(0,10)}.txt`
                        a.click()
                      }} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-emerald-500/10 text-emerald-400">
                        <Download size={11} /> Download
                      </button>
                    )}
                  </div>
                </div>

                {loadingRC ? (
                  <div className="space-y-3">
                    {[90, 75, 85, 60, 70].map((w, i) => (
                      <div key={i} className="h-3 rounded-full animate-pulse" style={{ background: 'var(--bg-elevated)', width: `${w}%` }} />
                    ))}
                    <p className="text-xs text-violet-400 flex items-center gap-1.5 mt-2">
                      <Sparkles size={11} /> AI is analyzing complaint patterns...
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontFamily: 'inherit', lineHeight: '1.7' }}>
                    {rootCause?.report}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Regulatory export card */}
          <div className="card p-5 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-400/10 flex items-center justify-center">
                  <FileText size={15} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Regulatory Report Export</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Full complaint data with SLA status, severity scores, escalation counts — CSV format
                  </p>
                </div>
              </div>
              <button onClick={exportCSV} disabled={exportingCSV}
                className="btn-primary flex items-center gap-2 text-xs shrink-0">
                {exportingCSV ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                Download CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
