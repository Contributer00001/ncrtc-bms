import { useEffect, useState } from 'react'
import { getRoutes, createRoute, deleteRoute, getDuties, createDuty, publishDuty, getDrivers, getVehicles, getDepots } from '../api/scheduling'

export default function Scheduling() {
  const today = new Date().toISOString().split('T')[0]

  const [routes,   setRoutes]   = useState([])
  const [duties,   setDuties]   = useState([])
  const [drivers,  setDrivers]  = useState([])
  const [vehicles, setVehicles] = useState([])
  const [depots,   setDepots]   = useState([])
  const [date,     setDate]     = useState(today)
  const [tab,      setTab]      = useState('duties')
  const [error,    setError]    = useState('')

  // Route form state
  const [rCode,    setRCode]    = useState('')
  const [rName,    setRName]    = useState('')
  const [rDepot,   setRDepot]   = useState('')

  // Duty form state
  const [dDriver,  setDDriver]  = useState('')
  const [dVehicle, setDVehicle] = useState('')
  const [dRoute,   setDRoute]   = useState('')
  const [dStart,   setDStart]   = useState('08:00')
  const [dEnd,     setDEnd]     = useState('12:00')

  useEffect(() => {
    loadAll()
  }, [])

  useEffect(() => {
    loadDuties()
  }, [date])

  async function loadAll() {
    const [r, dr, v, dep] = await Promise.all([getRoutes(), getDrivers(), getVehicles(), getDepots()])
    setRoutes(r.data)
    setDrivers(dr.data)
    setVehicles(v.data)
    setDepots(dep.data)
    loadDuties()
  }

  async function loadDuties() {
    const res = await getDuties(date)
    setDuties(res.data)
  }

  async function handleCreateRoute(e) {
    e.preventDefault()
    setError('')
    try {
      await createRoute({ code: rCode, name: rName, depot_id: parseInt(rDepot) })
      setRCode(''); setRName(''); setRDepot('')
      const res = await getRoutes()
      setRoutes(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create route')
    }
  }

  async function handleDeleteRoute(id) {
    await deleteRoute(id)
    const res = await getRoutes()
    setRoutes(res.data)
  }

  async function handleCreateDuty(e) {
    e.preventDefault()
    setError('')
    try {
      await createDuty({ driver_id: parseInt(dDriver), vehicle_id: parseInt(dVehicle), route_id: parseInt(dRoute), date, start_time: dStart, end_time: dEnd })
      setDDriver(''); setDVehicle(''); setDRoute('')
      loadDuties()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create duty')
    }
  }

  async function handlePublish(id) {
    await publishDuty(id)
    loadDuties()
  }

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>Scheduling</h2>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button style={tab === 'duties' ? styles.tabActive : styles.tab} onClick={() => setTab('duties')}>Duties</button>
        <button style={tab === 'routes' ? styles.tabActive : styles.tab} onClick={() => setTab('routes')}>Routes</button>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {/* DUTIES TAB */}
      {tab === 'duties' && (
        <>
          {/* Assign duty form */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Assign Duty</h3>
            <form onSubmit={handleCreateDuty} style={styles.formGrid}>
              <div style={styles.field}>
                <label>Date</label>
                <input style={styles.input} type="date" value={date} onChange={e => setDate(e.target.value)} required />
              </div>
              <div style={styles.field}>
                <label>Driver</label>
                <select style={styles.input} value={dDriver} onChange={e => setDDriver(e.target.value)} required>
                  <option value="">Select driver</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                </select>
              </div>
              <div style={styles.field}>
                <label>Vehicle</label>
                <select style={styles.input} value={dVehicle} onChange={e => setDVehicle(e.target.value)} required>
                  <option value="">Select vehicle</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.reg_no}</option>)}
                </select>
              </div>
              <div style={styles.field}>
                <label>Route</label>
                <select style={styles.input} value={dRoute} onChange={e => setDRoute(e.target.value)} required>
                  <option value="">Select route</option>
                  {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div style={styles.field}>
                <label>Start time</label>
                <input style={styles.input} type="time" value={dStart} onChange={e => setDStart(e.target.value)} required />
              </div>
              <div style={styles.field}>
                <label>End time</label>
                <input style={styles.input} type="time" value={dEnd} onChange={e => setDEnd(e.target.value)} required />
              </div>
              <div style={{gridColumn:'1/-1'}}>
                <button style={styles.btn}>Assign Duty</button>
              </div>
            </form>
          </div>

          {/* Duties list */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Duties for {date}</h3>
            {duties.length === 0 && <p style={styles.empty}>No duties for this date.</p>}
            <table style={styles.table}>
              <thead>
                <tr>
                  {['Driver','Vehicle','Route','Time','Status','Action'].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {duties.map(d => (
                  <tr key={d.id}>
                    <td style={styles.td}>{d.driver_name}</td>
                    <td style={styles.td}>{d.vehicle_reg}</td>
                    <td style={styles.td}>{d.route_name}</td>
                    <td style={styles.td}>{d.start_time} – {d.end_time}</td>
                    <td style={styles.td}>
                      <span style={d.status === 'published' ? styles.badgeGreen : styles.badgeGray}>
                        {d.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {d.status === 'draft' && (
                        <button style={styles.linkBtn} onClick={() => handlePublish(d.id)}>Publish</button>
                      )}
                      {d.ack_at && <span style={styles.ack}>✓ Acknowledged</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ROUTES TAB */}
      {tab === 'routes' && (
        <>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Create Route</h3>
            <form onSubmit={handleCreateRoute} style={styles.formGrid}>
              <div style={styles.field}>
                <label>Code</label>
                <input style={styles.input} value={rCode} onChange={e => setRCode(e.target.value)} placeholder="e.g. R04" required />
              </div>
              <div style={styles.field}>
                <label>Name</label>
                <input style={styles.input} value={rName} onChange={e => setRName(e.target.value)} placeholder="e.g. Noida — Vaishali" required />
              </div>
              <div style={styles.field}>
                <label>Depot</label>
                <select style={styles.input} value={rDepot} onChange={e => setRDepot(e.target.value)} required>
                  <option value="">Select depot</option>
                  {depots.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div style={{gridColumn:'1/-1'}}>
                <button style={styles.btn}>Create Route</button>
              </div>
            </form>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>All Routes</h3>
            {routes.length === 0 && <p style={styles.empty}>No routes yet.</p>}
            {routes.map(r => (
              <div key={r.id} style={styles.routeRow}>
                <div>
                  <span style={styles.routeCode}>{r.code}</span>
                  <span style={styles.routeName}>{r.name}</span>
                </div>
                <button style={styles.deleteBtn} onClick={() => handleDeleteRoute(r.id)}>Delete</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const styles = {
  page:       { padding:'2rem', maxWidth:'800px' },
  heading:    { fontSize:'20px', marginBottom:'1rem' },
  tabs:       { display:'flex', gap:'8px', marginBottom:'1.5rem' },
  tab:        { padding:'6px 16px', border:'1px solid #ddd', borderRadius:'4px', background:'white', fontSize:'14px' },
  tabActive:  { padding:'6px 16px', border:'1px solid #2563eb', borderRadius:'4px', background:'#eff6ff', color:'#2563eb', fontSize:'14px' },
  card:       { background:'white', border:'1px solid #eee', borderRadius:'8px', padding:'1.5rem', marginBottom:'1rem' },
  cardTitle:  { fontSize:'15px', fontWeight:'600', marginBottom:'1rem' },
  formGrid:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' },
  field:      { display:'flex', flexDirection:'column', gap:'4px' },
  input:      { padding:'8px', border:'1px solid #ddd', borderRadius:'4px', fontSize:'14px' },
  btn:        { padding:'8px 20px', background:'#2563eb', color:'white', border:'none', borderRadius:'4px', fontSize:'14px' },
  error:      { color:'red', fontSize:'13px', marginBottom:'12px', background:'#fef2f2', padding:'8px', borderRadius:'4px' },
  table:      { width:'100%', borderCollapse:'collapse', fontSize:'13px' },
  th:         { textAlign:'left', padding:'8px', borderBottom:'1px solid #eee', color:'#888', fontWeight:'500' },
  td:         { padding:'8px', borderBottom:'1px solid #f5f5f5' },
  badgeGreen: { background:'#dcfce7', color:'#166534', padding:'2px 8px', borderRadius:'4px', fontSize:'12px' },
  badgeGray:  { background:'#f3f4f6', color:'#6b7280', padding:'2px 8px', borderRadius:'4px', fontSize:'12px' },
  linkBtn:    { fontSize:'12px', color:'#2563eb', background:'none', border:'none', cursor:'pointer' },
  ack:        { fontSize:'12px', color:'#16a34a' },
  empty:      { fontSize:'14px', color:'#aaa' },
  routeRow:   { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #f5f5f5' },
  routeCode:  { background:'#f3f4f6', padding:'2px 8px', borderRadius:'4px', fontSize:'12px', marginRight:'10px' },
  routeName:  { fontSize:'14px' },
  deleteBtn:  { fontSize:'12px', color:'#dc2626', background:'none', border:'none', cursor:'pointer' }
}
