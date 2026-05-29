import axios from 'axios'

const BASE = 'http://localhost:8000/api/v1/ims'

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` }
}

export const getIncidents    = (status, severity) => axios.get(`${BASE}/incidents`, { headers: authHeader(), params: { status, severity } })
export const getIncident     = (id)               => axios.get(`${BASE}/incidents/${id}`, { headers: authHeader() })
export const createIncident  = (data)             => axios.post(`${BASE}/incidents`, data, { headers: authHeader() })
export const changeStatus    = (id, note)         => axios.patch(`${BASE}/incidents/${id}/status`, { note }, { headers: authHeader() })
export const assignIncident  = (id, assigned_to)  => axios.patch(`${BASE}/incidents/${id}/assign`, { assigned_to }, { headers: authHeader() })
export const getUsers        = ()                 => axios.get(`${BASE}/users`, { headers: authHeader() })
