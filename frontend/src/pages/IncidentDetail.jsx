import { useEffect, useState } from 'react'
import { getIncident, changeStatus, assignIncident, getUsers } from '../api/ims'

const STATUS_COLOR = { open:'#dc2626', acknowledged:'#d97706', in_progress:'#2563eb', resolved:'#16a34a', closed:'#6b7280' }
const NEXT_LABEL   = { open:'Acknowledge', acknowledged:'Start Progress', in_progress:'Mark Resolved', resolved:'Close' }

export default function IncidentDetail({ id, onBack }) {
  const [incident, setIncident] = useState(null)
  const [users,    setUsers]    = useState([])
  const [note,     setNote]     = useState('')
  const [assignTo, setAssignTo] = useState('')
  const [error,    setError]    = useState('')

  useEffect(() => {
    getIncident(id).then(r => setIncident(r.data))
    getUsers().then(r => setUsers(r.data))
  }, [id])

  async function handleStatus() {
    if (!note.trim()) { setError('A note is required to change status'); return }
    setError('')
    await changeStatus(id, note)
    setNote('')
    const r = await getIncident(id)
    setIncident(r.data)
  }

  async function handleAssign() {
    if (!assignTo) return
    await assignIncident(id, parseInt(assignTo))
    const r = await getIncident(id)
    setIncident(r.data)
  }

  if (!incident) return <p style={{padding:'2rem', color:'#888'}}>Loading...</p>

  const nextLabel = NEXT_LABEL[incident.status]

  return (
    <div style={styles.page}>
      <button style={styles.back} onClick={onBack}>← Back to list</button>

      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <span style={styles.id}>#{incident.id}</span>
            <span style={styles.type}>{incident.type}</span>
          </div>
          <span style={{...styles.statusBadge, background: STATUS_COLOR[incident.status]+'22', color: STATUS_COLOR[incident.status]}}>
            {incident.status}
          </span>
        </div>

        <p style={styles.desc}>{incident.description}</p>

        <div style={styles.meta}>
          <div style={styles.metaRow}><span style={styles.label}>Severity</span><span>{incident.severity}</span></div>
          <div style={styles.metaRow}><span style={styles.label}>Raised by</span><span>{incident.raised_by}</span></div>
          <div style={styles.metaRow}><span style={styles.label}>Assigned to</span><span>{incident.assigned_to || '—'}</span></div>
          <div style={styles.metaRow}><span style={styles.label}>Vehicle</span><span>{incident.vehicle_reg || '—'}</span></div>
          <div style={styles.metaRow}><span style={styles.label}>Created</span><span>{new Date(incident.created_at).toLocaleString('en-IN', {timeZone:'Asia/Kolkata'})}</span></div>
          {incident.resolved_at && <div style={styles.metaRow}><span style={styles.label}>Resolved</span><span>{new Date(incident.resolved_at).toLocaleString('en-IN', {timeZone:'Asia/Kolkata'})}</span></div>}
        </div>
      </div>

      {/* Assign */}
      {incident.status !== 'closed' && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Assign to</h3>
          <div style={styles.row}>
            <select style={styles.input} value={assignTo} onChange={e => setAssignTo(e.target.value)}>
              <option value="">Select person</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </select>
            <button style={styles.btn} onClick={handleAssign}>Assign</button>
          </div>
        </div>
      )}

      {/* Status change */}
      {nextLabel && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Move to next status</h3>
          {error && <p style={styles.error}>{error}</p>}
          <textarea
            style={styles.textarea}
            placeholder="Add a note (required)"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
          <button style={styles.btn} onClick={handleStatus}>{nextLabel}</button>
        </div>
      )}

      {/* Timeline */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Timeline</h3>
        {incident.events.map((e, idx) => (
          <div key={idx} style={styles.event}>
            <div style={styles.eventDot} />
            <div>
              <p style={styles.eventText}>
                <strong>{e.actor}</strong> → <span style={{color: STATUS_COLOR[e.to_status]}}>{e.to_status}</span>
              </p>
              <p style={styles.eventNote}>{e.note}</p>
              <p style={styles.eventTime}>{new Date(e.ts).toLocaleString('en-IN', {timeZone:'Asia/Kolkata'})}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  page:        { padding:'1.5rem', maxWidth:'700px' },
  back:        { background:'none', border:'none', color:'#2563eb', cursor:'pointer', fontSize:'14px', marginBottom:'1rem' },
  card:        { background:'white', border:'1px solid #eee', borderRadius:'8px', padding:'1.5rem', marginBottom:'1rem' },
  cardTitle:   { fontSize:'15px', fontWeight:'600', marginBottom:'1rem' },
  header:      { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' },
  id:          { fontSize:'12px', color:'#888', marginRight:'10px' },
  type:        { fontSize:'16px', fontWeight:'600', textTransform:'capitalize' },
  statusBadge: { padding:'4px 12px', borderRadius:'4px', fontSize:'13px', fontWeight:'500' },
  desc:        { fontSize:'14px', color:'#444', marginBottom:'16px', lineHeight:'1.5' },
  meta:        { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' },
  metaRow:     { display:'flex', flexDirection:'column', gap:'2px' },
  label:       { fontSize:'11px', color:'#aaa', textTransform:'uppercase' },
  row:         { display:'flex', gap:'8px' },
  input:       { flex:1, padding:'8px', border:'1px solid #ddd', borderRadius:'4px', fontSize:'14px' },
  btn:         { padding:'8px 16px', background:'#2563eb', color:'white', border:'none', borderRadius:'4px', fontSize:'14px', cursor:'pointer' },
  error:       { color:'#dc2626', fontSize:'13px', background:'#fef2f2', padding:'8px', borderRadius:'4px', marginBottom:'8px' },
  textarea:    { width:'100%', height:'80px', padding:'8px', border:'1px solid #ddd', borderRadius:'4px', fontSize:'14px', marginBottom:'8px', boxSizing:'border-box' },
  event:       { display:'flex', gap:'12px', marginBottom:'16px' },
  eventDot:    { width:'10px', height:'10px', borderRadius:'50%', background:'#2563eb', marginTop:'4px', flexShrink:0 },
  eventText:   { fontSize:'14px', margin:0 },
  eventNote:   { fontSize:'13px', color:'#555', margin:'2px 0' },
  eventTime:   { fontSize:'11px', color:'#aaa', margin:0 }
}
