import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet'
import L from 'leaflet'
import { getAllVehicles, getHistory } from '../api/avls'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function MapHistory() {
  const today = new Date().toISOString().split('T')[0]

  const [vehicles,   setVehicles]   = useState([])
  const [vehicleId,  setVehicleId]  = useState('')
  const [date,       setDate]       = useState(today)
  const [path,       setPath]       = useState([])
  const [vehicleReg, setVehicleReg] = useState('')
  const [searched,   setSearched]   = useState(false)

  useEffect(() => {
    getAllVehicles().then(r => setVehicles(r.data))
  }, [])

  async function handleSearch() {
    if (!vehicleId || !date) return
    const res = await getHistory(vehicleId, date)
    const coords = res.data.pings.map(p => [p.lat, p.lng])
    setPath(coords)
    setVehicleReg(res.data.vehicle_reg)
    setSearched(true)
  }

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>Trip History</h2>

      <div style={styles.controls}>
        <select style={styles.input} value={vehicleId} onChange={e => setVehicleId(e.target.value)}>
          <option value="">Select vehicle</option>
          {vehicles.map(v => <option key={v.id} value={v.id}>{v.reg_no}</option>)}
        </select>
        <input style={styles.input} type="date" value={date} onChange={e => setDate(e.target.value)} />
        <button style={styles.btn} onClick={handleSearch}>Show Path</button>
      </div>

      {searched && path.length === 0 && (
        <p style={styles.empty}>No GPS data found for this vehicle on {date}.</p>
      )}

      {path.length > 0 && (
        <>
          <p style={styles.info}>{vehicleReg} — {path.length} pings on {date}</p>
          <div style={styles.mapWrap}>
            <MapContainer center={path[0]} zoom={14} style={{ height:'100%', width:'100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="© OpenStreetMap contributors"
              />
              <Polyline positions={path} color="#dc2626" weight={3} />
              <Marker position={path[0]}></ Marker>
              <Marker position={path[path.length - 1]}></ Marker>
            </MapContainer>
          </div>
        </>
      )}
    </div>
  )
}

const styles = {
  page:     { padding:'1.5rem', display:'flex', flexDirection:'column', height:'calc(100vh - 56px)' },
  heading:  { fontSize:'18px', marginBottom:'1rem' },
  controls: { display:'flex', gap:'10px', marginBottom:'1rem', flexWrap:'wrap' },
  input:    { padding:'8px', border:'1px solid #ddd', borderRadius:'4px', fontSize:'14px' },
  btn:      { padding:'8px 20px', background:'#2563eb', color:'white', border:'none', borderRadius:'4px', fontSize:'14px', cursor:'pointer' },
  empty:    { color:'#aaa', fontSize:'14px' },
  info:     { fontSize:'13px', color:'#555', marginBottom:'8px' },
  mapWrap:  { flex:1, borderRadius:'8px', overflow:'hidden', minHeight:'400px' }
}
