import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ticketService } from '../services/ticketService'
import { analyticsService } from '../services/analyticsService'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'

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

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
      <div style={{ color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ color: 'var(--accent)' }}>Tickets: <strong>{payload[0]?.value}</strong></div>
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats]     = useState(null)
  const [tickets, setTickets] = useState([])
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Auto-assign unassigned tickets to current agent on dashboard load
    ticketService.autoAssign().catch(() => {}).finally(() => {
      Promise.allSettled([
        ticketService.stats(),
        ticketService.list({ size: 6 }),
        analyticsService.overview()
      ])
        .then(([sRes, tRes, aRes]) => {
          if (sRes.status === 'fulfilled') setStats(sRes.value.data)
          if (tRes.status === 'fulfilled') setTickets(tRes.value.data.content || [])
          if (aRes.status === 'fulfilled') {
            const daily = aRes.value.data?.dailyVolume || []
            setChartData(daily.length > 0 ? daily.map(d => ({ date: d.date?.slice(5) || d.date, count: d.count })) : [
              { date: 'Mon', count: 28 }, { date: 'Tue', count: 35 },
              { date: 'Wed', count: 42 }, { date: 'Thu', count: 31 },
              { date: 'Fri', count: 46 }, { date: 'Sat', count: 18 }, { date: 'Sun', count: 24 }
            ])
          }
        })
        .finally(() => setLoading(false))
    })
  }, [])

  if (loading) return (
    <div style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)' }}>
      <div className="spinner" /> Loading dashboard…
    </div>
  )

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

      {/* Live Recharts Bar Chart — Enhancement 3 (Krishna Renuse) */}
      <div className="panel" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div className="section-title">Ticket Volume — Last 7 Days</div>
            <div className="section-sub">Daily incoming tickets across all categories</div>
          </div>
          <div className="ai-badge"><div className="ai-pulse" />AI Active</div>
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={chartData} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#7a869a', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#7a869a', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(79,142,247,0.08)' }} />
            <Bar dataKey="count" name="Tickets" radius={[4,4,0,0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={i === chartData.length - 1 ? 'var(--accent)' : 'var(--accent2)'}
                  fillOpacity={i === chartData.length - 1 ? 1 : 0.6} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
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
