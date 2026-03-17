/**
 * aiService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * All AI feature API calls live here — separate from UI components.
 * Import { aiService } plus the helper functions you need in your pages.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import api from './api'

export const aiService = {
  /**
   * Classify ticket text — returns category, priority, sentiment, confidence,
   * aiSummary, predictedResolutionHours, slaDeadline, keywords, routingAdvice
   */
  classify: (text) =>
    api.post('/ai/classify', { text }),

  /**
   * Predict resolution time given category, priority, and customer tier
   */
  predict: (category, priority, customerTier = 'FREE') =>
    api.post('/ai/predict', { category, priority, customerTier }),

  /**
   * Semantic knowledge-base search — returns ranked articles
   */
  kbSearch: (query, category = null, limit = 5) =>
    api.post('/ai/kb/search', { query, category, limit }),

  /**
   * Track a KB article view (increments view counter)
   */
  trackView: (id) =>
    api.get(`/ai/kb/${id}/view`),
}

// ── Display helpers (used by AI result panels) ────────────────────────────────

export const confidenceInfo = (conf) => {
  const pct = Math.round((conf || 0) * 100)
  if (pct >= 90) return { label: 'Very High', color: 'var(--green)' }
  if (pct >= 75) return { label: 'High',      color: 'var(--accent)' }
  if (pct >= 60) return { label: 'Medium',    color: 'var(--amber)' }
  return           { label: 'Low',       color: 'var(--red)' }
}

export const sentimentColor = (s) =>
  ({ NEGATIVE: 'var(--red)', POSITIVE: 'var(--green)', NEUTRAL: 'var(--muted)' })[s] || 'var(--muted)'

export const priorityColor = (p) =>
  ({ CRITICAL: 'var(--red)', HIGH: 'var(--amber)', MEDIUM: 'var(--accent)', LOW: 'var(--green)' })[p] || 'var(--muted)'

export const categoryEmoji = (c) =>
  ({ BILLING:'💳', TECHNICAL:'⚙️', ACCOUNT:'👤', REFUND:'💰', FEATURE_REQUEST:'✨', GENERAL:'📋' })[c] || '📋'

export const categoryLabel = (c) =>
  ({ BILLING:'Billing', TECHNICAL:'Technical', ACCOUNT:'Account',
     REFUND:'Refund', FEATURE_REQUEST:'Feature Request', GENERAL:'General' })[c] || c
