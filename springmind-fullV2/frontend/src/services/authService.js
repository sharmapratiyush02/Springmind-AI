import api from './api'

export const authService = {
  login:    (email, password) => api.post('/auth/login', { email, password }),
  verifyOtp: (challengeToken, otp) => api.post('/auth/verify-otp', { challengeToken, otp }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
  register: (data)            => api.post('/auth/register', data),
}
