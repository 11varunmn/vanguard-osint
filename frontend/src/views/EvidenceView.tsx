import { useState } from 'react'

const EVIDENCE = [
  { name: 'anon_x7_posts_001.json', hash: 'a3f8c2d1e4b5f6a7d8c9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1', type: 'Twitter Archive',   time: '2024-11-07 · 02:11:12 UTC', size: '48.2 KB', color: '#00d4ff', sealed: true },
  { name: 'anon_x7_posts_002.json', hash: 'b4g9d3e2f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b2c3', type: 'Twitter Archive',   time: '2024-11-07 · 02:11:14 UTC', size: '31.7 KB', color: '#00d4ff', sealed: true },
  { name: 'darkbyte_posts_001.json',hash: '7d2e9f4a1b8c5d3e6f0a2b4c7d9e1f3a5b7c9d2e4f6a8b0c3d5e7f9a1b3c5d7', type: '4chan Export',      time: '2024-11-07 · 02:11:30 UTC', size: '22.9 KB', color: '#7c3aed', sealed: true },
  { name: 'stylo_run_0047.json',    hash: '2b4d6f8a0c2e4f1b3d5e7g9h1j3k5l7m9n1p3r5s7t9u1v3w5x7y9z1a3b5c7d9', type: 'Analysis Result', time: '2024-11-07 · 02:14:31 UTC', size: '4.1 KB',  color: '#f59e0b', sealed: true },
  { name: 'graph_snapshot_001.json',hash: 'f1e3d5c7b9a0f2e4d6c8b0a2f3e5d7c9b1a3f4e6d8c0b2a4f5e7d9c1b3a5f6e8', type: 'Graph State',     time: '2024-11-07 · 02:13:58 UTC', size: '9.8 KB',  color: '#7c3aed', sealed: true },
  { name: 'vk_user_export.csv',     hash: 'c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7', type: 'VK Export',       time: '2024-11-07 · 01:58:44 UTC', size: '67.3 KB', color: '#f59e0b', sealed: true },
  { name: 'audit_log_full.json',    hash: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7', type: 'Audit Trail',    time: '2024-11-07 · 02:14:33 UTC', size: '11.2 KB', color: '#10b981', sealed: true },
  { name: 'telegram_msgs_001.json', hash: '3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7', type: 'Telegram Export', time: '2024-11-07 · 01:59:22 UTC', size: '38.6 KB', color: '#00d4ff', sealed: true },
]

export default function EvidenceView() {
  const [selected, setSelected] = useState<typeof EVIDENCE[0] | null>(null)
  const [filter, setFilter] = useState('all')

  const types = ['all', ...Array.from(new Set(EVIDENCE.map(e => e.type)))]
  const filtered = filter === 'all' ? EVIDENCE : EVIDENCE.filter(e => e.type === filter)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
        <div>
          <div className="text-sm font-bold mb-0.5">Evidence Vault</div>
          <div className="font-mono text-[10px] text-muted">Immutable artifact storage — SHA-256 verified · UTC timestamped · append-only</div>
        </div>
        <div className="flex gap-2 items-center">
          <span className="font-mono text-[10px] text-accent3">✓ {EVIDENCE.length} items sealed</span>
          <button className="bg-accent/10 border border-accent text-accent px-3 py-1.5 rounded text-xs font-semibold hover:bg-accent/20 transition-all">
            Export Bundle ↓
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 px-5 py-2 border-b border-border flex-shrink-0">
        {types.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-3 py-1 rounded text-[10px] font-mono transition-all ${
              filter === t ? 'bg-accent/10 text-accent border border-accent/30' : 'text-muted hover:text-text'
            }`}>
            {t}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(ev => (
              <div key={ev.name}
                onClick={() => setSelected(ev)}
                className={`bg-panel border rounded-lg p-4 cursor-pointer transition-all hover:border-border2 ${
                  selected?.name === ev.name ? 'border-accent/40' : 'border-border'
                }`}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ background: ev.color + '18', color: ev.color }}>
                    <span className="text-xs">◎</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate mb-0.5">{ev.name}</div>
                    <div className="font-mono text-[10px] text-muted">{ev.type} · {ev.size}</div>
                  </div>
                  {ev.sealed && (
                    <span className="font-mono text-[9px] bg-accent3/10 text-accent3 px-1.5 py-0.5 rounded flex-shrink-0">SEALED</span>
                  )}
                </div>
                <div className="font-mono text-[9px] text-muted break-all mb-2 leading-relaxed">{ev.hash}</div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] text-muted">{ev.time}</span>
                  <span className="font-mono text-[9px] text-accent3 flex items-center gap-1">✓ Integrity verified</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-64 border-l border-border bg-bg2 p-4 overflow-y-auto flex-shrink-0">
            <div className="font-mono text-[9px] uppercase tracking-widest text-muted mb-3">Artifact Detail</div>
            <div className="space-y-3">
              <div>
                <div className="font-mono text-[9px] text-muted mb-1">Filename</div>
                <div className="text-xs font-semibold break-all">{selected.name}</div>
              </div>
              <div>
                <div className="font-mono text-[9px] text-muted mb-1">Type</div>
                <div className="text-xs">{selected.type}</div>
              </div>
              <div>
                <div className="font-mono text-[9px] text-muted mb-1">Size</div>
                <div className="text-xs font-mono">{selected.size}</div>
              </div>
              <div>
                <div className="font-mono text-[9px] text-muted mb-1">SHA-256 Hash</div>
                <div className="font-mono text-[9px] text-accent3 break-all leading-relaxed bg-bg3 rounded p-2">{selected.hash}</div>
              </div>
              <div>
                <div className="font-mono text-[9px] text-muted mb-1">Sealed At</div>
                <div className="font-mono text-[10px] text-text">{selected.time}</div>
              </div>
              <div>
                <div className="font-mono text-[9px] text-muted mb-1">Integrity</div>
                <div className="font-mono text-[10px] text-accent3">✓ SHA-256 verified</div>
              </div>
              <div>
                <div className="font-mono text-[9px] text-muted mb-1">Status</div>
                <div className="font-mono text-[10px] text-accent3">Immutable · Append-only</div>
              </div>
              <button className="w-full border border-border text-muted py-2 rounded text-xs font-mono hover:border-accent hover:text-accent transition-all mt-2">
                Verify Hash ↗
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
