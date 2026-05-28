import axios from 'axios'

const BASE = 'http://localhost:8000/api/v1/notices'

// Get auth header from localStorage
function authHeader() {
  const token = localStorage.getItem('token')
  return { Authorization: `Bearer ${token}` }
}

// Get all notices for the current user
export function getNotices() {
  return axios.get(BASE, { headers: authHeader() })
}

// Create a new notice (admin only)
export function createNotice(data) {
  return axios.post(BASE, data, { headers: authHeader() })
}

// Mark a notice as read
export function markRead(noticeId) {
  return axios.post(`${BASE}/${noticeId}/read`, {}, { headers: authHeader() })
}

// Get read receipts for a notice (admin only)
export function getReceipts(noticeId) {
  return axios.get(`${BASE}/${noticeId}/receipts`, { headers: authHeader() })
}
