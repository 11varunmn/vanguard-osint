import { useState, ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

interface LayoutProps {
  children: ReactNode
  onLogout: () => void
}

const NAV = [
  { path: '/dashboard',  icon: '⬡', label: 'Dashboard',      badge: '3',    badgeColor: 'text-accent' },
  { path: '/stylometry', icon: '≋', label: 'Stylometry',     badge: '87%',  badgeColor: 'text-accent3' },
  { path: '/graph',      icon: '◈', label: 'Graph Explorer', badge: null,   badgeColor: '' },
  { path: '/evidence',   icon: '◎', label: 'Evidence Vault', badge: '12',   badgeColor: 'text-accent' },
  { path: '/report',     icon: '▦', label: 'Reports',        badge: null,   badgeColor: '' },
]

export default function Layout({ children, onLogout }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [showNewCase, setShowNewCase] = useState(false)
  const [caseTitle, setCaseTitle] = useState('')

  const active = location.pathname

  return (
    <div style={{ display: 'grid', gridTemplateRows: '52px 1fr', gridTemplateColumns: '220px 1fr 290px', height: '100vh' }}>

      {/* ── TOPBAR ── */}
      <div style={{ gridColumn: '1/-1' }} className="flex items-center gap-0 border-b border-border bg-bg2 px-5">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-8">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" fill="none" stroke="#00d4ff" strokeWidth="1.5"/>
            <polygon points="14,6 22,10 22,18 14,22 6,18 6,10" fill="rgba(0,212,255,0.08)" stroke="#00d4ff" strokeWidth="0.8"/>
            <circle cx="14" cy="14" r="3" fill="#00d4ff"/>
            <line x1="14" y1="6" x2="14" y2="22" stroke="#00d4ff" strokeWidth="0.5" strokeDasharray="2,2"/>
            <line x1="6" y1="10" x2="22" y2="18" stroke="#00d4ff" strokeWidth="0.5" strokeDasharray="2,2"/>
            <line x1="22" y1="10" x2="6" y2="18" stroke="#00d4ff" strokeWidth="0.5" strokeDasharray="2,2"/>
          </svg>
          <div>
            <div className="font-extrabold text-accent tracking-widest uppercase text-sm">Vanguard</div>
            <div className="font-mono text-muted text-[9px] tracking-widest uppercase">OSINT Platform v0.9</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-1">
          {NAV.map(n => (
            <button key={n.path}
              onClick={() => navigate(n.path)}
              className={`flex items-center gap-2 px-4 h-[52px] text-xs tracking-widest uppercase font-semibold border-b-2 transition-all ${
                active === n.path
                  ? 'text-accent border-accent'
                  : 'text-muted border-transparent hover:text-text'
              }`}>
              <span>{n.icon}</span>{n.label}
            </button>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center gap-3 ml-auto">
          <span className="w-2 h-2 rounded-full bg-accent3 animate-pulse-slow" style={{ boxShadow: '0 0 6px #10b981' }}></span>
          <span className="font-mono text-muted text-[10px]">LIVE</span>
          <span className="bg-accent/10 border border-accent/20 rounded px-2 py-1 font-mono text-accent text-[11px]">CASE-2024-0047</span>
          <button onClick={() => setShowNewCase(true)}
            className="border border-accent text-accent bg-accent/10 px-3 py-1 rounded text-[11px] font-semibold tracking-wide hover:bg-accent/20 transition-all">
            + New Case
          </button>
          <button onClick={onLogout}
            className="border border-border text-muted px-3 py-1 rounded text-[11px] hover:border-danger hover:text-danger transition-all">
            Logout
          </button>
        </div>
      </div>

      {/* ── LEFT SIDEBAR ── */}
      <div className="bg-bg2 border-r border-border overflow-y-auto py-4">
        <div className="mb-5">
          <div className="font-mono text-muted text-[9px] tracking-widest uppercase px-4 mb-2">Workspace</div>
          {NAV.map(n => (
            <button key={n.path} onClick={() => navigate(n.path)}
              className={`w-full flex items-center gap-2 px-4 py-2 text-xs tracking-wide transition-all relative ${
                active === n.path
                  ? 'bg-accent/5 text-accent'
                  : 'text-muted hover:bg-white/[0.02] hover:text-text'
              }`}>
              {active === n.path && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent"></span>}
              <span className="text-sm w-5">{n.icon}</span>
              <span>{n.label}</span>
              {n.badge && (
                <span className={`ml-auto font-mono text-[10px] bg-accent/10 px-1.5 py-0.5 rounded ${n.badgeColor}`}>
                  {n.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Subjects */}
        <div className="mb-5">
          <div className="font-mono text-muted text-[9px] tracking-widest uppercase px-4 mb-2">Subjects</div>
          {[
            { init: 'AX', name: '@anon_x7',      plat: 'Twitter · Reddit',    score: '0.87', color: '#ef4444' },
            { init: 'VK', name: 'vk_user_4421',  plat: 'VKontakte · Telegram', score: '0.74', color: '#f59e0b' },
            { init: 'DB', name: 'darkbyte_99',   plat: '4chan · Discord',      score: '0.61', color: '#7c3aed' },
            { init: 'RD', name: 'r_diaz_public', plat: 'LinkedIn · GitHub',   score: '0.42', color: '#10b981' },
          ].map(s => (
            <div key={s.name} className="flex items-center gap-2 mx-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-white/[0.03] transition-all">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                style={{ background: s.color + '22', color: s.color }}>
                {s.init}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-text truncate">{s.name}</div>
                <div className="font-mono text-[10px] text-muted truncate">{s.plat}</div>
              </div>
              <div className="font-mono text-[11px] font-bold" style={{ color: s.color }}>{s.score}</div>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="px-4">
          <div className="font-mono text-muted text-[9px] tracking-widest uppercase mb-3">Analysis Status</div>
          {[
            { label: 'Ingestion',     pct: 100, color: '#10b981' },
            { label: 'Stylometry',    pct: 87,  color: '#f59e0b' },
            { label: 'Graph Build',   pct: 63,  color: '#00d4ff' },
            { label: 'Evidence Lock', pct: 45,  color: '#7c3aed' },
          ].map(p => (
            <div key={p.label} className="mb-2">
              <div className="flex justify-between mb-1">
                <span className="font-mono text-[10px] text-muted">{p.label}</span>
                <span className="font-mono text-[10px]" style={{ color: p.color }}>{p.pct}%</span>
              </div>
              <div className="h-[3px] bg-bg3 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${p.pct}%`, background: p.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MAIN ── */}
      <div className="overflow-hidden flex flex-col bg-bg">
        {children}
      </div>

      {/* ── RIGHT PANEL ── */}
      <RightPanel />

      {/* ── NEW CASE MODAL ── */}
      {showNewCase && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={(e) => e.target === e.currentTarget && setShowNewCase(false)}>
          <div className="bg-bg2 border border-border2 rounded-xl p-7 w-[440px]">
            <div className="text-base font-bold mb-1">Create New Case</div>
            <div className="text-xs text-muted mb-5">All data will be evidence-sealed from creation.</div>
            <div className="mb-3">
              <label className="font-mono text-[10px] uppercase tracking-widest text-muted block mb-1">Case Title</label>
              <input value={caseTitle} onChange={e => setCaseTitle(e.target.value)}
                placeholder="e.g. Operation Ghost Trace"
                className="w-full bg-bg3 border border-border rounded-md text-text font-mono text-xs px-3 py-2 outline-none focus:border-accent transition-all" />
            </div>
            <div className="mb-3">
              <label className="font-mono text-[10px] uppercase tracking-widest text-muted block mb-1">Case ID</label>
              <input readOnly value="CASE-2024-0048"
                className="w-full bg-bg3 border border-border rounded-md font-mono text-xs px-3 py-2 text-accent outline-none" />
            </div>
            <div className="mb-4">
              <label className="font-mono text-[10px] uppercase tracking-widest text-muted block mb-1">Classification</label>
              <select className="w-full bg-bg3 border border-border rounded-md text-text font-mono text-xs px-3 py-2 outline-none focus:border-accent">
                <option>RESTRICTED</option>
                <option>CONFIDENTIAL</option>
                <option>UNCLASSIFIED</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowNewCase(false)}
                className="border border-border text-muted px-4 py-2 rounded text-xs hover:border-border2 transition-all">Cancel</button>
              <button onClick={() => setShowNewCase(false)}
                className="bg-accent/10 border border-accent text-accent px-4 py-2 rounded text-xs font-semibold hover:bg-accent/20 transition-all">
                Create Case ▸
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RightPanel() {
  const [auditLog] = useState([
    { color: '#ef4444', time: '02:14:33', msg: 'MATCH_FLAGGED · 0.87' },
    { color: '#00d4ff', time: '02:14:31', msg: 'STYLO_RUN_COMPLETE' },
    { color: '#7c3aed', time: '02:13:58', msg: 'GRAPH_CLUSTER_FOUND' },
    { color: '#10b981', time: '02:11:12', msg: 'VAULT_SEALED · 47 items' },
    { color: '#f59e0b', time: '02:11:08', msg: 'SHA256_COMPUTED' },
    { color: '#64748b', time: '01:58:44', msg: 'INGEST_COMPLETE · 4 src' },
    { color: '#64748b', time: '01:30:00', msg: 'CASE_OPENED' },
  ])

  return (
    <div className="bg-bg2 border-l border-border overflow-y-auto p-4">
      {/* Audit Log */}
      <div className="mb-5">
        <div className="font-mono text-[9px] uppercase tracking-widest text-muted mb-3">Live Audit Log</div>
        <div className="space-y-1.5">
          {auditLog.map((e, i) => (
            <div key={i} className="flex items-start gap-2 font-mono text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0" style={{ background: e.color, boxShadow: `0 0 4px ${e.color}` }}></span>
              <span className="text-muted whitespace-nowrap">{e.time}</span>
              <span style={{ color: i === 0 ? e.color : undefined }} className={i > 0 ? 'text-text' : ''}>{e.msg}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Entity */}
      <div className="mb-5">
        <div className="font-mono text-[9px] uppercase tracking-widest text-muted mb-3">Selected Entity</div>
        <div className="bg-panel border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.3)', color: '#ef4444' }}>AX</div>
            <div>
              <div className="text-sm font-bold">@anon_x7</div>
              <div className="font-mono text-[10px] text-muted">Subject of Interest</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1 font-mono text-[10px]">
            {[
              ['Platforms', 'Twitter, Reddit'],
              ['Artifacts', '47 sealed'],
              ['Tokens', '2,341'],
              ['Top match', '87% · darkbyte'],
              ['First seen', '2024-03-14'],
              ['Risk level', 'HIGH'],
            ].map(([k, v]) => (
              <>
                <span key={k} className="text-muted">{k}</span>
                <span key={v} className={v === 'HIGH' ? 'text-danger' : v === '47 sealed' ? 'text-accent' : 'text-text'}>{v}</span>
              </>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Evidence */}
      <div>
        <div className="font-mono text-[9px] uppercase tracking-widest text-muted mb-3">Recent Evidence</div>
        {[
          { name: 'anon_x7_posts_001.json', hash: 'a3f8c2d1e4b5f6a7...', time: '02:11:12 UTC', color: '#00d4ff' },
          { name: 'stylo_run_0047.json',    hash: '7d2e9f4a1b8c5d3e...', time: '02:14:31 UTC', color: '#f59e0b' },
          { name: 'graph_snapshot_001.json',hash: '2b4d6f8a0c2e4f1b...', time: '02:13:58 UTC', color: '#7c3aed' },
        ].map(ev => (
          <div key={ev.name} className="bg-panel border border-border rounded-md p-2.5 mb-2">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ev.color }}></span>
              <span className="text-[11px] font-semibold truncate">{ev.name}</span>
            </div>
            <div className="font-mono text-[9px] text-muted mb-1 break-all">{ev.hash}</div>
            <div className="font-mono text-[9px] text-accent3">✓ Verified · {ev.time}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
