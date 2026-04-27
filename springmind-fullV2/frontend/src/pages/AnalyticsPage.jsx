import { useEffect, useState } from 'react'
import { analyticsService } from '../services/analyticsService'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  PieChart, Pie, Cell, LineChart, Line, RadialBarChart, RadialBar
} from 'recharts'

/* ── Recharts custom tooltip (Enhancement 3 — Krishna Renuse) ── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border2)',
      borderRadius: 10, padding: '10px 14px', fontSize: 12,
      fontFamily: 'var(--font-mono)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
    }}>
      {label && <div style={{ color: 'var(--muted)', marginBottom: 6 }}>{label}</div>}
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color || 'var(--text)', marginBottom: 2 }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  )
}

const CAT_COLORS = ['#4f8ef7','#7c5cfc','#2dd4a0','#f5a623','#f06292']
const PRI_COLORS = { CRITICAL: '#f25c5c', HIGH: '#f5a623', MEDIUM: '#4f8ef7', LOW: '#2dd4a0' }

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

  /* Format daily volume for LineChart — real data only */
  const chartLine = (data?.dailyVolume || []).map(d => ({
    date: d.date?.slice(5) || d.date,
    tickets: d.count || 0
  }))

  /* Category donut */
  const catData = (data?.categoryDistribution || []).map(c => ({
    name: c.category.replace('_', ' '), value: c.count
  }))

  /* Priority bar */
  const priData = (data?.priorityDistribution || []).map(p => ({
    name: p.priority, count: p.count, fill: PRI_COLORS[p.priority] || '#999'
  }))

  /* Agent bar chart */
  const agentData = agents.map(a => ({
    name: a.name.split(' ')[0],
    Total: a.totalTickets,
    Resolved: a.resolvedTickets,
    Score: a.score
  }))

  /* SLA radial */
  const slaRate = data?.slaComplianceRate ?? 100
  const radialData = [{ name: 'SLA', value: slaRate, fill: slaRate >= 85 ? '#2dd4a0' : slaRate >= 70 ? '#f5a623' : '#f25c5c' }]

  return (
    <div style={{ padding: 24 }} className="page-fade">
      <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Analytics & Reports</div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 24 }}>Live data · Auto-refresh every visit</div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label:'Total Tickets',    val: data?.totalTickets ?? '—',      icon:'📬', color:'var(--accent)' },
          { label:'SLA Compliance',   val: `${data?.slaComplianceRate ?? 0}%`, icon:'🎯', color: slaRate >= 85 ? 'var(--green)' : 'var(--amber)' },
          { label:'CSAT Score',       val: `${data?.csatScore ?? '—'}/5`,  icon:'😊', color:'var(--amber)' },
          { label:'AI Auto-Resolved', val: `${data?.aiAutoResolvedPercent ?? 0}%`, icon:'🤖', color:'var(--accent2)' },
        ].map(({ label, val, icon, color }) => (
          <div key={label} className="panel" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 22, opacity: 0.5 }}>{icon}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 34, fontWeight: 800, color, letterSpacing: -1 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Row 1: Line chart + SLA Radial */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16, marginBottom: 16 }}>
        {/* Line Chart — Weekly Volume */}
        <div className="panel">
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Weekly Ticket Volume</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 18 }}>Daily incoming tickets — live from database</div>
          {chartLine.length === 0 ? (
            <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', gap: 8 }}>
              <div style={{ fontSize: 32 }}>📭</div>
              <div style={{ fontSize: 13 }}>No ticket data yet</div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>Submit a ticket to see the chart populate</div>
            </div>
          ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartLine}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#7a869a', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#7a869a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="tickets" name="Tickets" stroke="#4f8ef7" strokeWidth={2.5}
                dot={{ fill: '#4f8ef7', r: 4 }} activeDot={{ r: 6, fill: '#7c5cfc' }} />
            </LineChart>
          </ResponsiveContainer>
          )}
        </div>

        {/* SLA Radial Gauge */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, marginBottom: 4, alignSelf: 'flex-start' }}>SLA Compliance</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12, alignSelf: 'flex-start' }}>Overall rate</div>
          <div style={{ position: 'relative', width: 160, height: 160 }}>
            <RadialBarChart
              cx="50%" cy="50%" innerRadius="65%" outerRadius="90%"
              data={radialData} startAngle={230} endAngle={-50}
              width={160} height={160} barSize={14}
            >
              <RadialBar dataKey="value" cornerRadius={8} background={{ fill: 'var(--surface3)' }} />
            </RadialBarChart>
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800, color: radialData[0].fill, letterSpacing: -1 }}>
                {slaRate}%
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>SLA rate</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: slaRate >= 85 ? 'var(--green)' : 'var(--amber)', marginTop: 6, fontWeight: 600 }}>
            {slaRate >= 85 ? '✓ Excellent' : slaRate >= 70 ? '⚠ Needs Attention' : '🚨 Critical'}
          </div>
        </div>
      </div>

      {/* Row 2: Donut pie + Priority bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Category Donut */}
        <div className="panel">
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Category Breakdown</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>Distribution by ticket type</div>
          {catData.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>No data yet</div>
          ) : (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={catData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
                    {catData.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {catData.map((c, i) => (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: CAT_COLORS[i % CAT_COLORS.length], flexShrink: 0 }} />
                    <div style={{ fontSize: 12, flex: 1 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{c.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Priority Distribution */}
        <div className="panel">
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Priority Distribution</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>Tickets by priority level</div>
          {priData.length === 0 ? (
            <div style={{ height: 170, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', gap: 8 }}>
              <div style={{ fontSize: 28 }}>📊</div>
              <div style={{ fontSize: 13 }}>No priority data yet</div>
            </div>
          ) : (
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={priData} barSize={32} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#7a869a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#e8ecf4', fontSize: 12 }} axisLine={false} tickLine={false} width={72} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" name="Tickets" radius={[0, 4, 4, 0]}>
                {priData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 3: Agent Performance bar chart */}
      {agentData.length > 0 && (
        <div className="panel" style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Agent Performance</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 18 }}>Total assigned vs resolved tickets per agent</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={agentData} barSize={20} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#e8ecf4', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#7a869a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#7a869a', paddingTop: 12 }} />
              <Bar dataKey="Total" name="Total Tickets" fill="rgba(79,142,247,0.4)" radius={[4,4,0,0]} />
              <Bar dataKey="Resolved" name="Resolved" fill="#2dd4a0" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Agent score table */}
      <div className="panel">
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Agent Leaderboard</div>
        {agents.length === 0
          ? <div style={{ color: 'var(--muted)', fontSize: 13 }}>No agent data available yet.</div>
          : agents.map((a, i) => {
            const pct   = a.totalTickets > 0 ? Math.round((a.resolvedTickets / a.totalTickets) * 100) : 0
            const color = a.score >= 90 ? 'var(--green)' : a.score >= 75 ? 'var(--amber)' : 'var(--red)'
            const init  = a.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`
            return (
              <div key={a.email} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: i < agents.length-1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 24, fontSize: 16, textAlign: 'center', flexShrink: 0 }}>{medal}</div>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent2), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{init}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{a.totalTickets} tickets · {a.resolvedTickets} resolved</div>
                  <div style={{ height: 4, background: 'var(--surface3)', borderRadius: 2, overflow: 'hidden', marginTop: 6, maxWidth: 200 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.8s ease' }} />
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, color }}>{pct}<span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 400 }}>/100</span></div>
              </div>
            )
          })
        }
      </div>
    </div>
  )
}
