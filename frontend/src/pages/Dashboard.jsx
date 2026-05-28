import { useState } from 'react'
import NoticesAdmin from './NoticesAdmin'
import NoticesDriver from './NoticesDriver'
import Scheduling from './Scheduling'
import DutyDriver from './DutyDriver'

export default function Dashboard({ user, onLogout }) {
  const isDriver = user.role === 'driver'

  // Default page depends on role
  const [page, setPage] = useState(isDriver ? 'duty' : 'notices')

  function NavBtn({ name, label }) {
    return (
      <button
        style={page === name ? styles.navActive : styles.navBtn}
        onClick={() => setPage(name)}
      >
        {label}
      </button>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.navbar}>
        <span style={styles.brand}>NCRTC BMS</span>
        <div style={styles.navLinks}>
          {isDriver ? (
            <>
              <NavBtn name="duty"    label="My Duty" />
              <NavBtn name="notices" label="Notices" />
            </>
          ) : (
            <>
              <NavBtn name="notices"    label="Notices" />
              <NavBtn name="scheduling" label="Scheduling" />
            </>
          )}
        </div>
        <div style={styles.right}>
          <span style={styles.role}>{user.role}</span>
          <button style={styles.logout} onClick={onLogout}>Logout</button>
        </div>
      </div>

      <div style={styles.content}>
        {page === 'notices'    && !isDriver && <NoticesAdmin />}
        {page === 'notices'    &&  isDriver && <NoticesDriver />}
        {page === 'scheduling' && !isDriver && <Scheduling />}
        {page === 'duty'       &&  isDriver && <DutyDriver />}
      </div>
    </div>
  )
}

const styles = {
  page:      { minHeight:'100vh', background:'#f5f5f5' },
  navbar:    { background:'white', padding:'0 2rem', height:'56px', display:'flex', alignItems:'center', gap:'1rem', borderBottom:'1px solid #eee' },
  brand:     { fontWeight:'600', fontSize:'16px', marginRight:'1rem' },
  navLinks:  { display:'flex', gap:'4px', flex:1 },
  navBtn:    { padding:'6px 14px', border:'none', borderRadius:'4px', background:'transparent', fontSize:'14px', color:'#555', cursor:'pointer' },
  navActive: { padding:'6px 14px', border:'none', borderRadius:'4px', background:'#eff6ff', fontSize:'14px', color:'#2563eb', cursor:'pointer' },
  right:     { display:'flex', alignItems:'center', gap:'10px' },
  role:      { background:'#e0e7ff', color:'#3730a3', padding:'2px 8px', borderRadius:'4px', fontSize:'12px' },
  logout:    { padding:'6px 14px', border:'1px solid #ddd', borderRadius:'4px', background:'white', fontSize:'13px', cursor:'pointer' }
}
