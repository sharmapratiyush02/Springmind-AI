import { useState, useEffect, useCallback } from 'react'

function generateChallenge() {
  const ops = ['+', '-', '×']
  const op = ops[Math.floor(Math.random() * ops.length)]
  let a, b, answer
  if (op === '+') { a = Math.floor(Math.random()*20)+1; b = Math.floor(Math.random()*20)+1; answer = a+b }
  else if (op === '-') { a = Math.floor(Math.random()*20)+10; b = Math.floor(Math.random()*a)+1; answer = a-b }
  else { a = Math.floor(Math.random()*9)+2; b = Math.floor(Math.random()*9)+2; answer = a*b }
  return { expression: `${a} ${op} ${b}`, answer: String(answer) }
}

/**
 * CaptchaWidget — Math-puzzle CAPTCHA
 * Props:
 *   onVerify(isValid: boolean) — called when user submits answer
 *   style — optional outer container styles
 */
export default function CaptchaWidget({ onVerify, style = {} }) {
  const [challenge, setChallenge] = useState(generateChallenge)
  const [input, setInput]         = useState('')
  const [status, setStatus]       = useState('idle') // idle | success | error

  const refresh = useCallback(() => {
    setChallenge(generateChallenge())
    setInput('')
    setStatus('idle')
    onVerify(false)
  }, [onVerify])

  const verify = useCallback((val) => {
    if (!val.trim()) return
    const correct = val.trim() === challenge.answer
    setStatus(correct ? 'success' : 'error')
    onVerify(correct)
    if (!correct) {
      setTimeout(() => {
        setChallenge(generateChallenge())
        setInput('')
        setStatus('idle')
        onVerify(false)
      }, 1200)
    }
  }, [challenge.answer, onVerify])

  useEffect(() => { onVerify(false) }, []) // reset on mount

  const borderColor =
    status === 'success' ? 'var(--green)' :
    status === 'error'   ? 'var(--red)'   :
    'var(--border2)'

  return (
    <div style={{
      background: 'var(--surface2)',
      border: `1px solid ${borderColor}`,
      borderRadius: 10,
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      transition: 'border-color 0.2s',
      ...style
    }}>
      {/* Checkbox-style icon */}
      <div style={{
        width: 22, height: 22, borderRadius: 5, flexShrink: 0,
        background: status === 'success'
          ? 'var(--green)'
          : status === 'error'
          ? 'var(--red)'
          : 'var(--surface3)',
        border: `2px solid ${status === 'idle' ? 'var(--border2)' : 'transparent'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
        fontSize: 13
      }}>
        {status === 'success' && '✓'}
        {status === 'error'   && '✕'}
      </div>

      {/* Label */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          I'm not a robot — solve:
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 800,
            background: 'linear-gradient(135deg, var(--accent2), var(--accent))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            userSelect: 'none'
          }}>
            {challenge.expression} = ?
          </span>
          <input
            type="number"
            value={input}
            onChange={e => setInput(e.target.value)}
            onBlur={e => verify(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && verify(input)}
            placeholder="…"
            disabled={status === 'success'}
            style={{
              width: 64, background: 'var(--surface)', border: '1px solid var(--border2)',
              borderRadius: 6, padding: '5px 8px', color: 'var(--text)',
              fontFamily: 'var(--font-mono)', fontSize: 14, outline: 'none',
              textAlign: 'center',
              opacity: status === 'success' ? 0.6 : 1
            }}
          />
        </div>
        {status === 'error' && (
          <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
            Incorrect — generating new challenge…
          </div>
        )}
        {status === 'success' && (
          <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
            ✓ Verified successfully
          </div>
        )}
      </div>

      {/* Refresh */}
      <button
        type="button"
        onClick={refresh}
        title="New challenge"
        style={{
          background: 'none', border: '1px solid var(--border2)',
          borderRadius: 6, width: 28, height: 28, cursor: 'pointer',
          color: 'var(--muted)', fontSize: 14, display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          transition: 'all 0.15s'
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
      >
        ↻
      </button>
    </div>
  )
}
