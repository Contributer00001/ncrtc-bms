import { useEffect, useState } from 'react'
import { getIncidents, createIncident } from '../api/ims'
import IncidentDetail from './IncidentDetail'

const SEVERITY_COLOR = { P1: '#dc2626', P2: '#d97706', P3: '#2563eb' }
const STATUS_COLOR   = { open: '#dc2626', acknowledged: '#d97706', in_progress: '#2563eb', resolved: '#16a34a', closed: '#6b7280' }

export default function Incidents() {
  const [incidents,  setIncidents]  = useState([])
  const [selected,   setSelected]   = useState(null)
  const [statusF,    setStatusF]    = useState('')
  const [severityF,  setSeverityF]  = useState('')
  const [showForm,   setShowForm]   = useState(false)
  const [error,      setError]      = useState('')

  const [fType,  setFType]  = useState('breakdown')
  const [fSev,   setFSev]   = useState('P2')
  const [fDesc,  setFDesc]  = useState('')

  useEffect(() => { load() }, [statusF, severityF])

  async function load() {
    const res = await getIncidents(statusF || undefined, severityF || undefined)
    setIncidents(res.data)
  }

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    try {
      await createIncident({ type: fType, severity: fSev, description: fDesc })
      setFDesc(''); setShowForm(false)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create incident')
    }
  }

  if (selected) {
    return <IncidentDetail id={selected} onBack={() => { setSelected(null); load() }} />
  }

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <h2 style={styles.heading}>Incidents</h2>
        <button style={styles.btn} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Raise Incident'}
        </button>
      </div>

      {showForm && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Raise Incident</h3>
          {error && <p style={styles.error}>{error}</p>}
          <form onSubmit={handleCreate} style={styles.formGrid}>
            <div style={styles.field}>
              <label>Type</label>
              <select style={styles.input} value={fType} onChange={e => setFType(e.target.value)}>
                <option value="breakdown">Breakdown</option>
                <option value="accident">Accident</option>
                <option value="complaint">Complaint</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div style={styles.field}>
              <label>Severity</label>
              <select style={styles.input} value={fSev} onChange={e => setFSev(e.target.value)}>
                <option value="P1">P1 — Critical</option>
                <option value="P2">P2 — High</option>
                <option value="P3">P3 — Low</option>
              </select>
            </div>
            <div style={{...styles.field, gridColumn:'1/-1'}}>
              <label>Description</label>
              <textarea style={{...styles.input, height:'80px'}} value={fDesc} onChange={e => setFDesc(e.target.value)} required />
            </div>
            <div style={{gridColumn:'1/-1'}}>
              <button style={styles.btn} type="submit">Submit</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={styles.filters}>
        <select style={styles.select} value={statusF} onChange={e => setStatusF(e.target.value)}>
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select style={styles.select} value={severityF} onChange={e => setSeverityF(e.target.value)}>
          <option value="">All severities</option>
          <option value="P1">P1</option>
          <option value="P2">P2</option>
          <option value="P3">P3</option>
        </select>
      </div>

      {/* List */}
      {incidents.length === 0 && <p style={styles.empty}>No incidents found.</p>}
      {incidents.map(i => (
        <div key={i.id} style={styles.row} onClick={() => setSelected(i.id)}>
          <div style={styles.rowLeft}>
            <span style={{...styles.badge, background: SEVERITY_COLOR[i.severity]+'22', color: SEVERITY_COLOR[i.severity]}}>{i.severity}</span>
            <span style={{...styles.badge, background: STATUS_COLOR[i.status]+'22', color: STATUS_COLOR[i.status]}}>{i.status}</span>
            <span style={styles.type}>{i.type}</span>
          </div>
          <div style={styles.rowRight}>
            <span style={styles.meta}>Raised by {i.raised_by}</span>
            <span style={styles.meta}>{new Date(i.created_at).toLocaleDateString('en-IN', {timeZone:'Asia/Kolkata'})}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

const styles = {
  page:     { padding:'1.5rem', maxWidth:'800px' },
  topbar:   { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' },
  heading:  { fontSize:'18px', fontWeight:'600' },
  btn:      { padding:'8px 16px', background:'#2563eb', color:'white', border:'none', borderRadius:'4px', fontSize:'14px', cursor:'pointer' },
  card:     { background:'white', border:'1px solid #eee', borderRadius:'8px', padding:'1.5rem', marginBottom:'1rem' },
  cardTitle:{ fontSize:'15px', fontWeight:'600', marginBottom:'1rem' },
  formGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' },
  field:    { display:'flex', flexDirection:'column', gap:'4px' },
  input:    { padding:'8px', border:'1px solid #ddd', borderRadius:'4px', fontSize:'14px' },
  error:    { color:'#dc2626', fontSize:'13px', background:'#fef2f2', padding:'8px', borderRadius:'4px', marginBottom:'8px' },
  filters:  { display:'flex', gap:'8px', marginBottom:'1rem' },
  select:   { padding:'6px 10px', border:'1px solid #ddd', borderRadius:'4px', fontSize:'13px' },
  row:      { background:'white', border:'1px solid #eee', borderRadius:'8px', padding:'12px 16px', marginBottom:'8px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' },
  rowLeft:  { display:'flex', gap:'8px', alignItems:'center' },
  rowRight: { display:'flex', gap:'16px' },
  badge:    { padding:'2px 8px', borderRadius:'4px', fontSize:'12px', fontWeight:'500' },
  type:     { fontSize:'14px' },
  meta:     { fontSize:'12px', color:'#888' },
  empty:    { color:'#aaa', fontSize:'14px' }
}
