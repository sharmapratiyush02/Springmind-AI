import { useEffect, useState } from 'react'
import { analyticsService } from '../services/analyticsService'

export default function AnalyticsPage() {
  const [data,    setData]    = useState(null)
  const [agents,  setAgents]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([analyticsService.overview(), analyticsService.agents()])
      .then(([o, a]) => { setData(o.data); setAgents(a.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)' }}>
      <div className="spinner" /> Loading analytics…
    </div>
  )

  const catColors  = ['var(--accent)','var(--accent2)','var(--green)','var(--amber)','var(--pink)']
  const priColors  = { CRITICAL:'var(--red)', HIGH:'var(--amber)', MEDIUM:'var(--accent)', LOW:'var(--green)' }
  const weekData   = [120,135,118,142,158,171,164,184]
  const weekMax    = Math.max(...weekData)

  return (
    <div style={{ padding: 24 }} className="page-fade">
      <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Analytics & Reports</div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label:'Total This Month', val: data?.totalTickets ?? '—',     icon:'📬', color:'var(--accent)' },
          { label:'SLA Compliance',   val: `${data?.slaComplianceRate ?? 0}%`, icon:'🎯', color:'var(--green)' },
          { label:'CSAT Score',       val: data?.csatScore ?? '—',        icon:'😊', color:'var(--amber)' },
          { label:'AI Auto-Resolved', val: `${data?.aiAutoResolvedPercent ?? 0}%`, icon:'🤖', color:'var(--red)' },
        ].map(({ label, val, icon, color }) => (
          <div key={label} className="panel" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 22, opacity: 0.5 }}>{icon}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 34, fontWeight: 800, color, letterSpacing: -1 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Category + Priority */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="panel">
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Category Breakdown</div>
          {(data?.categoryDistribution || []).map((c, i) => (
            <div key={c.category} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span>{c.category.replace('_',' ')}</span>
                <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{c.count} — {c.percentage}%</span>
              </div>
              <div style={{ height: 6, background: 'var(--surface3)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${c.percentage}%`, background: catColors[i % catColors.length], borderRadius: 3, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          ))}
        </div>

        <div className="panel">
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Priority Distribution</div>
          {(data?.priorityDistribution || []).map(p => (
            <div key={p.priority} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span>{p.priority}</span>
                <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{p.count} — {p.percentage}%</span>
              </div>
              <div style={{ height: 6, background: 'var(--surface3)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${p.percentage}%`, background: priColors[p.priority] || 'var(--muted)', borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly trend */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Weekly Volume Trend</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140 }}>
          {weekData.map((v, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{v}</span>
              <div style={{
                width: '100%', borderRadius: '4px 4px 0 0',
                height: `${Math.round((v / weekMax) * 110)}px`,
                background: `linear-gradient(180deg, var(--accent2), var(--accent))`,
                opacity: 0.5 + i * 0.07
              }} />
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>W{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Agent Performance */}
      <div className="panel">
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Agent Performance</div>
        {agents.length === 0
          ? <div style={{ color: 'var(--muted)', fontSize: 13 }}>No agent data available yet.</div>
          : agents.map((a, i) => {
            const pct   = a.totalTickets > 0 ? Math.round((a.resolvedTickets / a.totalTickets) * 100) : 0
            const color = a.score >= 90 ? 'var(--green)' : a.score >= 75 ? 'var(--amber)' : 'var(--red)'
            const init  = a.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
            return (
              <div key={a.email} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: i < agents.length-1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent2), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{init}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{a.totalTickets} tickets · {a.resolvedTickets} resolved</div>
                  <div style={{ height: 4, background: 'var(--surface3)', borderRadius: 2, overflow: 'hidden', marginTop: 6, maxWidth: 180 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--green)', borderRadius: 2 }} />
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, color }}>
                  {pct}<span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 400 }}>/100</span>
                </div>
              </div>
            )
          })
        }
      </div>
    </div>
  )
}
