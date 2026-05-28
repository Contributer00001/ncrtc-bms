import { useEffect, useState } from 'react'
import { getMyDuty, ackDuty } from '../api/scheduling'

export default function DutyDriver() {
  const [duty,    setDuty]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadDuty() }, [])

  async function loadDuty() {
    const res = await getMyDuty()
    setDuty(res.data)
    setLoading(false)
  }

  async function handleAck() {
    await ackDuty(duty.id)
    loadDuty()
  }

  if (loading) return <p style={{padding:'2rem', color:'#888'}}>Loading...</p>

  if (!duty) return (
    <div style={styles.page}>
      <h2 style={styles.heading}>Today's Duty</h2>
      <p style={styles.empty}>No duty assigned for today.</p>
    </div>
  )

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>Today's Duty</h2>
      <div style={styles.card}>
        <div style={styles.row}><span style={styles.label}>Route</span><span style={styles.value}>{duty.route_name}</span></div>
        <div style={styles.row}><span style={styles.label}>Vehicle</span><span style={styles.value}>{duty.vehicle_reg}</span></div>
        <div style={styles.row}><span style={styles.label}>Start</span><span style={styles.value}>{duty.start_time}</span></div>
        <div style={styles.row}><span style={styles.label}>End</span><span style={styles.value}>{duty.end_time}</span></div>
        <div style={styles.row}>
          <span style={styles.label}>Status</span>
          <span style={duty.ack_at ? styles.acked : styles.pending}>
            {duty.ack_at ? '✓ Acknowledged' : 'Pending acknowledgement'}
          </span>
        </div>
        {!duty.ack_at && (
          <button style={styles.ackBtn} onClick={handleAck}>Acknowledge Duty</button>
        )}
      </div>
    </div>
  )
}

const styles = {
  page:    { padding:'1.5rem', maxWidth:'400px' },
  heading: { fontSize:'18px', marginBottom:'1rem' },
  card:    { background:'white', border:'1px solid #eee', borderRadius:'8px', padding:'1.5rem' },
  row:     { display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #f5f5f5' },
  label:   { fontSize:'13px', color:'#888' },
  value:   { fontSize:'14px', fontWeight:'500' },
  acked:   { fontSize:'13px', color:'#16a34a' },
  pending: { fontSize:'13px', color:'#d97706' },
  ackBtn:  { marginTop:'1rem', width:'100%', padding:'10px', background:'#2563eb', color:'white', border:'none', borderRadius:'4px', fontSize:'15px' },
  empty:   { color:'#aaa', fontSize:'14px' }
}
