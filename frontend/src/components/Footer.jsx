import { Link } from 'react-router-dom'
import { ShieldAlert, GitFork, Globe, Rss } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/60 bg-[#080b14]">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                <ShieldAlert size={16} className="text-violet-400" />
              </div>
              <span className="font-semibold text-sm text-slate-100">SmartResolve <span className="text-violet-400">AI</span></span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              AI-powered complaint management that centralizes, classifies, and resolves customer issues faster.
            </p>
            <div className="flex items-center gap-3 mt-5">
              {[GitFork, Globe, Rss].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-colors">
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Product</div>
            <ul className="space-y-2.5">
              {['Features', 'Pricing', 'Changelog', 'Roadmap'].map(l => (
                <li key={l}><a href="#" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Company</div>
            <ul className="space-y-2.5">
              {[['About', '#'], ['Contact', '/contact'], ['Privacy', '#'], ['Terms', '#']].map(([l, href]) => (
                <li key={l}>
                  <Link to={href} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">{l}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800/60 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-600">© 2025 SmartResolve AI. All rights reserved.</p>
          <p className="text-xs text-slate-600">Built for IdeaHack 2.0</p>
        </div>
      </div>
    </footer>
  )
}
