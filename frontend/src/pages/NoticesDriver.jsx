import { useEffect, useState } from 'react'
import { getNotices, markRead } from '../api/cms'

export default function NoticesDriver() {
  const [notices, setNotices] = useState([])

  useEffect(() => { loadNotices() }, [])

  async function loadNotices() {
    const res = await getNotices()
    setNotices(res.data)
  }

  async function handleRead(noticeId) {
    await markRead(noticeId)
    loadNotices()
  }

  const unread = notices.filter(n => !n.is_read)
  const read   = notices.filter(n => n.is_read)

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>Notices</h2>

      {unread.length === 0 && <p style={styles.allRead}>All caught up — no unread notices.</p>}

      {unread.map(n => (
        <div key={n.id} style={styles.unreadCard}>
          <div style={styles.unreadDot} />
          <div style={{flex:1}}>
            <p style={styles.title}>{n.title}</p>
            <p style={styles.body}>{n.body}</p>
          </div>
          <button style={styles.readBtn} onClick={() => handleRead(n.id)}>
            Mark read
          </button>
        </div>
      ))}

      {read.length > 0 && (
        <>
          <p style={styles.sectionLabel}>Already read</p>
          {read.map(n => (
            <div key={n.id} style={styles.readCard}>
              <p style={styles.title}>{n.title}</p>
              <p style={styles.body}>{n.body}</p>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

const styles = {
  page:         { padding:'1.5rem', maxWidth:'500px' },
  heading:      { fontSize:'18px', marginBottom:'1rem' },
  allRead:      { color:'#16a34a', fontSize:'14px', padding:'1rem', background:'#f0fdf4', borderRadius:'6px' },
  unreadCard:   { display:'flex', alignItems:'flex-start', gap:'10px', background:'white', border:'1px solid #bfdbfe', borderRadius:'8px', padding:'1rem', marginBottom:'10px' },
  unreadDot:    { width:'8px', height:'8px', borderRadius:'50%', background:'#2563eb', marginTop:'5px', flexShrink:0 },
  title:        { fontWeight:'500', fontSize:'14px' },
  body:         { fontSize:'13px', color:'#555', marginTop:'3px' },
  readBtn:      { fontSize:'12px', padding:'4px 10px', background:'#eff6ff', color:'#2563eb', border:'1px solid #bfdbfe', borderRadius:'4px', whiteSpace:'nowrap' },
  sectionLabel: { fontSize:'12px', color:'#aaa', margin:'1rem 0 8px' },
  readCard:     { background:'#fafafa', border:'1px solid #eee', borderRadius:'8px', padding:'1rem', marginBottom:'8px', opacity:0.7 }
}
