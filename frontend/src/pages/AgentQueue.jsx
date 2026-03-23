import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import api from '../api/axios'
import ComplaintCard from '../components/ComplaintCard'
import { Inbox, AlertCircle, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUSES = ['all', 'open', 'in-progress', 'resolved']
const CHANNELS = ['all', 'web', 'email', 'whatsapp', 'phone', 'chat']

export default function AgentQueue() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [channel, setChannel] = useState('all')
  const [status, setStatus] = useState('all')

  const fetchQueue = async () => {
    setLoading(true)
    try {
      const params = {}
      if (channel !== 'all') params.channel = channel
      if (status !== 'all') params.status = status
      const { data } = await api.get('/complaints', { params })
      setComplaints(data)
    } catch { toast.error('Failed to load queue') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchQueue() }, [channel, status])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-400/10 flex items-center justify-center">
            <Inbox size={18} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Complaint Queue</h1>
            <p className="text-xs text-slate-500 mt-0.5">{complaints.length} open tickets</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          <div className="flex gap-1 bg-slate-900/60 border border-slate-800/60 rounded-xl p-1">
            {CHANNELS.map(c => (
              <button key={c} onClick={() => setChannel(c)}
                className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-colors ${
                  channel === c ? 'bg-violet-600 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}>{c}</button>
            ))}
          </div>
        </div>
        <div className="flex gap-1 bg-slate-900/60 border border-slate-800/60 rounded-xl p-1">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-colors ${
                status === s ? 'bg-violet-600 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}>{s}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : complaints.length === 0 ? (
        <div className="text-center py-20 text-slate-600">
          <AlertCircle size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Queue is empty</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {complaints.map((c, i) => (
            <motion.div key={c._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <ComplaintCard complaint={c} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
