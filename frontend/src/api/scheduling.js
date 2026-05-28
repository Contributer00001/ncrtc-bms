import axios from 'axios'

const BASE = 'http://localhost:8000/api/v1/scheduling'

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` }
}

export const getRoutes   = ()       => axios.get(`${BASE}/routes`, { headers: authHeader() })
export const createRoute = (data)   => axios.post(`${BASE}/routes`, data, { headers: authHeader() })
export const deleteRoute = (id)     => axios.delete(`${BASE}/routes/${id}`, { headers: authHeader() })
export const getDuties   = (date)   => axios.get(`${BASE}/duties?date=${date}`, { headers: authHeader() })
export const createDuty  = (data)   => axios.post(`${BASE}/duties`, data, { headers: authHeader() })
export const publishDuty = (id)     => axios.patch(`${BASE}/duties/${id}/publish`, {}, { headers: authHeader() })
export const ackDuty     = (id)     => axios.patch(`${BASE}/duties/${id}/acknowledge`, {}, { headers: authHeader() })
export const getMyDuty   = ()       => axios.get(`${BASE}/duties/mine`, { headers: authHeader() })
export const getDrivers  = ()       => axios.get(`${BASE}/drivers`, { headers: authHeader() })
export const getVehicles = ()       => axios.get(`${BASE}/vehicles`, { headers: authHeader() })
export const getDepots   = ()       => axios.get(`${BASE}/depots`, { headers: authHeader() })
