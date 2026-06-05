import { useState } from 'react'

const HASHES = [
  { file: 'anon_x7_posts_001.json',  hash: 'a3f8c2d1e4b5f6a7d8c9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1' },
  { file: 'darkbyte_posts_001.json', hash: '7d2e9f4a1b8c5d3e6f0a2b4c7d9e1f3a5b7c9d2e4f6a8b0c3d5e7f9a1b3c5d7' },
  { file: 'stylo_run_0047.json',     hash: '2b4d6f8a0c2e4f1b3d5e7g9h1j3k5l7m9n1p3r5s7t9u1v3w5x7y9z1a3b5c7d9' },
  { file: 'graph_snapshot_001.json', hash: 'f1e3d5c7b9a0f2e4d6c8b0a2f3e5d7c9b1a3f4e6d8c0b2a4f5e7d9c1b3a5f6e8' },
]

export default function ReportView() {
  const [signed, setSigned] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [loading, setLoading] = useState(false)

  const generate = () => {
    setLoading(true)
    setTimeout(() => { setLoading(false); setGenerated(true) }, 1200)
  }

  return (
    <div className="flex-1 overflow-y-auto p-5">
      {/* Report header card */}
      <div className="rounded-xl border border-border p-6 mb-4"
        style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.04), rgba(124,58,237,0.04))' }}>
        <div className="font-mono text-[9px] text-accent uppercase tracking-widest mb-2">Vanguard OSINT · Forensic Report</div>
        <div className="text-xl font-extrabold mb-3">CASE-2024-0047 — Operation Ghost Trace</div>
        <div className="flex flex-wrap gap-4 font-mono text-[10px] text-muted">
          <span>Generated: 2024-11-07T02:14:33Z</span>
          <span>Analyst: [REDACTED]</span>
          <span>Classification: RESTRICTED</span>
          <span className="text-accent3">✓ SHA-256 Integrity Verified</span>
        </div>
      </div>

      {/* Executive summary */}
      <div className="bg-panel border border-border rounded-lg p-4 mb-3">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted mb-3">Executive Summary</div>
        <div className="text-xs leading-relaxed text-muted2">
          Stylometric analysis of writing samples attributed to{' '}
          <span className="text-accent font-mono">@anon_x7</span> (Twitter/Reddit) and{' '}
          <span className="text-accent font-mono">darkbyte_99</span> (4chan/Discord) returned a
          similarity score of{' '}
          <span className="text-amber-400 font-mono font-bold">87%</span>, placing this comparison
          in the high-confidence band. Six linguistic feature categories converged including
          capitalisation style, informal register, and phrase-level matching. Graph analysis
          identified a 3-node cluster linking these subjects through shared intermediary{' '}
          <span className="text-accent font-mono">@nexus_relay</span> with temporal correlation
          across platforms within a 3-minute window.
          <span className="text-danger font-semibold"> These findings constitute investigative
          leads only and must not be used as definitive identification without independent corroboration.</span>
        </div>
      </div>

      {/* Stylometry findings */}
      <div className="bg-panel border border-border rounded-lg p-4 mb-3">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted mb-3">Stylometry Findings</div>
        <div className="space-y-2">
          {[
            { label: '@anon_x7 ↔ darkbyte_99', score: 0.87, verdict: 'strong',   color: '#ef4444' },
            { label: 'vk_user_4421 ↔ @anon_x7', score: 0.61, verdict: 'moderate', color: '#f59e0b' },
          ].map(r => (
            <div key={r.label} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
              <div className="flex-1 font-mono text-[11px] text-text">{r.label}</div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-bg3 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${r.score * 100}%`, background: r.color }} />
                </div>
                <span className="font-mono text-[11px] font-bold w-10 text-right" style={{ color: r.color }}>
                  {Math.round(r.score * 100)}%
                </span>
              </div>
              <span className={`font-mono text-[9px] px-2 py-0.5 rounded uppercase font-bold ${
                r.verdict === 'strong' ? 'bg-danger/15 text-danger' : 'bg-amber-500/15 text-amber-400'
              }`}>{r.verdict}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Graph findings */}
      <div className="bg-panel border border-border rounded-lg p-4 mb-3">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted mb-3">Graph Findings</div>
        <div className="text-xs leading-relaxed text-muted2">
          Network analysis identified a <span className="text-accent">3-node cluster</span> linking
          @anon_x7, vk_user_4421, and darkbyte_99 through shared intermediary{' '}
          <span className="text-accent font-mono">@nexus_relay</span>. All three subjects co-used
          hashtag <span className="text-accent font-mono">#op_ghost</span> within a 3-minute window
          across Twitter, Telegram, and 4chan — suggesting coordinated activity.
          Bridge node degree: <span className="text-accent font-mono">@nexus_relay → 3 connections</span>.
        </div>
      </div>

      {/* Evidence hashes */}
      <div className="bg-panel border border-border rounded-lg p-4 mb-3">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted mb-3">Evidence Integrity Hashes</div>
        <div className="space-y-2">
          {HASHES.map(h => (
            <div key={h.file} className="bg-bg3 rounded-md px-3 py-2">
              <div className="font-mono text-[9px] text-accent3 break-all leading-relaxed">{h.hash}</div>
              <div className="font-mono text-[9px] text-muted mt-0.5">· {h.file}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="border border-amber-500/20 bg-amber-500/5 rounded-lg p-4 mb-4">
        <div className="font-mono text-[9px] uppercase tracking-widest text-amber-400 mb-2">⚠ Legal Disclaimer</div>
        <div className="font-mono text-[10px] text-muted leading-relaxed">
          This report was generated by Vanguard OSINT for lawful investigative purposes only.
          All similarity scores are investigative leads and must be independently corroborated
          before any conclusions are drawn. This report does not constitute legal evidence
          without expert witness validation.
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={generate} disabled={loading}
          className="flex-1 py-2.5 bg-accent/10 border border-accent text-accent font-bold text-xs tracking-widest uppercase rounded-md hover:bg-accent/20 transition-all disabled:opacity-50">
          {loading
            ? <span className="flex items-center justify-center gap-2"><span className="w-3 h-3 border border-accent/30 border-t-accent rounded-full animate-spin" />Generating...</span>
            : generated ? '✓ PDF Generated — Download' : 'Generate PDF Report'}
        </button>
        <button className="flex-1 py-2.5 border border-border text-muted text-xs font-bold tracking-widest uppercase rounded-md hover:border-border2 hover:text-text transition-all">
          Export JSON Bundle
        </button>
        <button onClick={() => setSigned(true)}
          className={`px-5 py-2.5 border text-xs font-bold tracking-widest uppercase rounded-md transition-all ${
            signed
              ? 'border-accent3/40 text-accent3 bg-accent3/10'
              : 'border-border text-muted hover:border-accent3 hover:text-accent3'
          }`}>
          {signed ? '✓ Signed Off' : 'Sign Off'}
        </button>
      </div>
    </div>
  )
}
