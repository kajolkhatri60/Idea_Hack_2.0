import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import { useTheme } from '../context/ThemeContext'
import NotificationPanel from './NotificationPanel'
import {
  LayoutDashboard, PlusCircle, BarChart2, LogOut, ShieldAlert,
  ListChecks, Settings, Inbox, ChevronLeft, ChevronRight,
  User, Bell, MessageSquare, Sun, Moon
} from 'lucide-react'

const navByRole = {
  user: [
    { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/app/submit', label: 'New Complaint', icon: PlusCircle },
    { to: '/app/my-complaints', label: 'My Complaints', icon: ListChecks },
  ],
  agent: [
    { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/app/queue', label: 'My Queue', icon: Inbox },
    { to: '/app/insights', label: 'Insights', icon: BarChart2 },
    { to: '/app/messages', label: 'Messages', icon: MessageSquare, badge: true },
  ],
  admin: [
    { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/app/queue', label: 'All Tickets', icon: Inbox },
    { to: '/app/insights', label: 'Insights', icon: BarChart2 },
    { to: '/app/messages', label: 'Messages', icon: MessageSquare, badge: true },
    { to: '/app/admin', label: 'Admin Panel', icon: Settings },
  ],
}

const roleColors = {
  user:  'text-blue-400 bg-blue-400/10 border-blue-400/20',
  agent: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
  admin: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
}

// Map agent channel type to a readable label
const agentChannelLabel = {
  whatsapp: 'WhatsApp Agent',
  email:    'Email Agent',
  phone:    'Phone Agent',
  chat:     'Chat Agent',
  web:      'Web Agent',
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { unreadForRole } = useNotifications()
  const { theme, toggle } = useTheme()
  const unreadCount = unreadForRole(user?.role)
  const [collapsed, setCollapsed] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [msgUnread, setMsgUnread] = useState(0)

  // Poll internal message unread count every 10s
  useEffect(() => {
    if (!user || user.role === 'user') return
    const fetchUnread = async () => {
      try {
        const { data } = await import('../api/axios').then(m => m.default.get('/internal/unread'))
        setMsgUnread(data.unread || 0)
      } catch { /* silent */ }
    }
    fetchUnread()
    const t = setInterval(fetchUnread, 10000)
    return () => clearInterval(t)
  }, [user])

  const items = navByRole[user?.role] || navByRole.user
  const handleLogout = () => { logout(); navigate('/') }

  const displayRole = user?.role === 'agent' && user?.agent_channel
    ? (agentChannelLabel[user.agent_channel] || `${user.agent_channel} Agent`)
    : user?.role

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      {/* Sidebar */}
      <aside className={`relative flex flex-col border-r transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`} style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        {/* Logo */}
        <div className="h-14 flex items-center px-4 gap-3 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0">
            <ShieldAlert size={14} className="text-violet-400" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-sm tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
              SmartResolve <span className="text-violet-400">AI</span>
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {items.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink key={to} to={to} end={end}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive ? 'nav-active font-medium' : 'hover:bg-slate-800/30'
                } ${collapsed ? 'justify-center' : ''}`
              }
              style={({ isActive }) => isActive ? {} : { color: 'var(--text-muted)' }}
            >
              <div className="relative shrink-0">
                <Icon size={17} />
                {badge && msgUnread > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-violet-500 rounded-full" />
                )}
              </div>
              {!collapsed && (
                <span className="truncate flex-1">{label}</span>
              )}
              {!collapsed && badge && msgUnread > 0 && (
                <span className="text-[10px] bg-violet-600 text-white px-1.5 py-0.5 rounded-full shrink-0">{msgUnread}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom user section */}
        <div className="p-3 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
          {/* Profile link */}
          <NavLink to="/app/profile"
            title={collapsed ? 'Profile' : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all w-full ${
                isActive ? 'nav-active font-medium' : 'hover:bg-slate-800/30'
              } ${collapsed ? 'justify-center' : ''}`
            }
            style={({ isActive }) => isActive ? {} : { color: 'var(--text-muted)' }}
          >
            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
              <User size={12} className="text-slate-400" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-xs font-medium truncate leading-tight" style={{ color: 'var(--text-primary)' }}>{user?.name}</div>
                <div className={`badge border text-[9px] mt-0.5 ${roleColors[user?.role]}`}>
                  {displayRole}
                </div>
              </div>
            )}
          </NavLink>

          <button onClick={handleLogout} title="Logout"
            className={`flex items-center gap-2 text-xs hover:text-red-400 transition-colors w-full px-3 py-1.5 rounded-xl hover:bg-slate-800/30 ${collapsed ? 'justify-center' : ''}`}
            style={{ color: 'var(--text-muted)' }}
          >
            <LogOut size={14} />
            {!collapsed && 'Logout'}
          </button>
        </div>

        {/* Collapse toggle */}
        <button onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-16 w-6 h-6 border rounded-full flex items-center justify-center transition-colors z-10"
          style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 shrink-0 flex items-center justify-end px-6" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-base)' }}>
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-slate-800/30"
              style={{ color: 'var(--text-secondary)' }}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <div className="relative">
              <button
                onClick={() => setNotifOpen(v => !v)}
                className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-slate-800/30"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full" />
                )}
              </button>
              <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
