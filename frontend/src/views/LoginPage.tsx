import { useState } from 'react'
import { login } from '../lib/api'

export default function LoginPage({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState('analyst@vanguard.io')
  const [password, setPassword] = useState('demo1234')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await login(email, password)
      onLogin(data.access_token)
    } catch {
      // Demo mode — allow login without backend
      const fakeToken = btoa(JSON.stringify({ sub: 'demo', email }))
      localStorage.setItem('vanguard_token', fakeToken)
      onLogin(fakeToken)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen bg-bg flex items-center justify-center relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-20"
        style={{ backgroundImage: 'linear-gradient(rgba(0,212,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #00d4ff 0%, transparent 70%)' }} />

      <div className="relative z-10 w-[400px]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <svg width="56" height="56" viewBox="0 0 28 28" fill="none" className="mb-4">
            <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" fill="none" stroke="#00d4ff" strokeWidth="1.5"/>
            <polygon points="14,6 22,10 22,18 14,22 6,18 6,10" fill="rgba(0,212,255,0.08)" stroke="#00d4ff" strokeWidth="0.8"/>
            <circle cx="14" cy="14" r="3" fill="#00d4ff"/>
            <line x1="14" y1="6" x2="14" y2="22" stroke="#00d4ff" strokeWidth="0.5" strokeDasharray="2,2"/>
            <line x1="6" y1="10" x2="22" y2="18" stroke="#00d4ff" strokeWidth="0.5" strokeDasharray="2,2"/>
            <line x1="22" y1="10" x2="6" y2="18" stroke="#00d4ff" strokeWidth="0.5" strokeDasharray="2,2"/>
          </svg>
          <h1 className="text-2xl font-extrabold text-accent tracking-widest uppercase">Vanguard</h1>
          <p className="font-mono text-muted text-xs tracking-widest mt-1">OSINT PLATFORM · RESTRICTED ACCESS</p>
        </div>

        {/* Card */}
        <div className="bg-bg2 border border-border rounded-xl p-8">
          <div className="text-sm font-bold mb-1">Analyst Login</div>
          <div className="font-mono text-[10px] text-muted mb-6">All sessions are logged and audited.</div>

          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger text-xs font-mono rounded-md px-3 py-2 mb-4">{error}</div>
          )}

          <div className="mb-4">
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted block mb-1.5">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-bg3 border border-border rounded-md text-text font-mono text-xs px-3 py-2.5 outline-none focus:border-accent transition-all"
              placeholder="analyst@domain.com" />
          </div>

          <div className="mb-6">
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted block mb-1.5">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full bg-bg3 border border-border rounded-md text-text font-mono text-xs px-3 py-2.5 outline-none focus:border-accent transition-all"
              placeholder="••••••••" />
          </div>

          <button onClick={handleLogin} disabled={loading}
            className="w-full py-2.5 bg-accent/10 border border-accent text-accent font-bold text-xs tracking-widest uppercase rounded-md hover:bg-accent/20 transition-all disabled:opacity-50">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 border border-accent/30 border-t-accent rounded-full animate-spin"></span>
                Authenticating...
              </span>
            ) : 'Access Platform ▸'}
          </button>

          <div className="mt-4 text-center font-mono text-[10px] text-muted">
            Demo: any credentials work in prototype mode
          </div>
        </div>

        <div className="text-center font-mono text-[9px] text-muted mt-4 leading-relaxed">
          For lawful investigative use only.<br/>
          All access is logged and auditable.
        </div>
      </div>
    </div>
  )
}
