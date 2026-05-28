import { useState } from 'react'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'

function App() {
  // Check if user is already logged in (token saved in localStorage)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'))

  // Called after successful login
  function handleLogin(token, user) {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setToken(token)
    setUser(user)
  }

  // Called on logout
  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  // If not logged in, show login page. Otherwise show dashboard.
  if (!token) return <Login onLogin={handleLogin} />
  return <Dashboard user={user} onLogout={handleLogout} />
}

export default App
