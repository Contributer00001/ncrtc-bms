import NoticesAdmin from './NoticesAdmin'
import NoticesDriver from './NoticesDriver'

export default function Dashboard({ user, onLogout }) {
  // Decide which notices page to show based on role
  const isDriver = user.role === 'driver'

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
        {isDriver ? <NoticesDriver /> : <NoticesAdmin />}
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
  content:  { padding:'2rem' }
}
