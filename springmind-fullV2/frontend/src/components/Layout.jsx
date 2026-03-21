import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Layout.module.css'

const NAV = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/tickets',   icon: '🎫', label: 'All Tickets' },
  { to: '/ai',        icon: '🤖', label: 'AI Tools' },
  { to: '/analytics', icon: '📈', label: 'Analytics' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'SM'

  const role = user?.roles?.[0] || 'AGENT'

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
    </div>
  )
}
