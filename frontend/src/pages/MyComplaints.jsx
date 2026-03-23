import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import api from '../api/axios'
import ComplaintCard from '../components/ComplaintCard'
import { ListChecks, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/complaints/mine')
      .then(({ data }) => setComplaints(data))
      .catch(() => toast.error('Failed to load your complaints'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-xl bg-blue-400/10 flex items-center justify-center">
          <ListChecks size={18} className="text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">My Complaints</h1>
          <p className="text-xs text-slate-500 mt-0.5">{complaints.length} total</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : complaints.length === 0 ? (
        <div className="text-center py-20 text-slate-600">
          <AlertCircle size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">You haven't submitted any complaints yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {complaints.map((c, i) => (
            <motion.div key={c._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <ComplaintCard complaint={c} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
