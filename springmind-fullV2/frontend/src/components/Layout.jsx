import { useState, useCallback } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import NotificationPanel, { useNotifCount } from './NotificationPanel'
import styles from './Layout.module.css'

const NAV = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/tickets',   icon: '🎫', label: 'All Tickets' },
  { to: '/ai',        icon: '🤖', label: 'AI Tools' },
  { to: '/analytics', icon: '📈', label: 'Analytics' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const [notifOpen, setNotifOpen] = useState(false)
  const { unread, reset } = useNotifCount()

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'SM'

  const role = user?.roles?.[0] || 'AGENT'

  const handleBell = useCallback(() => {
    setNotifOpen(o => !o)
    if (!notifOpen) reset()
  }, [notifOpen, reset])

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>🧠</div>
          <div>
            <div className={styles.logoText}>SpringMind</div>
            <div className={styles.logoSub}>AI Support</div>
          </div>
        </div>

        <div className={styles.navSection}>Overview</div>
        <nav className={styles.nav}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <span>{icon}</span>{label}
            </NavLink>
          ))}
        </nav>

        {/* ── Utility strip (Enhancement 2 bell + Enhancement 5 theme) ── */}
        <div style={{ display: 'flex', gap: 6, padding: '0 12px 10px', marginTop: 'auto' }}>
          {/* Notification Bell */}
          <button
            onClick={handleBell}
            title="Activity Center"
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: notifOpen ? 'rgba(79,142,247,0.12)' : 'var(--surface2)',
              border: `1px solid ${notifOpen ? 'rgba(79,142,247,0.3)' : 'var(--border)'}`,
              borderRadius: 8, padding: '7px 0', cursor: 'pointer',
              color: notifOpen ? 'var(--accent)' : 'var(--muted)',
              fontSize: 13, transition: 'all 0.15s', position: 'relative'
            }}>
            🔔
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: 3, right: 8,
                background: 'var(--red)', borderRadius: '50%',
                width: 16, height: 16, fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontFamily: 'var(--font-mono)',
                animation: 'pulse 1.5s infinite'
              }}>{unread > 9 ? '9+' : unread}</span>
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggle}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '7px 0', cursor: 'pointer',
              color: 'var(--muted)', fontSize: 14, transition: 'all 0.15s'
            }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>

        <div className={styles.bottom}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{user?.name || 'User'}</div>
            <div className={styles.userRole}>{role.replace('ROLE_', '')}</div>
          </div>
          <button className={styles.logoutBtn} onClick={() => { logout(); navigate('/login') }}
            title="Sign out">⏻</button>
        </div>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>

      {/* Notification Panel (Enhancement 2 — Neeraj Gupta) */}
      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  )
}
