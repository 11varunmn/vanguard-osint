import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import LoginPage from './views/LoginPage'
import DashboardView from './views/DashboardView'
import StylometryView from './views/StylometryView'
import GraphView from './views/GraphView'
import EvidenceView from './views/EvidenceView'
import ReportView from './views/ReportView'

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('vanguard_token'))

  if (!token) {
    return <LoginPage onLogin={(t) => setToken(t)} />
  }

  return (
    <BrowserRouter>
      <Layout onLogout={() => { localStorage.removeItem('vanguard_token'); setToken(null) }}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardView />} />
          <Route path="/stylometry" element={<StylometryView />} />
          <Route path="/graph" element={<GraphView />} />
          <Route path="/evidence" element={<EvidenceView />} />
          <Route path="/report" element={<ReportView />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
