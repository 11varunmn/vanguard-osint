import { useState } from 'react'

const INITIAL_FEED = [
  { icon: '⚠', color: '#ef4444', sev: 'HIGH',  title: 'Stylometric match: @anon_x7 ↔ darkbyte_99 — 87% similarity', meta: 'Lexical density · Punctuation pattern · Sentence rhythm', time: '02:14 UTC' },
  { icon: '◈', color: '#7c3aed', sev: 'MED',   title: 'New cluster detected: 3-node ring around shared IP subnet',   meta: 'vk_user_4421, darkbyte_99 both interact with @nexus_relay',  time: '01:58 UTC' },
  { icon: '◎', color: '#00d4ff', sev: 'VAULT', title: '47 posts archived from @anon_x7 — evidence sealed',           meta: 'SHA-256: a3f8c2d1... · UTC 2024-11-07T02:11:34Z',            time: '02:11 UTC' },
  { icon: '✓', color: '#10b981', sev: 'LOW',   title: 'r_diaz_public — insufficient linguistic data for comparison',  meta: 'Minimum 500 tokens required. Current: 312 tokens.',           time: '01:45 UTC' },
  { icon: '⬡', color: '#f59e0b', sev: 'MED',   title: 'Shared hashtag cluster: #op_ghost used across 3 platforms',  meta: 'Twitter, Telegram, 4chan — temporal correlation: 3-min window', time: '01:30 UTC' },
]

const FEED_POOL = [
  { icon: '◎', color: '#00d4ff', sev: 'VAULT', title: 'New artifact ingested from Telegram export', meta: 'SHA-256 computed · 1 item sealed' },
  { icon: '≋', color: '#7c3aed', sev: 'MED',   title: 'Stylometry re-run triggered by new sample', meta: 'Comparison queued · ETA 2s' },
  { icon: '⚠', color: '#ef4444', sev: 'HIGH',  title: 'Cross-platform alias match detected',        meta: '@anon_x7 ↔ new_handle_889 · 0.79 score' },
  { icon: '⬡', color: '#f59e0b', sev: 'MED',   title: 'Graph updated: new edge added',              meta: 'darkbyte_99 → @nexus_relay via shared hashtag' },
]

const SEV_COLORS: Record<string, string> = {
  HIGH: 'bg-danger/15 text-danger', MED: 'bg-amber-500/15 text-amber-400',
  LOW: 'bg-accent3/15 text-accent3', VAULT: 'bg-accent/10 text-accent', INFO: 'bg-accent/10 text-accent',
}

const TIMELINE = [
  { color: '#ef4444', ts: '2024-11-07 · 02:14 UTC', text: 'Stylometry engine flagged high-confidence identity overlap between @anon_x7 and darkbyte_99' },
  { color: '#7c3aed', ts: '2024-11-07 · 02:11 UTC', text: '47 Twitter posts archived to evidence vault with SHA-256 integrity seals' },
  { color: '#00d4ff', ts: '2024-11-07 · 01:58 UTC', text: 'Graph analysis identified 3-node cluster with temporal correlation across platforms' },
  { color: '#10b981', ts: '2024-11-07 · 01:30 UTC', text: 'Case CASE-2024-0047 opened. Initial data ingestion from 4 source accounts.' },
]

export default function DashboardView() {
  const [feed, setFeed] = useState(INITIAL_FEED)
  const [poolIdx, setPoolIdx] = useState(0)

  const addItem = () => {
    const item = FEED_POOL[poolIdx % FEED_POOL.length]
    const now = new Date()
    const ts = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')} UTC`
    setFeed(f => [{ ...item, time: ts }, ...f])
    setPoolIdx(i => i + 1)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Metrics */}
      <div className="grid grid-cols-4 gap-3 p-5 flex-shrink-0">
        {[
          { value: '1,247', label: 'Artifacts Ingested',  change: '↑ 143 in last session', changeColor: 'text-accent3', accent: '#00d4ff' },
          { value: '87%',   label: 'Max Similarity Score',change: '⚠ High confidence match', changeColor: 'text-amber-400', accent: '#7c3aed' },
          { value: '4',     label: 'Linked Identities',   change: '↑ 1 new cluster found',  changeColor: 'text-accent3', accent: '#10b981' },
          { value: '12',    label: 'Signed Evidence Items',change: 'SHA-256 verified',       changeColor: 'text-accent3', accent: '#f59e0b' },
        ].map(m => (
          <div key={m.label} className="bg-panel border border-border rounded-lg p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5"
              style={{ background: `linear-gradient(90deg, transparent, ${m.accent}, transparent)` }} />
            <div className="text-3xl font-extrabold font-mono mb-0.5" style={{ color: m.accent }}>{m.value}</div>
            <div className="text-[10px] text-muted uppercase tracking-widest">{m.label}</div>
            <div className={`text-[10px] font-mono mt-1.5 ${m.changeColor}`}>{m.change}</div>
          </div>
        ))}
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-5 pb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Intelligence Feed — CASE-2024-0047</span>
          <button onClick={addItem}
            className="border border-border text-muted px-3 py-1 rounded text-[11px] hover:border-border2 hover:text-text transition-all">
            Simulate Import
          </button>
        </div>

        <div className="space-y-2 mb-6">
          {feed.map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-panel border border-border rounded-md cursor-pointer hover:border-border2 hover:bg-white/[0.01] transition-all animate-fadeIn">
              <div className="w-8 h-8 rounded-md flex items-center justify-center text-sm flex-shrink-0"
                style={{ background: item.color + '18', color: item.color }}>{item.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs mb-0.5">
                  <span className={`inline-block px-1.5 py-0.5 rounded font-mono font-bold text-[9px] mr-2 ${SEV_COLORS[item.sev] || 'bg-accent/10 text-accent'}`}>
                    {item.sev}
                  </span>
                  {item.title}
                </div>
                <div className="font-mono text-[10px] text-muted">{item.meta}</div>
              </div>
              <div className="font-mono text-[10px] text-muted whitespace-nowrap">{item.time}</div>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted mb-3">Event Timeline</div>
        <div>
          {TIMELINE.map((t, i) => (
            <div key={i} className="flex gap-3 pb-4">
              <div className="flex flex-col items-center gap-0">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: t.color, boxShadow: `0 0 6px ${t.color}` }} />
                {i < TIMELINE.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
              </div>
              <div className="pb-2">
                <div className="font-mono text-[9px] text-muted mb-1">{t.ts}</div>
                <div className="text-xs text-text">{t.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
