import { useEffect, useState } from 'react'
import { getMyDuty, ackDuty } from '../api/scheduling'
import { createIncident } from '../api/ims'

export default function DutyDriver() {
  const [duty,    setDuty]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [panic,   setPanic]   = useState(false)

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

  async function handlePanic() {
    await createIncident({
      type: 'breakdown',
      severity: 'P1',
      description: `PANIC: Driver triggered emergency. Vehicle: ${duty?.vehicle_reg || 'unknown'}`,
      vehicle_id: duty?.vehicle_id || null   // now passing the actual ID
    })
    setPanic(true)
  }

  if (loading) return <p style={{padding:'2rem', color:'#888'}}>Loading...</p>

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>Today's Duty</h2>

      {!duty ? (
        <p style={styles.empty}>No duty assigned for today.</p>
      ) : (
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
      )}

      <div style={styles.panicWrap}>
        {panic ? (
          <div style={styles.panicSent}>✓ Emergency alert sent. Help is on the way.</div>
        ) : (
          <button style={styles.panicBtn} onClick={handlePanic}>🚨 PANIC</button>
        )}
        <p style={styles.panicNote}>Tap only in an emergency. Creates a P1 incident immediately.</p>
      </div>
    </div>
  )
}

const styles = {
  page:      { padding:'1.5rem', maxWidth:'400px' },
  heading:   { fontSize:'18px', marginBottom:'1rem' },
  card:      { background:'white', border:'1px solid #eee', borderRadius:'8px', padding:'1.5rem', marginBottom:'1.5rem' },
  row:       { display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #f5f5f5' },
  label:     { fontSize:'13px', color:'#888' },
  value:     { fontSize:'14px', fontWeight:'500' },
  acked:     { fontSize:'13px', color:'#16a34a' },
  pending:   { fontSize:'13px', color:'#d97706' },
  ackBtn:    { marginTop:'1rem', width:'100%', padding:'10px', background:'#2563eb', color:'white', border:'none', borderRadius:'4px', fontSize:'15px', cursor:'pointer' },
  empty:     { color:'#aaa', fontSize:'14px', marginBottom:'1.5rem' },
  panicWrap: { textAlign:'center' },
  panicBtn:  { width:'100%', padding:'20px', background:'#dc2626', color:'white', border:'none', borderRadius:'8px', fontSize:'22px', fontWeight:'700', cursor:'pointer' },
  panicSent: { background:'#dcfce7', color:'#166534', padding:'16px', borderRadius:'8px', fontSize:'15px', fontWeight:'500' },
  panicNote: { fontSize:'12px', color:'#aaa', marginTop:'8px' }
}
