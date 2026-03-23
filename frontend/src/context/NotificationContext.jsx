import { createContext, useContext, useState, useCallback } from 'react'

/**
 * Notification types and who can see them:
 *   escalation  → user (their complaint was escalated) + admin
 *   assignment  → agent (a complaint was assigned to them) + admin
 *   resolved    → user (their complaint was resolved) + admin
 *   system      → admin only
 */

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])

  /**
   * addNotification({ type, message, detail, forRoles: ['user','admin'] })
   * forRoles defaults to ['admin'] if not provided.
   */
  const addNotification = useCallback((notif) => {
    const id = Date.now() + Math.random()
    setNotifications(prev => [{
      id,
      read: false,
      at: new Date().toISOString(),
      forRoles: ['admin'],
      ...notif,
    }, ...prev])
  }, [])

  const markRead    = useCallback((id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)), [])
  const markAllRead = useCallback(() => setNotifications(prev => prev.map(n => ({ ...n, read: true }))), [])
  const clearAll    = useCallback(() => setNotifications([]), [])

  /** Filter notifications visible to a given role */
  const forRole = useCallback((role) =>
    notifications.filter(n => n.forRoles?.includes(role) || n.forRoles?.includes('*')),
  [notifications])

  const unreadForRole = useCallback((role) =>
    forRole(role).filter(n => !n.read).length,
  [forRole])

  return (
    <NotificationContext.Provider value={{
      notifications, addNotification, markRead, markAllRead, clearAll, forRole, unreadForRole
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationContext)
