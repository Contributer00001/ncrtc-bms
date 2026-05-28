export default function Dashboard({ user, onLogout }) {
  return (
    <div style={styles.page}>
      <div style={styles.navbar}>
        <span style={styles.brand}>NCRTC BMS</span>
        <div style={styles.right}>
          <span style={styles.userinfo}>
            {user.full_name} &nbsp;·&nbsp;
            <span style={styles.role}>{user.role}</span>
          </span>
          <button style={styles.logout} onClick={onLogout}>Logout</button>
        </div>
      </div>

      <div style={styles.content}>
        <h2>Welcome, {user.full_name}</h2>
        <p style={styles.sub}>You are logged in as <strong>{user.role}</strong></p>

        <div style={styles.grid}>
          <div style={styles.card}>Notices (CMS) — coming next</div>
          <div style={styles.card}>Scheduling — coming soon</div>
          <div style={styles.card}>Live Map (AVLS) — coming soon</div>
          <div style={styles.card}>Incidents (IMS) — coming soon</div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page:     { minHeight:'100vh', background:'#f5f5f5' },
  navbar:   { background:'white', padding:'0 2rem', height:'56px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #eee' },
  brand:    { fontWeight:'600', fontSize:'16px' },
  right:    { display:'flex', alignItems:'center', gap:'1rem' },
  userinfo: { fontSize:'14px', color:'#555' },
  role:     { background:'#e0e7ff', color:'#3730a3', padding:'2px 8px', borderRadius:'4px', fontSize:'12px' },
  logout:   { padding:'6px 14px', border:'1px solid #ddd', borderRadius:'4px', background:'white', fontSize:'13px' },
  content:  { padding:'2rem' },
  sub:      { color:'#888', marginTop:'4px', marginBottom:'2rem' },
  grid:     { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1rem' },
  card:     { background:'white', padding:'1.5rem', borderRadius:'8px', border:'1px solid #eee', color:'#888', fontSize:'14px' }
}
