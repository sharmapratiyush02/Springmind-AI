import { useEffect, useState, useCallback } from 'react'
import { ticketService } from '../services/ticketService'

const STATUS_META = {
  OPEN:        { label: '● Open',        cls: 'status-open' },
  IN_PROGRESS: { label: '◐ In Progress', cls: 'status-in_progress' },
  RESOLVED:    { label: '✓ Resolved',    cls: 'status-resolved' },
  CLOSED:      { label: '— Closed',      cls: 'status-closed' },
}
const PRI_DOT = { CRITICAL:'p-critical', HIGH:'p-high', MEDIUM:'p-medium', LOW:'p-low' }

const TABS = [
  { key:'',          label:'All' },
  { key:'OPEN',      label:'Open' },
  { key:'IN_PROGRESS',label:'In Progress' },
  { key:'RESOLVED',  label:'Resolved' },
]

export default function TicketsPage() {
  const [tickets, setTickets]   = useState([])
  const [total,   setTotal]     = useState(0)
  const [loading, setLoading]   = useState(true)
  const [tab,     setTab]       = useState('')
  const [search,  setSearch]    = useState('')
  const [selected,setSelected]  = useState(null)
  const [detail,  setDetail]    = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [comment,   setComment]     = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  const [form, setForm] = useState({
    title:'', description:'', customerName:'', customerEmail:'',
    customerTier:'FREE', category:'', priority:'', channel:'WEB_FORM'
  })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const load = useCallback((statusFilter=tab, q=search) => {
    setLoading(true)
    ticketService.list({ status: statusFilter || undefined, search: q || undefined, size: 30 })
      .then(r => { setTickets(r.data.content || []); setTotal(r.data.totalElements || 0) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [tab, search])

  useEffect(() => { load(tab, search) }, [tab])

  const openDetail = (id) => {
    setSelected(id); setDetail(null); setDetailLoading(true)
    ticketService.get(id)
      .then(r => setDetail(r.data))
      .catch(console.error)
      .finally(() => setDetailLoading(false))
  }

  const updateStatus = (newStatus) => {
    if (!detail) return
    ticketService.update(detail.id, { status: newStatus })
      .then(r => { setDetail(d => ({ ...d, status: r.data.status })); load() })
      .catch(console.error)
  }

  const submitComment = () => {
    if (!comment.trim() || !detail) return
    setSubmittingComment(true)
    ticketService.addComment(detail.id, { body: comment, internalNote: false })
      .then(() => {
        setComment('')
        ticketService.get(detail.id).then(r => setDetail(r.data))
      })
      .catch(console.error)
      .finally(() => setSubmittingComment(false))
  }

  const submitCreate = () => {
    if (!form.title || !form.description || !form.customerName || !form.customerEmail) {
      setCreateError('Please fill in all required fields.'); return
    }
    setCreating(true); setCreateError('')
    ticketService.create(form)
      .then(() => { setShowCreate(false); setForm({ title:'', description:'', customerName:'', customerEmail:'', customerTier:'FREE', category:'', priority:'', channel:'WEB_FORM' }); load() })
      .catch(err => setCreateError(err.response?.data?.message || 'Error creating ticket'))
      .finally(() => setCreating(false))
  }

  const sentColor = { NEGATIVE:'var(--red)', POSITIVE:'var(--green)', NEUTRAL:'var(--muted)' }

  return (
    <div style={{ padding: 24 }} className="page-fade">
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, flex: 1 }}>
          All Tickets <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)', fontWeight: 400 }}>({total})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px' }}>
          <span style={{ color: 'var(--muted)' }}>🔍</span>
          <input style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', width: 200, fontSize: 13 }}
            placeholder="Search tickets…" value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load(tab, search)} />
        </div>
        <button className="btn primary" onClick={() => setShowCreate(true)}>+ New Ticket</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, color: tab === t.key ? 'var(--accent)' : 'var(--muted)',
            borderBottom: `2px solid ${tab === t.key ? 'var(--accent)' : 'transparent'}`,
            fontWeight: tab === t.key ? 500 : 400, transition: 'all 0.15s'
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: 16 }}>
        {/* Table */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 130px 100px 120px 100px', padding: '10px 20px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            <div>ID</div><div>Issue</div><div>Category</div><div>Priority</div><div>Status</div><div>Agent</div>
          </div>
          {loading
            ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}><div className="spinner" />Loading…</div>
            : tickets.length === 0
              ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>No tickets found</div>
              : tickets.map((t, i) => (
                <div key={t.id} onClick={() => openDetail(t.id)} style={{
                  display: 'grid', gridTemplateColumns: '90px 1fr 130px 100px 120px 100px',
                  padding: '13px 20px', borderBottom: i < tickets.length-1 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer', alignItems: 'center', transition: 'background 0.1s',
                  background: selected === t.id ? 'var(--surface2)' : 'transparent'
                }}
                onMouseEnter={e => { if(selected!==t.id) e.currentTarget.style.background='var(--surface2)' }}
                onMouseLeave={e => { if(selected!==t.id) e.currentTarget.style.background='transparent' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>{t.ticketNumber}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>{t.description}</div>
                  </div>
                  <div><span className={`pill pill-${t.category?.toLowerCase()}`}>{t.category?.replace('_',' ') || '—'}</span></div>
                  <div style={{ fontSize: 12 }}><span className={`priority-dot ${PRI_DOT[t.priority]}`} />{t.priority}</div>
                  <div><span className={`status-pill ${STATUS_META[t.status]?.cls}`}>{STATUS_META[t.status]?.label || t.status}</span></div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{t.assignedAgent?.name || '—'}</div>
                </div>
              ))
          }
        </div>

        {/* Detail Panel */}
        {selected && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 140px)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>{detail?.ticketNumber || '…'}</div>
              <button onClick={() => setSelected(null)} style={{ background: 'var(--surface2)', border: 'none', color: 'var(--muted)', cursor: 'pointer', width: 26, height: 26, borderRadius: 6, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            {detailLoading
              ? <div style={{ padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--muted)' }}><div className="spinner" />Loading…</div>
              : detail && (
                <div style={{ overflow: 'auto', flex: 1, padding: 20 }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{detail.title}</div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                    <span className={`pill pill-${detail.category?.toLowerCase()}`}>{detail.category?.replace('_',' ')}</span>
                    <span className={`status-pill ${STATUS_META[detail.status]?.cls}`}>{STATUS_META[detail.status]?.label}</span>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}><span className={`priority-dot ${PRI_DOT[detail.priority]}`} />{detail.priority}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, marginBottom: 14 }}>
                    {[['Customer', detail.customerName], ['Email', detail.customerEmail], ['Tier', detail.customerTier], ['Agent', detail.assignedAgent?.name || 'Unassigned']].map(([k,v]) => (
                      <div key={k}><span style={{ color: 'var(--muted)' }}>{k}: </span>{v}</div>
                    ))}
                  </div>

                  <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: 12, fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 16 }}>{detail.description}</div>

                  {/* AI Insights */}
                  <div style={{ background: 'rgba(124,92,252,0.06)', border: '1px solid rgba(124,92,252,0.2)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--accent2)', marginBottom: 10 }}>🤖 AI Insights</div>
                    {[
                      ['Sentiment', <span style={{ color: sentColor[detail.sentiment] || 'var(--muted)' }}>{detail.sentiment || '—'}</span>],
                      ['Confidence', `${Math.round((detail.aiConfidence||0)*100)}%`],
                      ['Est. Resolution', `${detail.predictedResolutionHours || '?'}h`],
                      ['SLA Deadline', detail.slaDeadline ? new Date(detail.slaDeadline).toLocaleString() : '—'],
                    ].map(([k,v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                        <span style={{ color: 'var(--muted)' }}>{k}</span>
                        <span style={{ fontWeight: 500 }}>{v}</span>
                      </div>
                    ))}
                    {detail.aiSummary && <div style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>{detail.aiSummary}</div>}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                    {detail.status !== 'RESOLVED' && <button className="btn" style={{ fontSize: 12 }} onClick={() => updateStatus('RESOLVED')}>✓ Resolve</button>}
                    {detail.status === 'OPEN' && <button className="btn" style={{ fontSize: 12 }} onClick={() => updateStatus('IN_PROGRESS')}>▶ Start</button>}
                    {detail.status !== 'CLOSED' && <button className="btn" style={{ fontSize: 12 }} onClick={() => updateStatus('CLOSED')}>— Close</button>}
                  </div>

                  {/* Comments */}
                  {detail.comments?.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Comments ({detail.comments.length})</div>
                      {detail.comments.map(c => (
                        <div key={c.id} style={{ background: 'var(--surface2)', borderRadius: 8, padding: 10, marginBottom: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 500 }}>{c.author}</span>
                            <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{new Date(c.createdAt).toLocaleString()}</span>
                          </div>
                          <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--muted)' }}>{c.body}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply */}
                  <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Reply</div>
                  <textarea className="form-textarea" value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Type your response…" rows={3} style={{ marginBottom: 8 }} />
                  <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }}
                    disabled={!comment.trim() || submittingComment}
                    onClick={submitComment}>
                    {submittingComment ? 'Sending…' : 'Send Reply'}
                  </button>
                </div>
              )
            }
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 20, padding: 28, width: 520, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setShowCreate(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'var(--surface2)', border: 'none', color: 'var(--muted)', cursor: 'pointer', width: 28, height: 28, borderRadius: 6, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>🤖 Create New Ticket</div>

            {[
              ['Title *', 'title', 'text', 'Brief issue summary'],
              ['Customer Name *', 'customerName', 'text', 'John Smith'],
              ['Customer Email *', 'customerEmail', 'email', 'john@company.com'],
            ].map(([label, key, type, ph]) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label className="form-label">{label}</label>
                <input className="form-input" type={type} placeholder={ph}
                  value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}

            <div style={{ marginBottom: 14 }}>
              <label className="form-label">Description *</label>
              <textarea className="form-textarea" rows={3} placeholder="Detailed description…"
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label className="form-label">Customer Tier</label>
                <select className="form-select" value={form.customerTier} onChange={e => setForm(f => ({ ...f, customerTier: e.target.value }))}>
                  {['FREE','BASIC','PREMIUM','ENTERPRISE'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Priority (AI will auto-detect)</label>
                <select className="form-select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="">Auto (AI)</option>
                  {['LOW','MEDIUM','HIGH','CRITICAL'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
            </div>

            {createError && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12, background: 'rgba(242,92,92,0.1)', padding: '8px 12px', borderRadius: 8 }}>{createError}</div>}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn primary" disabled={creating} onClick={submitCreate}>
                {creating ? 'Submitting…' : '🤖 AI Classify & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
