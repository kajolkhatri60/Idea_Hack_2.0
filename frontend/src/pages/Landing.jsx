import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import {
  Zap, Shield, BarChart3, MessageSquare, GitMerge,
  Clock, ChevronRight, CheckCircle, Star, ArrowRight
} from 'lucide-react'

const features = [
  { icon: Zap, title: 'AI Classification', desc: 'Groq LLM instantly classifies complaints by sentiment, priority, and category.', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { icon: Shield, title: 'Duplicate Detection', desc: 'Semantic similarity via sentence-transformers catches duplicate complaints before they pile up.', color: 'text-violet-400', bg: 'bg-violet-400/10' },
  { icon: Clock, title: 'SLA Tracking', desc: 'Automatic deadlines with escalation alerts so nothing slips through the cracks.', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { icon: MessageSquare, title: 'Agent Assist', desc: 'AI-generated reply suggestions with full complaint history for every agent.', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { icon: GitMerge, title: 'Multi-channel', desc: 'Complaints from WhatsApp, email, calls, and web — all in one unified dashboard.', color: 'text-pink-400', bg: 'bg-pink-400/10' },
  { icon: BarChart3, title: 'Live Insights', desc: 'Trend charts, sentiment breakdowns, and SLA breach reports in real time.', color: 'text-orange-400', bg: 'bg-orange-400/10' },
]

const roles = [
  {
    role: 'User',
    color: 'border-blue-500/30 bg-blue-500/5',
    accent: 'text-blue-400',
    dot: 'bg-blue-400',
    points: ['Submit complaints via any channel', 'Track status in real time', 'Get notified on resolution'],
  },
  {
    role: 'Agent',
    color: 'border-violet-500/30 bg-violet-500/5',
    accent: 'text-violet-400',
    dot: 'bg-violet-400',
    points: ['View assigned complaint queue', 'AI-suggested replies with history', 'Escalate or resolve tickets'],
  },
  {
    role: 'Admin',
    color: 'border-emerald-500/30 bg-emerald-500/5',
    accent: 'text-emerald-400',
    dot: 'bg-emerald-400',
    points: ['Full dashboard & analytics', 'Manage agents and assignments', 'Configure SLA rules & escalations'],
  },
]

const stats = [
  { value: '3×', label: 'Faster resolution' },
  { value: '94%', label: 'SLA compliance' },
  { value: '60%', label: 'Fewer duplicates' },
  { value: '< 2s', label: 'AI response time' },
]

const fade = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#080b14] text-slate-100">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden grid-bg pt-16">
        {/* Ambient blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs px-4 py-2 rounded-full mb-8"
          >
            <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
            Powered by Groq LLM + HuggingFace Transformers
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
          >
            Resolve complaints
            <br />
            <span className="gradient-text">10× smarter</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            SmartResolve AI centralizes customer complaints from every channel, classifies them instantly with AI, and routes them to the right agent — with full context.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/register" className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-7 py-3.5 rounded-xl font-medium text-sm transition-all hover:shadow-lg hover:shadow-violet-500/25 hover:-translate-y-0.5">
              Start for free <ArrowRight size={16} />
            </Link>
            <Link to="/contact" className="flex items-center gap-2 text-slate-300 hover:text-slate-100 border border-slate-700 hover:border-slate-600 px-7 py-3.5 rounded-xl font-medium text-sm transition-all hover:bg-slate-800/40">
              Talk to us
            </Link>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-3xl mx-auto"
          >
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold gradient-text mb-1">{s.value}</div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-3">Features</div>
            <h2 className="text-4xl font-bold mb-4">Everything you need to resolve faster</h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
              From intake to resolution, every step is powered by AI — so your team spends time solving, not sorting.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fade} initial="hidden" whileInView="show"
                viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="card-hover bg-slate-900/50 border border-slate-800/60 rounded-2xl p-6"
              >
                <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                  <f.icon size={20} className={f.color} />
                </div>
                <h3 className="font-semibold text-slate-100 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-24 px-6 bg-slate-900/20 border-y border-slate-800/40">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-3">Roles</div>
            <h2 className="text-4xl font-bold mb-4">Built for every stakeholder</h2>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">Three distinct portals, one unified platform.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {roles.map((r, i) => (
              <motion.div
                key={r.role}
                variants={fade} initial="hidden" whileInView="show"
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`rounded-2xl border p-6 ${r.color}`}
              >
                <div className={`text-sm font-semibold ${r.accent} mb-4 flex items-center gap-2`}>
                  <span className={`w-2 h-2 rounded-full ${r.dot}`} />
                  {r.role}
                </div>
                <ul className="space-y-3">
                  {r.points.map(p => (
                    <li key={p} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <CheckCircle size={14} className={`${r.accent} mt-0.5 shrink-0`} />
                      {p}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-3">Workflow</div>
            <h2 className="text-4xl font-bold">How it works</h2>
          </motion.div>

          <div className="space-y-4">
            {[
              { step: '01', title: 'Complaint comes in', desc: 'Via WhatsApp, email, phone, or web — all routed to one place.' },
              { step: '02', title: 'AI analyzes instantly', desc: 'Groq LLM classifies sentiment, priority, category, and generates a summary.' },
              { step: '03', title: 'Duplicate check', desc: 'Semantic similarity detects if this complaint already exists.' },
              { step: '04', title: 'Agent gets assigned', desc: 'The right agent receives the ticket with full AI context and history.' },
              { step: '05', title: 'Escalation if needed', desc: 'If unresolved, it escalates to the next channel agent — with full history intact.' },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                variants={fade} initial="hidden" whileInView="show"
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="flex items-start gap-5 bg-slate-900/40 border border-slate-800/50 rounded-2xl p-5"
              >
                <span className="text-2xl font-bold text-slate-700 shrink-0 w-10">{s.step}</span>
                <div>
                  <div className="font-medium text-slate-100 mb-1">{s.title}</div>
                  <div className="text-sm text-slate-500">{s.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <motion.div
          variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center bg-gradient-to-br from-violet-600/10 to-blue-600/5 border border-violet-500/20 rounded-3xl p-14"
        >
          <div className="flex items-center justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />)}
          </div>
          <h2 className="text-4xl font-bold mb-4">Ready to resolve smarter?</h2>
          <p className="text-slate-400 text-sm mb-8 max-w-md mx-auto">
            Join teams using SmartResolve AI to cut resolution time and keep customers happy.
          </p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-8 py-3.5 rounded-xl font-medium text-sm transition-all hover:shadow-lg hover:shadow-violet-500/25">
            Get started free <ChevronRight size={16} />
          </Link>
        </motion.div>
      </section>

      <Footer />
    </div>
  )
}
