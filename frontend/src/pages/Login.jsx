import { useState } from 'react'
import axios from 'axios'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Step 1: get the token
      const params = new URLSearchParams()
      params.append('username', username)
      params.append('password', password)

      const res = await axios.post('http://localhost:8000/api/v1/auth/login', params)
      const token = res.data.access_token

      // Step 2: get the user info
      const meRes = await axios.get('http://localhost:8000/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })

      onLogin(token, meRes.data)
    } catch (err) {
      setError('Wrong username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>NCRTC BMS</h2>
        <p style={styles.sub}>Bus Management System</p>

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label>Username</label>
            <input
              style={styles.input}
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. admin"
              required
            />
          </div>
          <div style={styles.field}>
            <label>Password</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="password"
              required
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.btn} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p style={styles.hint}>
          Try: admin / admin123 &nbsp;·&nbsp; driver1 / driver123
        </p>
      </div>
    </div>
  )
}

const styles = {
  page:  { display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh' },
  card:  { background:'white', padding:'2rem', borderRadius:'8px', width:'340px', boxShadow:'0 2px 8px rgba(0,0,0,0.1)' },
  title: { fontSize:'22px', marginBottom:'4px' },
  sub:   { color:'#888', fontSize:'13px', marginBottom:'1.5rem' },
  field: { marginBottom:'1rem', display:'flex', flexDirection:'column', gap:'4px' },
  input: { padding:'8px', border:'1px solid #ddd', borderRadius:'4px', fontSize:'14px' },
  error: { color:'red', fontSize:'13px', marginBottom:'8px' },
  btn:   { width:'100%', padding:'10px', background:'#2563eb', color:'white', border:'none', borderRadius:'4px', fontSize:'15px' },
  hint:  { marginTop:'1rem', fontSize:'12px', color:'#aaa', textAlign:'center' }
}
