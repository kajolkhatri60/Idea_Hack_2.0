import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { Send, MessageSquare, User, ChevronLeft, Circle } from 'lucide-react'
import toast from 'react-hot-toast'

function formatIST(isoStr) {
  if (!isoStr) return ''
  return new Date(isoStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  })
}

function timeAgo(isoStr) {
  if (!isoStr) return ''
  const diff = Math.floor((Date.now() - new Date(isoStr)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function InternalChat() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [threads, setThreads] = useState([])
  const [activeThread, setActiveThread] = useState(null) // agent_id
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingThreads, setLoadingThreads] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const bottomRef = useRef(null)
  const pollRef = useRef(null)

  // For agents, their own thread is always agent_id = their own id
  const agentThreadId = isAdmin ? activeThread : user?.id

  const fetchThreads = useCallback(async () => {
    try {
      const { data } = await api.get('/internal/threads')
      setThreads(data)
      // Agent: auto-open their own thread
      if (!isAdmin && data.length > 0 && !activeThread) {
        setActiveThread(data[0].agent_id)
      }
    } catch { /* silent */ }
    finally { setLoadingThreads(false) }
  }, [isAdmin])

  const fetchMessages = useCallback(async (threadId) => {
    if (!threadId) return
    setLoadingMsgs(true)
    try {
      const { data } = await api.get(`/internal/threads/${threadId}/messages`)
      setMessages(data)
      // Mark thread as read locally
      setThreads(prev => prev.map(t => t.agent_id === threadId ? { ...t, unread: 0 } : t))
    } catch { /* silent */ }
    finally { setLoadingMsgs(false) }
  }, [])

  // Initial load
  useEffect(() => { fetchThreads() }, [fetchThreads])

  // Auto-open agent's own thread
  useEffect(() => {
    if (!isAdmin && user?.id) setActiveThread(user.id)
  }, [isAdmin, user?.id])

  // Poll messages when a thread is open
  useEffect(() => {
    if (!agentThreadId) return
    fetchMessages(agentThreadId)
    pollRef.current = setInterval(() => fetchMessages(agentThreadId), 4000)
    return () => clearInterval(pollRef.current)
  }, [agentThreadId, fetchMessages])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const openThread = (agentId) => {
    setActiveThread(agentId)
    setMessages([])
  }

  const send = async (e) => {
    e.preventDefault()
    if (!text.trim() || !agentThreadId) return
    setSending(true)
    try {
      const { data } = await api.post(`/internal/threads/${agentThreadId}/messages`, { text })
      setMessages(p => [...p, data])
      setText('')
      // Refresh thread list to update last_msg
      fetchThreads()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send')
    } finally { setSending(false) }
  }

  const isMine = (msg) => msg.sender_id === user?.id

  const activeThreadData = threads.find(t => t.agent_id === agentThreadId)

  return (
    <div className="flex h-full bg-[#080b14]">

      {/* Sidebar — admin sees thread list, agent sees nothing (auto-opens) */}
      {isAdmin && (
        <div className="w-64 shrink-0 border-r border-slate-800/60 flex flex-col bg-[#0d1117]">
          <div className="px-4 py-4 border-b border-slate-800/60">
            <h2 className="text-sm font-semibold">Agent Messages</h2>
            <p className="text-xs text-slate-500 mt-0.5">Direct threads with your agents</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingThreads ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : threads.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageSquare size={24} className="mx-auto mb-2 text-slate-700" />
                <p className="text-xs text-slate-600">No agent threads yet.</p>
                <p className="text-xs text-slate-700 mt-1">Agents will appear here once they message you.</p>
              </div>
            ) : (
              threads.map(t => (
                <button
                  key={t.agent_id}
                  onClick={() => openThread(t.agent_id)}
                  className={`w-full flex items-start gap-3 px-4 py-3.5 border-b border-slate-800/30 text-left transition-colors hover:bg-slate-800/30 ${
                    activeThread === t.agent_id ? 'bg-slate-800/40 border-l-2 border-l-violet-500' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 text-xs font-semibold text-slate-300">
                    {t.agent_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{t.agent_name}</span>
                      {t.unread > 0 && (
                        <span className="text-[10px] bg-violet-600 text-white px-1.5 py-0.5 rounded-full shrink-0 ml-1">{t.unread}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{t.last_msg || 'No messages yet'}</p>
                    {t.last_at && <p className="text-[10px] text-slate-700 mt-0.5">{timeAgo(t.last_at)}</p>}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!agentThreadId ? (
          /* Empty state for admin with no thread selected */
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
            <MessageSquare size={36} className="mb-3 opacity-30" />
            <p className="text-sm">Select an agent to view their thread</p>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="h-14 shrink-0 flex items-center gap-3 px-5 border-b border-slate-800/60 bg-[#0d1117]">
              {isAdmin && (
                <button onClick={() => setActiveThread(null)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors mr-1">
                  <ChevronLeft size={15} />
                </button>
              )}
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300 shrink-0">
                {isAdmin
                  ? (activeThreadData?.agent_name?.[0]?.toUpperCase() || '?')
                  : 'A'}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {isAdmin ? (activeThreadData?.agent_name || 'Agent') : 'Admin'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {isAdmin ? 'Agent' : 'Support Admin'}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <Circle size={7} className="text-emerald-400 fill-emerald-400" />
                <span className="text-[10px] text-slate-500">Online</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {loadingMsgs ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-600">
                  <MessageSquare size={28} className="mb-2 opacity-30" />
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs mt-1 text-slate-700">
                    {isAdmin ? 'Send a message to this agent' : 'Send a message to admin'}
                  </p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const mine = isMine(msg)
                  const showDate = i === 0 || new Date(messages[i-1].at).toDateString() !== new Date(msg.at).toDateString()
                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="flex items-center gap-3 my-4">
                          <div className="flex-1 h-px bg-slate-800/60" />
                          <span className="text-[10px] text-slate-600 shrink-0">
                            {new Date(msg.at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', timeZone: 'Asia/Kolkata' })}
                          </span>
                          <div className="flex-1 h-px bg-slate-800/60" />
                        </div>
                      )}
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}
                      >
                        {!mine && (
                          <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-semibold text-slate-400 shrink-0 mb-0.5">
                            {msg.sender_name?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div className={`max-w-[68%] rounded-2xl px-4 py-2.5 ${
                          mine
                            ? 'bg-violet-600 text-white rounded-br-sm'
                            : 'bg-[#0d1117] border border-slate-800/60 text-slate-200 rounded-bl-sm'
                        }`}>
                          {!mine && (
                            <p className="text-[10px] font-medium mb-1 capitalize text-slate-400">{msg.sender_name}</p>
                          )}
                          <p className="text-sm leading-relaxed break-words">{msg.text}</p>
                          <p className={`text-[10px] mt-1.5 ${mine ? 'text-violet-200/60' : 'text-slate-600'}`}>
                            {formatIST(msg.at)}
                          </p>
                        </div>
                      </motion.div>
                    </div>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={send} className="flex items-center gap-3 px-5 py-4 border-t border-slate-800/60 bg-[#0d1117] shrink-0">
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={`Message ${isAdmin ? (activeThreadData?.agent_name || 'agent') : 'admin'}...`}
                className="input-field flex-1"
              />
              <button
                type="submit"
                disabled={sending || !text.trim()}
                className="w-10 h-10 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 flex items-center justify-center transition-colors shrink-0"
              >
                {sending
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Send size={15} />
                }
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
