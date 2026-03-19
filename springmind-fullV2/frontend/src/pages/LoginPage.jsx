import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: 'admin@springmind.ai', password: 'Admin@123' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handle = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)'
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border2)',
        borderRadius: 20, padding: 40, width: 420, maxWidth: '95vw'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, margin: '0 auto 14px',
            background: 'linear-gradient(135deg, var(--accent2), var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28
          }}>🧠</div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
            SpringMind AI
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>
            AI-Powered Customer Support Platform
          </div>
        </div>

        <form onSubmit={handle}>
          <div style={{ marginBottom: 12 }}>
            <label className="form-label">Email</label>
            <input className="form-input" type="email" required
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">Password</label>
            <input className="form-input" type="password" required
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>

          {error && (
            <div style={{
              background: 'rgba(242,92,92,0.1)', border: '1px solid rgba(242,92,92,0.3)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 14,
              color: 'var(--red)', fontSize: 13
            }}>{error}</div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: 12, borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, var(--accent2), var(--accent))',
            color: 'white', fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}>
            {loading ? <><div className="spinner" />Signing in…</> : 'Sign in →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
          Demo: admin@springmind.ai / Admin@123
        </div>
      </div>
    </div>
  )
}
