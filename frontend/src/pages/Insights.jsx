import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts'
import { TrendingUp, Clock, AlertTriangle, CheckCircle2, BarChart2 } from 'lucide-react'

const COLORS = ['#7c3aed', '#2563eb', '#16a34a', '#d97706', '#dc2626', '#0891b2']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0d1117] border border-slate-700/60 rounded-xl px-3 py-2 text-xs shadow-xl">
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

  useEffect(() => {
    api.get('/complaints/insights')
      .then(({ data }) => setData(data))
      .catch(() => toast.error('Failed to load insights'))
      .finally(() => setLoading(false))
  }, [])

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
      <div className="flex items-center gap-3 mb-8">
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

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((k, i) => (
          <div key={i} className="bg-[#0d1117] border border-slate-800/60 rounded-2xl p-5">
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
        <div className="bg-[#0d1117] border border-slate-800/60 rounded-2xl p-5">
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
        <div className="bg-[#0d1117] border border-slate-800/60 rounded-2xl p-5">
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
        <div className="bg-[#0d1117] border border-slate-800/60 rounded-2xl p-5 mb-5">
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
        <div className="bg-[#0d1117] border border-slate-800/60 rounded-2xl p-5">
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
          <div className="bg-[#0d1117] border border-slate-800/60 rounded-2xl p-5">
            <p className="text-sm font-medium mb-4">Frequent Issues</p>
            <div className="space-y-3">
              {data.top_issues.map((issue, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-slate-300 truncate mr-3">{issue.title}</span>
                  <span className="text-xs text-slate-500 shrink-0 bg-slate-800 px-2 py-0.5 rounded-lg">{issue.count}×</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
