import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import { getLiveVehicles, getRecentPings } from '../api/avls'
import axios from 'axios'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function LiveMap() {
  const [vehicles,    setVehicles]    = useState([])
  const [depots,      setDepots]      = useState([])
  const [selected,    setSelected]    = useState(null)
  const [polyline,    setPolyline]    = useState([])
  const [depotFilter, setDepotFilter] = useState('')
  const intervalRef = useRef(null)

  // Load depots from API so IDs are always correct
  useEffect(() => {
    axios.get('http://localhost:8000/api/v1/scheduling/depots', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(r => setDepots(r.data))
  }, [])

  useEffect(() => {
    loadVehicles()
    intervalRef.current = setInterval(loadVehicles, 5000)
    return () => clearInterval(intervalRef.current)
  }, [depotFilter])

  async function loadVehicles() {
    const res = await getLiveVehicles(depotFilter || null)
    setVehicles(res.data)
  }

  async function handleMarkerClick(vehicle) {
    setSelected(vehicle)
    const res = await getRecentPings(vehicle.vehicle_id)
    const coords = res.data.map(p => [p.lat, p.lng])
    setPolyline(coords)
  }

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <h2 style={styles.heading}>Live Map</h2>
        <select
          style={styles.select}
          value={depotFilter}
          onChange={e => setDepotFilter(e.target.value)}
        >
          <option value="">All depots</option>
          {depots.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <span style={styles.count}>{vehicles.length} vehicles</span>
      </div>

      <div style={styles.mapWrap}>
        <MapContainer
          center={[28.6139, 77.2090]}
          zoom={11}
          style={{ height:'100%', width:'100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap contributors"
          />
          {vehicles.map(v => (
            <Marker
              key={v.vehicle_id}
              position={[v.lat, v.lng]}
              eventHandlers={{ click: () => handleMarkerClick(v) }}
            >
              <Popup>{v.reg_no} — {v.speed_kmh} km/h</Popup>
            </Marker>
          ))}
          {polyline.length > 1 && (
            <Polyline positions={polyline} color="#2563eb" weight={3} />
          )}
        </MapContainer>
      </div>

      {selected && (
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <h3 style={styles.panelTitle}>{selected.reg_no}</h3>
            <button style={styles.closeBtn} onClick={() => { setSelected(null); setPolyline([]) }}>✕</button>
          </div>
          <div style={styles.panelRow}><span style={styles.label}>Driver</span><span>{selected.driver_name || '—'}</span></div>
          <div style={styles.panelRow}><span style={styles.label}>Route</span><span>{selected.route_name || '—'}</span></div>
          <div style={styles.panelRow}><span style={styles.label}>Speed</span><span>{selected.speed_kmh} km/h</span></div>
          <div style={styles.panelRow}><span style={styles.label}>Last ping</span><span>{new Date(selected.ts).toLocaleTimeString('en-IN', {timeZone:'Asia/Kolkata'})}</span></div>
          <p style={styles.polylineNote}>Blue line = last 30 min path</p>
        </div>
      )}
    </div>
  )
}

const styles = {
  page:        { display:'flex', flexDirection:'column', height:'calc(100vh - 56px)', position:'relative' },
  topbar:      { display:'flex', alignItems:'center', gap:'12px', padding:'10px 1.5rem', background:'white', borderBottom:'1px solid #eee' },
  heading:     { fontSize:'16px', fontWeight:'600' },
  select:      { padding:'6px 10px', border:'1px solid #ddd', borderRadius:'4px', fontSize:'13px' },
  count:       { fontSize:'13px', color:'#888' },
  mapWrap:     { flex:1 },
  panel:       { position:'absolute', top:'60px', right:'16px', width:'240px', background:'white', border:'1px solid #eee', borderRadius:'8px', padding:'1rem', zIndex:1000, boxShadow:'0 2px 8px rgba(0,0,0,0.1)' },
  panelHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' },
  panelTitle:  { fontSize:'15px', fontWeight:'600' },
  closeBtn:    { background:'none', border:'none', cursor:'pointer', fontSize:'16px', color:'#888' },
  panelRow:    { display:'flex', justifyContent:'space-between', fontSize:'13px', padding:'6px 0', borderBottom:'1px solid #f5f5f5' },
  label:       { color:'#888' },
  polylineNote:{ fontSize:'11px', color:'#aaa', marginTop:'8px' }
}
