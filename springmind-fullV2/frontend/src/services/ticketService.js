import api from './api'

export const ticketService = {
  list:        (params = {})   => api.get('/tickets', { params }),
  get:         (id)            => api.get(`/tickets/${id}`),
  create:      (data)          => api.post('/tickets', data),
  update:      (id, data)      => api.patch(`/tickets/${id}`, data),
  addComment:  (id, data)      => api.post(`/tickets/${id}/comments`, data),
  getComments: (id)            => api.get(`/tickets/${id}/comments`),
  stats:       ()              => api.get('/tickets/dashboard/stats'),
  autoAssign:  ()              => api.post('/tickets/auto-assign'),
}
