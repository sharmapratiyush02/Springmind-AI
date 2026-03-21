import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ticketService } from '../services/ticketService'

const STAT_CONFIG = [
  { key: 'openTickets',        label: 'Open Tickets',      icon: '🎫', color: 'var(--accent)' },
  { key: 'resolvedToday',      label: 'Resolved Today',    icon: '✅', color: 'var(--green)' },
  { key: 'avgResolutionHours', label: 'Avg Resolution',    icon: '⏱',  color: 'var(--amber)', suffix: 'h' },
  { key: 'slaBreaches',        label: 'SLA Breaches',      icon: '🚨', color: 'var(--red)' },
]

const CAT_COLORS = {
  BILLING: 'var(--accent)', TECHNICAL: 'var(--accent2)', ACCOUNT: 'var(--green)',
  REFUND: 'var(--amber)', FEATURE_REQUEST: 'var(--pink)', GENERAL: 'var(--muted)'
}
const STATUS_META = {
  OPEN:        { label: '● Open',        cls: 'status-open' },
  IN_PROGRESS: { label: '◐ In Progress', cls: 'status-in_progress' },
  RESOLVED:    { label: '✓ Resolved',    cls: 'status-resolved' },
  CLOSED:      { label: '— Closed',      cls: 'status-closed' },
}
const PRI_DOT = { CRITICAL:'p-critical', HIGH:'p-high', MEDIUM:'p-medium', LOW:'p-low' }

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats]     = useState(null)
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([ticketService.stats(), ticketService.list({ size: 6 })])
      .then(([sRes, tRes]) => {
        setStats(sRes.data)
        setTickets(tRes.data.content || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)' }}>
      <div className="spinner" /> Loading dashboard…
    </div>
  )

  const dayLabels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  const dayData   = [28,35,42,31,46,18,24]
  const maxDay    = Math.max(...dayData)

  return (
    <div style={{ padding: 24 }} className="page-fade">
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {STAT_CONFIG.map(({ key, label, icon, color, suffix }) => (
          <div key={key} className="panel" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 22, opacity: 0.5 }}>{icon}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 34, fontWeight: 800, color, letterSpacing: -1 }}>
              {stats?.[key] ?? '—'}{suffix || ''}
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="panel" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div className="section-title">Ticket Volume — Last 7 Days</div>
            <div className="section-sub">Daily incoming tickets across all categories</div>
          </div>
          <div className="ai-badge"><div className="ai-pulse" />AI Active</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 120 }}>
          {dayLabels.map((d, i) => (
            <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{dayData[i]}</span>
              <div style={{
                width: '100%', borderRadius: '4px 4px 0 0',
                height: `${Math.round((dayData[i] / maxDay) * 100)}px`,
                background: i === 4 ? 'var(--accent)' : 'var(--accent2)',
                opacity: i === 4 ? 1 : 0.55, transition: 'height 0.4s'
              }} />
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>{d}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent tickets */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="section-title">Recent Tickets</div>
        <button className="btn" onClick={() => navigate('/tickets')}>View all →</button>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '80px 1fr 130px 100px 110px',
          padding: '10px 20px', borderBottom: '1px solid var(--border)',
          fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.8px'
        }}>
          <div>ID</div><div>Issue</div><div>Category</div><div>Priority</div><div>Status</div>
        </div>
        {tickets.length === 0
          ? <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>No tickets yet</div>
          : tickets.map((t, i) => (
            <div key={t.id} onClick={() => navigate('/tickets')} style={{
              display: 'grid', gridTemplateColumns: '80px 1fr 130px 100px 110px',
              padding: '13px 20px', borderBottom: i < tickets.length - 1 ? '1px solid var(--border)' : 'none',
              cursor: 'pointer', transition: 'background 0.1s', alignItems: 'center'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>{t.ticketNumber}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{t.title}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>{t.description}</div>
              </div>
              <div>
                <span className={`pill pill-${t.category?.toLowerCase()}`}>
                  {t.category?.replace('_',' ') || '—'}
                </span>
              </div>
              <div>
                <span className={`priority-dot ${PRI_DOT[t.priority]}`} />
                {t.priority}
              </div>
              <div>
                <span className={`status-pill ${STATUS_META[t.status]?.cls || ''}`}>
                  {STATUS_META[t.status]?.label || t.status}
                </span>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}
