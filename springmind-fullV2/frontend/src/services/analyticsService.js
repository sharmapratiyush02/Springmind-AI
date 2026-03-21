import api from './api'

export const analyticsService = {
  overview: () => api.get('/analytics/overview'),
  agents:   () => api.get('/analytics/agents'),
}
