import axios from 'axios'

const BASE = 'http://localhost:8000/api/v1/avls'

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` }
}

export const getLiveVehicles  = (depotId) => axios.get(`${BASE}/live${depotId ? '?depot_id='+depotId : ''}`, { headers: authHeader() })
export const getRecentPings   = (vehicleId) => axios.get(`${BASE}/recent/${vehicleId}`, { headers: authHeader() })
export const getHistory       = (vehicleId, date) => axios.get(`${BASE}/history?vehicle_id=${vehicleId}&date=${date}`, { headers: authHeader() })
export const getAllVehicles    = () => axios.get(`${BASE}/vehicles`, { headers: authHeader() })
