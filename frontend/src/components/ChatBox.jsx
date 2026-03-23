import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { Send, MessageCircle, ChevronDown, History, Sparkles, ChevronRight, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

function formatIST(isoStr) {
  if (!isoStr) return ''
  return new Date(isoStr).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  })
}

function formatISTFull(isoStr) {
  if (!isoStr) return ''
  return new Date(isoStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  })
}

function MessageBubble({ msg, isMine, canDelete, onDelete }) {
  const [hovering, setHovering] = useState(false)
  return (
    <div
      className={`flex items-end gap-1.5 ${isMine ? 'justify-end' : 'justify-start'}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Delete button — left side for own messages */}
      {isMine && canDelete && hovering && (
        <button
          onClick={() => onDelete(msg.id)}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-slate-800 transition-colors shrink-0"
          title="Delete message"
        >
          <Trash2 size={11} />
        </button>
      )}

      <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
        isMine
          ? 'bg-violet-600 text-white rounded-br-sm'
          : 'bg-slate-800/80 text-slate-200 rounded-bl-sm'
      }`}>
        {!isMine && (
          <div className="text-[10px] text-slate-400 mb-1 capitalize font-medium">
            {msg.sender_name} · {msg.sender_role}
          </div>
        )}
        <p className="text-xs leading-relaxed break-words">{msg.text}</p>
        <p className={`text-[10px] mt-1 ${isMine ? 'text-violet-200/70' : 'text-slate-500'}`}>
          {formatIST(msg.at)} IST
        </p>
      </div>
    </div>
  )
}

function PastSession({ session }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="border border-slate-800/50 rounded-xl overflow-hidden mb-2">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-900/40 hover:bg-slate-800/30 transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <History size={11} className="text-slate-600 shrink-0" />
          <span className="text-xs text-slate-500 truncate">{session.session_label}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="text-[10px] text-slate-700">{formatISTFull(session.escalated_at)}</span>
          <ChevronRight size={11} className={`text-slate-700 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            {session.chat_summary && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-violet-500/5 border-b border-slate-800/40">
                <Sparkles size={10} className="text-violet-400 mt-0.5 shrink-0" />
                <p className="text-[11px] text-violet-300/80 leading-relaxed italic">{session.chat_summary}</p>
              </div>
            )}
            <div className="p-3 space-y-2 max-h-52 overflow-y-auto">
              {!session.messages?.length ? (
                <p className="text-xs text-slate-700 text-center py-3">No messages in this session.</p>
              ) : (
                session.messages.map(msg => (
                  <MessageBubble key={msg.id} msg={msg} isMine={false} canDelete={false} />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function ChatBox({ complaintId, assignedAgent, readOnly = false }) {
  const { user } = useAuth()
  const [current, setCurrent] = useState([])
  const [pastSessions, setPastSessions] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [open, setOpen] = useState(false)
  const bottomRef = useRef(null)
  const pollRef = useRef(null)

  const fetchMessages = useCallback(async () => {
    try {
      const { data } = await api.get(`/complaints/${complaintId}/messages`)
      setCurrent(data.current || [])
      setPastSessions(data.past_sessions || [])
    } catch { /* not a participant */ }
  }, [complaintId])

  useEffect(() => {
    if (open) {
      fetchMessages()
      pollRef.current = setInterval(fetchMessages, 5000)
    } else {
      clearInterval(pollRef.current)
    }
    return () => clearInterval(pollRef.current)
  }, [open, fetchMessages])

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [current, open])

  const send = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setSending(true)
    try {
      const { data } = await api.post(`/complaints/${complaintId}/messages`, { text })
      setCurrent(p => [...p, data])
      setText('')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send')
    } finally { setSending(false) }
  }

  const deleteMsg = async (msgId) => {
    try {
      await api.delete(`/complaints/${complaintId}/messages/${msgId}`)
      setCurrent(p => p.filter(m => m.id !== msgId))
      toast.success('Message deleted')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Delete failed')
    }
  }

  const isMine = (msg) => msg.sender_id === user?.id
  // User can delete their own messages; admin can delete any
  const canDelete = (msg) => !readOnly && (user?.role === 'admin' || msg.sender_id === user?.id)
  const totalCount = current.length + pastSessions.reduce((s, p) => s + (p.messages?.length || 0), 0)
  // Only user and assigned agent can send; admin is read-only in chat
  const canSend = !readOnly && (user?.role === 'user' || user?.role === 'agent')

  return (
    <div className="bg-[#0d1117] border border-slate-800/60 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-800/20 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <MessageCircle size={15} className="text-violet-400" />
          <span>{readOnly ? 'Chat History' : 'Chat'}</span>
          {assignedAgent && !readOnly && (
            <span className="text-xs text-slate-500 font-normal">with {assignedAgent}</span>
          )}
          {totalCount > 0 && (
            <span className="text-[10px] bg-violet-600/80 text-white px-1.5 py-0.5 rounded-full">{totalCount}</span>
          )}
        </div>
        <ChevronDown size={15} className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden border-t border-slate-800/60"
          >
            <div className="flex flex-col" style={{ maxHeight: '500px' }}>

              {/* Past sessions */}
              {pastSessions.length > 0 && (
                <div className="px-3 pt-3 pb-1 border-b border-slate-800/40 overflow-y-auto max-h-56">
                  <p className="text-[10px] text-slate-700 uppercase tracking-widest mb-2 px-1">Previous Sessions</p>
                  {pastSessions.map((s, i) => <PastSession key={i} session={s} />)}
                </div>
              )}

              {/* Current messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[140px]">
                {pastSessions.length > 0 && (
                  <p className="text-[10px] text-slate-700 uppercase tracking-widest text-center mb-3">Current Session</p>
                )}
                {current.length === 0 ? (
                  <p className="text-xs text-slate-700 text-center pt-8">
                    {readOnly ? 'No messages in this complaint.' : 'No messages yet. Start the conversation.'}
                  </p>
                ) : (
                  current.map(msg => (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      isMine={isMine(msg)}
                      canDelete={canDelete(msg)}
                      onDelete={deleteMsg}
                    />
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input — hidden for admin/read-only */}
              {canSend && (
                <form onSubmit={send} className="flex items-center gap-2 p-3 border-t border-slate-800/60 shrink-0">
                  <input
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="Type a message..."
                    className="input-field flex-1 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={sending || !text.trim()}
                    className="w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 flex items-center justify-center transition-colors shrink-0"
                  >
                    {sending
                      ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <Send size={14} />
                    }
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
