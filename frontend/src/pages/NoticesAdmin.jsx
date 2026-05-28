import { useEffect, useState } from 'react'
import { getNotices, createNotice, getReceipts } from '../api/cms'

export default function NoticesAdmin() {
  const [notices, setNotices]       = useState([])
  const [title, setTitle]           = useState('')
  const [body, setBody]             = useState('')
  const [audience, setAudience]     = useState('all')
  const [error, setError]           = useState('')
  const [receipts, setReceipts]     = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  // Load notices when page opens
  useEffect(() => { loadNotices() }, [])

  async function loadNotices() {
    const res = await getNotices()
    setNotices(res.data)
  }

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    try {
      await createNotice({ title, body, audience })
      setTitle('')
      setBody('')
      loadNotices()
    } catch (err) {
      setError('Failed to create notice')
    }
  }

  async function handleViewReceipts(noticeId) {
    const res = await getReceipts(noticeId)
    setReceipts(res.data)
    setSelectedId(noticeId)
  }

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>Notices</h2>

      {/* Create form */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Create Notice</h3>
        <form onSubmit={handleCreate}>
          <div style={styles.field}>
            <label>Title</label>
            <input style={styles.input} value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div style={styles.field}>
            <label>Body</label>
            <textarea style={styles.textarea} value={body} onChange={e => setBody(e.target.value)} required />
          </div>
          <div style={styles.field}>
            <label>Audience</label>
            <select style={styles.input} value={audience} onChange={e => setAudience(e.target.value)}>
              <option value="all">All</option>
              <option value="driver">Drivers only</option>
            </select>
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.btn}>Publish Notice</button>
        </form>
      </div>

      {/* Notices list */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>All Notices</h3>
        {notices.length === 0 && <p style={styles.empty}>No notices yet.</p>}
        {notices.map(n => (
          <div key={n.id} style={styles.noticeRow}>
            <div>
              <p style={styles.noticeTitle}>{n.title}</p>
              <p style={styles.noticeBody}>{n.body}</p>
              <p style={styles.noticeMeta}>Audience: {n.audience}</p>
            </div>
            <button style={styles.linkBtn} onClick={() => handleViewReceipts(n.id)}>
              View receipts
            </button>
          </div>
        ))}
      </div>

      {/* Read receipts */}
      {receipts && selectedId && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Read Receipts</h3>
          <p style={styles.noticeMeta}>Read by {receipts.read.length} · Unread by {receipts.unread.length}</p>
          {receipts.unread.length > 0 && (
            <div style={{marginTop:'8px'}}>
              <p style={styles.label}>Not yet read:</p>
              {receipts.unread.map(u => (
                <span key={u.id} style={styles.badge}>{u.full_name}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  page:        { padding:'2rem', maxWidth:'700px' },
  heading:     { fontSize:'20px', marginBottom:'1.5rem' },
  card:        { background:'white', border:'1px solid #eee', borderRadius:'8px', padding:'1.5rem', marginBottom:'1rem' },
  cardTitle:   { fontSize:'15px', fontWeight:'600', marginBottom:'1rem' },
  field:       { marginBottom:'12px', display:'flex', flexDirection:'column', gap:'4px' },
  input:       { padding:'8px', border:'1px solid #ddd', borderRadius:'4px', fontSize:'14px' },
  textarea:    { padding:'8px', border:'1px solid #ddd', borderRadius:'4px', fontSize:'14px', minHeight:'80px', resize:'vertical' },
  btn:         { padding:'8px 20px', background:'#2563eb', color:'white', border:'none', borderRadius:'4px', fontSize:'14px' },
  error:       { color:'red', fontSize:'13px', marginBottom:'8px' },
  noticeRow:   { display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'12px 0', borderBottom:'1px solid #f0f0f0' },
  noticeTitle: { fontWeight:'500', fontSize:'14px' },
  noticeBody:  { fontSize:'13px', color:'#666', marginTop:'2px' },
  noticeMeta:  { fontSize:'12px', color:'#aaa', marginTop:'4px' },
  linkBtn:     { fontSize:'13px', color:'#2563eb', background:'none', border:'none', cursor:'pointer', whiteSpace:'nowrap' },
  empty:       { fontSize:'14px', color:'#aaa' },
  label:       { fontSize:'13px', color:'#666', marginBottom:'6px' },
  badge:       { display:'inline-block', background:'#fee2e2', color:'#991b1b', fontSize:'12px', padding:'2px 8px', borderRadius:'4px', marginRight:'6px', marginBottom:'4px' }
}
