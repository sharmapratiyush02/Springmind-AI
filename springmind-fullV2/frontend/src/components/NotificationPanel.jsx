import { useState, useEffect, useRef, useCallback } from 'react'
import { ticketService } from '../services/ticketService'

const POLL_INTERVAL = 30_000 // 30 seconds

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function eventColor(status) {
  const map = { OPEN: 'var(--accent)', IN_PROGRESS: 'var(--amber)', RESOLVED: 'var(--green)', CLOSED: 'var(--muted)' }
  return map[status] || 'var(--muted)'
}
function eventIcon(status) {
  const icons = { OPEN: '🎫', IN_PROGRESS: '⏳', RESOLVED: '✅', CLOSED: '🔒' }
  return icons[status] || '📩'
}

/**
 * NotificationPanel — Enhancement 2 (Neeraj Gupta — Dashboard/Config)
 * Props: open, onClose
 */
export default function NotificationPanel({ open, onClose }) {
  const [tickets, setTickets]   = useState([])
  const [unread, setUnread]     = useState(0)
  const lastSeenRef             = useRef(localStorage.getItem('sm_notif_seen') || new Date(0).toISOString())
  const panelRef                = useRef(null)

  const fetchTickets = useCallback(() => {
    ticketService.list({ size: 15 })
      .then(r => {
        const items = r.data?.content || []
        setTickets(items)
        const newCount = items.filter(t => t.createdAt > lastSeenRef.current).length
        setUnread(newCount)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchTickets()
    const id = setInterval(fetchTickets, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [fetchTickets])

  const markRead = () => {
    const now = new Date().toISOString()
    lastSeenRef.current = now
    localStorage.setItem('sm_notif_seen', now)
    setUnread(0)
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  return (
    <>
      {/* Unread badge — exported as named export for Layout */}
      <span data-notif-count={unread} style={{ display: 'none' }} />

      {open && (
        <div ref={panelRef} style={{
          position: 'fixed',
          left: 220, bottom: 80,
          width: 340, maxHeight: 480,
          background: 'var(--surface)',
          border: '1px solid var(--border2)',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          zIndex: 2000,
          display: 'flex', flexDirection: 'column',
          animation: 'notifSlideIn 0.2s ease',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700 }}>
                🔔 Activity Center
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                {unread > 0 ? `${unread} new ticket${unread > 1 ? 's' : ''}` : 'All caught up'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {unread > 0 && (
                <button onClick={markRead} style={{
                  background: 'rgba(79,142,247,0.12)', border: '1px solid rgba(79,142,247,0.25)',
                  borderRadius: 6, padding: '4px 10px', fontSize: 11,
                  color: 'var(--accent)', cursor: 'pointer', fontFamily: 'var(--font-mono)'
                }}>Mark read</button>
              )}
              <button onClick={onClose} style={{
                background: 'var(--surface2)', border: 'none',
                width: 26, height: 26, borderRadius: 6, cursor: 'pointer',
                color: 'var(--muted)', fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>✕</button>
            </div>
          </div>

          {/* Feed */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {tickets.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                No recent activity
              </div>
            ) : tickets.map((t, i) => {
              const isNew = t.createdAt > lastSeenRef.current
              return (
                <div key={t.id} style={{
                  display: 'flex', gap: 12, padding: '12px 16px',
                  borderBottom: i < tickets.length - 1 ? '1px solid var(--border)' : 'none',
                  background: isNew ? 'rgba(79,142,247,0.04)' : 'transparent',
                  transition: 'background 0.2s'
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                    background: `${eventColor(t.status)}22`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16
                  }}>{eventIcon(t.status)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 500,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>{t.title}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>
                        {t.ticketNumber}
                      </span>
                      <span style={{
                        fontSize: 10, padding: '1px 6px', borderRadius: 10,
                        background: `${eventColor(t.status)}22`, color: eventColor(t.status),
                        fontFamily: 'var(--font-mono)'
                      }}>{t.status?.replace('_', ' ')}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                      {t.customerName} · {timeAgo(t.createdAt)}
                    </div>
                  </div>
                  {isNew && (
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 6 }} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div style={{
            padding: '10px 16px', borderTop: '1px solid var(--border)',
            fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)',
            textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 2s infinite' }} />
            Auto-refreshes every 30 seconds
          </div>
        </div>
      )}
    </>
  )
}

/** Export the unread count hook for use in Layout */
export function useNotifCount() {
  const [unread, setUnread] = useState(0)
  const lastSeenRef = useRef(localStorage.getItem('sm_notif_seen') || new Date(0).toISOString())

  useEffect(() => {
    const fetch = () => {
      ticketService.list({ size: 20 })
        .then(r => {
          const items = r.data?.content || []
          setUnread(items.filter(t => t.createdAt > lastSeenRef.current).length)
        }).catch(() => {})
    }
    fetch()
    const id = setInterval(fetch, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [])

  const reset = () => {
    const now = new Date().toISOString()
    lastSeenRef.current = now
    localStorage.setItem('sm_notif_seen', now)
    setUnread(0)
  }

  return { unread, reset }
}
