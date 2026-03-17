import { useState } from 'react'
import { aiService, confidenceInfo, sentimentColor, priorityColor, categoryEmoji, categoryLabel } from '../services/aiService'

const TABS = ['🤖 Classify', '⚡ Predict ETA', '💡 KB Search']

export default function AiToolsPage() {
  const [tab, setTab] = useState(0)

  return (
    <div style={{ padding: 24 }} className="page-fade">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700 }}>AI Tools</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>NLP classification · Resolution prediction · Knowledge base search</div>
        </div>
        <div className="ai-badge"><div className="ai-pulse" />Rule-based NLP Engine</div>
      </div>

      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: '8px 18px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, color: tab === i ? 'var(--accent)' : 'var(--muted)',
            borderBottom: `2px solid ${tab === i ? 'var(--accent)' : 'transparent'}`,
            fontWeight: tab === i ? 500 : 400, transition: 'all 0.15s'
          }}>{t}</button>
        ))}
      </div>

      {tab === 0 && <ClassifyTab />}
      {tab === 1 && <PredictTab />}
      {tab === 2 && <KBTab />}
    </div>
  )
}

/* ── Classify ────────────────────────────────────────────────────────────── */
function ClassifyTab() {
  const [text, setText]     = useState('I was charged twice for my subscription last month and still haven\'t received a refund. My account is premium and I\'ve been a loyal customer for 3 years. This is urgent and affecting my business operations!')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const run = async () => {
    if (!text.trim()) return
    setLoading(true); setError(''); setResult(null)
    try {
      const { data } = await aiService.classify(text)
      setResult(data)
    } catch (e) {
      setError(e.response?.data?.message || 'Classification failed')
    } finally {
      setLoading(false)
    }
  }

  const ci = result ? confidenceInfo(result.confidence) : null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
      <div className="panel">
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700, marginBottom: 6 }}>AI Ticket Classifier</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>
          Paste customer ticket text to get real-time NLP classification, sentiment analysis, and routing advice.
        </div>
        <label className="form-label">Ticket Text</label>
        <textarea className="form-textarea" rows={8} value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste customer support ticket text here…" style={{ marginBottom: 12 }} />
        <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }}
          disabled={loading || !text.trim()} onClick={run}>
          {loading ? <><div className="spinner" style={{width:16,height:16}} /> Analyzing…</> : '🤖 Classify with AI'}
        </button>

        {error && <div style={{ marginTop: 12, color: 'var(--red)', fontSize: 13 }}>{error}</div>}

        {result && (
          <div style={{ marginTop: 20, background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Classification Result</div>
            {[
              ['Category',   <span className={`pill pill-${result.category?.toLowerCase()}`}>{categoryEmoji(result.category)} {categoryLabel(result.category)}</span>],
              ['Priority',   <span style={{ color: priorityColor(result.priority), fontWeight: 600 }}>{result.priority}</span>],
              ['Sentiment',  <span style={{ color: sentimentColor(result.sentiment) }}>{result.sentiment}</span>],
              ['Confidence', (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 80, height: 4, background: 'var(--surface3)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.round((result.confidence||0)*100)}%`, background: ci?.color, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: ci?.color }}>{Math.round((result.confidence||0)*100)}%</span>
                </div>
              )],
              ['SLA Bucket',    `${result.slaHours}h`],
              ['Est. Resolution', `${result.predictedResolutionHours}h`],
              ['Route to',   <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{result.suggestedDepartment}</span>],
              ['Routing Advice', <span style={{ fontSize: 12, color: 'var(--muted)' }}>{result.routingAdvice}</span>],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{k}</span>
                <span style={{ fontSize: 13 }}>{v}</span>
              </div>
            ))}
            {result.detectedKeywords?.length > 0 && (
              <div style={{ padding: '10px 16px' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>DETECTED KEYWORDS</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {result.detectedKeywords.map(k => (
                    <span key={k} style={{ background: 'var(--surface3)', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>{k}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="panel">
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, marginBottom: 12 }}>How It Works</div>
        <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: 14, fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 2, color: 'var(--muted)', marginBottom: 16 }}>
          {['1. Tokenization & Embedding','2. Intent Extraction','3. Named Entity Recognition','4. Sentiment Analysis','5. Multi-label Classification','6. Priority Scoring','7. SLA Risk Assessment'].map(s => (
            <div key={s}>{s}</div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>
          Rule-based NLP pipeline trained on customer support patterns. Swap for ML model by configuring <code style={{ background: 'var(--surface3)', padding: '1px 5px', borderRadius: 4 }}>app.nlp.enabled=true</code> in backend config.
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-head)', marginBottom: 12 }}>Category Distribution</div>
          {[['Billing',38,'var(--accent)'],['Technical',29,'var(--accent2)'],['Account',19,'var(--green)'],['Refunds',9,'var(--amber)'],['Feature',5,'var(--pink)']].map(([n,p,c]) => (
            <div key={n} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span>{n}</span><span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{p}%</span>
              </div>
              <div style={{ height: 4, background: 'var(--surface3)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${p}%`, background: c, borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Predict ─────────────────────────────────────────────────────────────── */
function PredictTab() {
  const [form, setForm] = useState({ category: 'BILLING', priority: 'MEDIUM', customerTier: 'FREE' })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true); setResult(null)
    try {
      const { data } = await aiService.predict(form.category, form.priority, form.customerTier)
      setResult(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const etaColor = !result ? 'var(--muted)'
    : result.estimatedHours <= 4 ? 'var(--red)'
    : result.estimatedHours <= 12 ? 'var(--amber)' : 'var(--green)'

  return (
    <div style={{ maxWidth: 680 }}>
      <div className="panel">
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Resolution Time Predictor</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>Input ticket parameters to get AI-predicted resolution time and resource recommendation.</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          {[
            ['Category',      'category',     ['BILLING','TECHNICAL','ACCOUNT','REFUND','FEATURE_REQUEST','GENERAL']],
            ['Priority',      'priority',     ['LOW','MEDIUM','HIGH','CRITICAL']],
            ['Customer Tier', 'customerTier', ['FREE','BASIC','PREMIUM','ENTERPRISE']],
          ].map(([label, key, opts]) => (
            <div key={key}>
              <label className="form-label">{label}</label>
              <select className="form-select" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}>
                {opts.map(o => <option key={o} value={o}>{o.replace('_',' ')}</option>)}
              </select>
            </div>
          ))}
        </div>

        <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }}
          disabled={loading} onClick={run}>
          {loading ? <><div className="spinner" style={{width:16,height:16}} />Predicting…</> : '⚡ Predict Resolution Time'}
        </button>

        {result && (
          <div style={{ marginTop: 24, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>PREDICTED RESOLUTION TIME</div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 56, fontWeight: 800, color: etaColor, letterSpacing: -2 }}>
                {result.estimatedHours}h
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Model confidence: {Math.round((result.confidence||0)*100)}%</div>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13, marginBottom: 14 }}>
              {[['SLA Risk', result.slaRisk], ['Recommended Agent', result.recommendedAgentTier], ['Category', result.category], ['Tier Applied', result.customerTier]].map(([k,v]) => (
                <div key={k}><span style={{ color: 'var(--muted)' }}>{k}: </span><strong>{v}</strong></div>
              ))}
            </div>
            <div style={{ background: 'rgba(79,142,247,0.08)', borderRadius: 8, padding: 12, fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>
              💡 <strong style={{ color: 'var(--text)' }}>AI Recommendation:</strong> {result.reasoning}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── KB Search ───────────────────────────────────────────────────────────── */
function KBTab() {
  const [query, setQuery]   = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  const run = async () => {
    if (!query.trim()) return
    setLoading(true); setResults(null)
    try {
      const { data } = await aiService.kbSearch(query, null, 6)
      setResults(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="panel">
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Knowledge Base Recommender</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>
          Describe a customer issue to find the most relevant KB articles and resolution templates using semantic search.
        </div>
        <label className="form-label">Issue Description</label>
        <textarea className="form-textarea" rows={4} value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && e.ctrlKey && run()}
          placeholder="e.g. Customer was charged twice for their subscription…"
          style={{ marginBottom: 12 }} />
        <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }}
          disabled={loading || !query.trim()} onClick={run}>
          {loading ? <><div className="spinner" style={{width:16,height:16}} />Searching…</> : '💡 Find KB Articles'}
        </button>

        {results !== null && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
              {results.length > 0 ? `Found ${results.length} relevant articles` : 'No articles found. Try different keywords.'}
            </div>
            {results.map(a => (
              <div key={a.id} style={{
                background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10,
                padding: 14, marginBottom: 10, cursor: 'pointer', transition: 'border-color 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              onClick={() => aiService.trackView(a.id)}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{a.title}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--green)', flexShrink: 0, marginLeft: 8 }}>
                    {Math.round((a.relevanceScore||0)*100)}% match
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`pill pill-${a.category?.toLowerCase()}`}>{a.category?.replace('_',' ')}</span>
                  <div style={{ flex: 1, height: 3, background: 'var(--surface3)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.round((a.relevanceScore||0)*100)}%`, background: 'var(--green)', borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{a.viewCount} views</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
