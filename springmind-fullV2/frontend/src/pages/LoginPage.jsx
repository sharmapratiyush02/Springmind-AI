import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import CaptchaWidget from '../components/CaptchaWidget'
import { authService } from '../services/authService'

const buttonStyle = (enabled = true, loading = false) => ({
  width: '100%', padding: 12, borderRadius: 10, border: 'none',
  background: enabled ? 'linear-gradient(135deg, var(--accent2), var(--accent))' : 'var(--surface3)',
  color: 'white', fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700,
  cursor: (loading || !enabled) ? 'not-allowed' : 'pointer',
  opacity: loading ? 0.7 : 1,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  transition: 'background 0.3s'
})

export default function LoginPage() {
  const { login, verifyOtp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: 'admin@springmind.ai', password: 'Admin@123' })
  const [otp, setOtp] = useState('')
  const [challenge, setChallenge] = useState(null)
  const [debugOtp, setDebugOtp] = useState('')
  const [forgotMode, setForgotMode] = useState(false)
  const [resetToken, setResetToken] = useState(() => new URLSearchParams(window.location.search).get('resetToken') || '')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [captchaValid, setCaptchaValid] = useState(false)

  const handleCaptcha = useCallback((valid) => setCaptchaValid(valid), [])

  const handle = async (e) => {
    e.preventDefault()
    if (!captchaValid) { setError('Please complete the CAPTCHA verification.'); return }
    setError('')
    setNotice('')
    setLoading(true)
    try {
      const result = await login(form.email, form.password)
      if (result?.otpRequired) {
        setChallenge(result.challengeToken)
        setDebugOtp(result.debugOtp || '')
        setNotice(result.message || 'Verification code sent to registered email')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const handleOtp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await verifyOtp(challenge, otp)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code')
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setLoading(true)
    try {
      const { data } = await authService.forgotPassword(form.email)
      setNotice(data.message)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to send reset link')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setLoading(true)
    try {
      const { data } = await authService.resetPassword(resetToken, newPassword)
      setNotice(data.message)
      setResetToken('')
      setForgotMode(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reset password')
    } finally {
      setLoading(false)
    }
  }

  const alert = (message, tone = 'red') => message && (
    <div style={{
      background: tone === 'green' ? 'rgba(80,200,120,0.1)' : 'rgba(242,92,92,0.1)',
      border: tone === 'green' ? '1px solid rgba(80,200,120,0.3)' : '1px solid rgba(242,92,92,0.3)',
      borderRadius: 8, padding: '10px 14px', marginBottom: 14,
      color: tone === 'green' ? 'var(--green)' : 'var(--red)', fontSize: 13
    }}>{message}</div>
  )

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
      backgroundImage: 'radial-gradient(ellipse 60% 60% at 50% 0%, rgba(124,92,252,0.12) 0%, transparent 70%)'
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border2)',
        borderRadius: 20, padding: 40, width: 440, maxWidth: '95vw',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, margin: '0 auto 14px',
            background: 'linear-gradient(135deg, var(--accent2), var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28
          }}>SM</div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
            SpringMind AI
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>
            AI-Powered Customer Support Platform
          </div>
        </div>

        {alert(notice + (debugOtp ? ` (Dev OTP: ${debugOtp})` : ''), 'green')}

        {resetToken ? (
          <form onSubmit={handleReset}>
            <div style={{ marginBottom: 12 }}>
              <label className="form-label">New password</label>
              <input className="form-input" type="password" required minLength={8}
                value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            {alert(error)}
            <button type="submit" disabled={loading} style={buttonStyle(true, loading)}>
              {loading ? 'Resetting...' : 'Reset password'}
            </button>
          </form>
        ) : challenge ? (
          <form onSubmit={handleOtp}>
            <div style={{ marginBottom: 16 }}>
              <label className="form-label">Email verification code</label>
              <input className="form-input" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required
                value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} />
            </div>
            {alert(error)}
            <button type="submit" disabled={loading || otp.length !== 6} style={buttonStyle(otp.length === 6, loading)}>
              {loading ? 'Verifying...' : 'Verify and sign in'}
            </button>
          </form>
        ) : forgotMode ? (
          <form onSubmit={handleForgot}>
            <div style={{ marginBottom: 16 }}>
              <label className="form-label">Registered email</label>
              <input className="form-input" type="email" required
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            {alert(error)}
            <button type="submit" disabled={loading} style={buttonStyle(true, loading)}>
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
            <button type="button" onClick={() => setForgotMode(false)} style={{
              width: '100%', marginTop: 10, background: 'transparent', border: 0, color: 'var(--muted)', cursor: 'pointer'
            }}>Back to sign in</button>
          </form>
        ) : (
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

            <div style={{ marginBottom: 16 }}>
              <CaptchaWidget onVerify={handleCaptcha} />
            </div>

            {alert(error)}

            <button type="submit" disabled={loading || !captchaValid} style={buttonStyle(captchaValid, loading)}>
              {loading ? <><div className="spinner" />Signing in...</> : 'Sign in ->'}
            </button>
            <button type="button" onClick={() => { setForgotMode(true); setError(''); setNotice('') }} style={{
              width: '100%', marginTop: 10, background: 'transparent', border: 0, color: 'var(--muted)', cursor: 'pointer'
            }}>Forgot password?</button>
          </form>
        )}

        <div style={{ marginTop: 20, background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Demo Credentials
          </div>
          {[
            { label: 'Admin', email: 'admin@springmind.ai', pwd: 'Admin@123', color: 'var(--accent2)' },
            { label: 'Agent', email: 'priya@springmind.ai', pwd: 'Agent@123', color: 'var(--green)' },
          ].map(({ label, email, pwd, color }) => (
            <div key={label}
              onClick={() => { setForm({ email, password: pwd }); setCaptchaValid(false); setChallenge(null); setForgotMode(false) }}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ background: color, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontWeight: 600, color: '#fff' }}>{label}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>{email} / {pwd}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
