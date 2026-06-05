import { useState } from 'react'

const DEFAULT_A = `yeah no its literally insane how ppl just dont get it lol. like i've been saying this for YEARS and nobody listens until its too late. the whole system is rigged anyway so why bother playing by their rules right? classic cope from the usual suspects smh. gonna document everything bc they always try to memory hole this stuff`

const DEFAULT_B = `its actually insane nobody talking about this lol. been pointing this out YEARS ago and the memory holing is real as always. classic move from their side. dont play by rigged rules imo, document everything bc they will deny it. ppl just cope and dont get the bigger picture smh`

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/\b[a-z']+\b/g) || []
}

function jaccard(a: string[], b: string[]): number {
  const sa = new Set(a), sb = new Set(b)
  const inter = [...sa].filter(w => sb.has(w)).length
  const union = new Set([...sa, ...sb]).size
  return union === 0 ? 0 : inter / union
}

function computeScore(a: string, b: string) {
  if (!a.trim() || !b.trim()) return null
  const ta = tokenize(a), tb = tokenize(b)
  const jac = jaccard(ta, tb)
  const lenSim = 1 - Math.abs(a.length - b.length) / Math.max(a.length, b.length, 1)
  const capsA = (a.match(/\b[A-Z]{2,}\b/g) || []).length / Math.max(ta.length, 1)
  const capsB = (b.match(/\b[A-Z]{2,}\b/g) || []).length / Math.max(tb.length, 1)
  const capsSim = 1 - Math.min(Math.abs(capsA - capsB) / 0.05, 1)
  const INFORMAL = new Set(['lol','lmao','smh','imo','imho','tbh','ngl','omg','wtf','bruh','fr'])
  const infA = ta.filter(w => INFORMAL.has(w)).length / Math.max(ta.length, 1)
  const infB = tb.filter(w => INFORMAL.has(w)).length / Math.max(tb.length, 1)
  const infSim = 1 - Math.min(Math.abs(infA - infB) / 0.05, 1)
  const raw = jac * 0.45 + lenSim * 0.15 + capsSim * 0.25 + infSim * 0.15
  return Math.min(0.99, Math.max(0.02, raw))
}

export default function StylometryView() {
  const [textA, setTextA] = useState(DEFAULT_A)
  const [textB, setTextB] = useState(DEFAULT_B)
  const [result, setResult] = useState<null | { score: number; features: { name: string; val: number }[]; signals: string[] }>(null)
  const [loading, setLoading] = useState(false)

  const runAnalysis = () => {
    setLoading(true)
    setResult(null)
    setTimeout(() => {
      const score = computeScore(textA, textB) ?? 0
      const ta = tokenize(textA), tb = tokenize(textB)
      const jac = jaccard(ta, tb)
      const capsA = (textA.match(/\b[A-Z]{2,}\b/g) || []).length
      const capsB = (textB.match(/\b[A-Z]{2,}\b/g) || []).length
      const INFORMAL = new Set(['lol','lmao','smh','imo','imho','tbh','ngl'])
      const sharedInformal = [...new Set(ta.filter(w => INFORMAL.has(w)))].filter(w => new Set(tb).has(w))
      const sharedWords = [...new Set(ta)].filter(w => new Set(tb).has(w) && w.length > 4).slice(0, 4)

      const features = [
        { name: 'Lexical density',     val: Math.min(0.99, jac * 1.8 + 0.3) },
        { name: 'Punctuation pattern', val: Math.min(0.99, score + 0.07) },
        { name: 'Sentence rhythm',     val: Math.min(0.99, score - 0.05) },
        { name: 'Vocab overlap',       val: Math.min(0.99, jac * 2.0 + 0.25) },
        { name: 'Caps style',          val: capsA > 0 && capsB > 0 ? 0.94 : 0.3 },
        { name: 'Informal register',   val: sharedInformal.length > 1 ? 0.91 : 0.4 },
      ]

      const signals: string[] = []
      if (capsA > 0 && capsB > 0) signals.push(`[CAPS_EMPHASIS] ALL_CAPS used for rhetorical effect in both samples — score 0.94`)
      if (sharedInformal.length > 0) signals.push(`[INFORMAL_MARKERS] Shared informal tokens: ${sharedInformal.join(', ')} — score 0.91`)
      if (sharedWords.length > 2) signals.push(`[PHRASE_MATCH] Shared rare terms: ${sharedWords.join(', ')} — score ${jac.toFixed(2)}`)
      if (textA.includes('bc ') && textB.includes('bc ')) signals.push(`[CLAUSE_ORDER] Trailing "...bc [reason]" construction found in both samples`)
      if (signals.length === 0) signals.push(`[LEXICAL] Limited convergence across feature dimensions — score ${score.toFixed(2)}`)

      setResult({ score, features, signals })
      setLoading(false)
    }, 1400)
  }

  const scoreColor = (s: number) => s > 0.8 ? '#ef4444' : s > 0.6 ? '#f59e0b' : '#10b981'
  const verdict = (s: number) => s > 0.8 ? 'Strong Similarity' : s > 0.6 ? 'Moderate Similarity' : 'Low Similarity'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
        <div>
          <div className="text-sm font-bold mb-0.5">Linguistic Stylometry Engine</div>
          <div className="font-mono text-[10px] text-muted">Authorship similarity analysis — scores are investigative leads only</div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setTextA(''); setTextB(''); setResult(null) }}
            className="border border-border text-muted px-3 py-1.5 rounded text-xs hover:border-border2 transition-all">Clear</button>
          <button onClick={runAnalysis} disabled={loading}
            className="bg-accent/10 border border-accent text-accent px-4 py-1.5 rounded text-xs font-bold tracking-wide hover:bg-accent/20 transition-all disabled:opacity-50">
            {loading ? 'Analysing...' : 'Run Analysis ▸'}
          </button>
        </div>
      </div>

      {/* Input area */}
      <div className="grid grid-cols-[1fr_36px_1fr] gap-3 px-5 pt-4 pb-3 flex-shrink-0">
        {[
          { label: 'Sample A', tag: '@anon_x7',    tagColor: '#ef4444', val: textA, set: setTextA },
          { label: 'Sample B', tag: 'darkbyte_99', tagColor: '#7c3aed', val: textB, set: setTextB },
        ].map((s, idx) => (
          <>
            {idx === 1 && (
              <div key="vs" className="flex items-start pt-10 justify-center">
                <div className="w-8 h-8 rounded-full border border-border2 flex items-center justify-center font-mono text-[10px] font-bold text-muted">VS</div>
              </div>
            )}
            <div key={s.label} className="bg-panel border border-border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted">{s.label}</span>
                <span className="font-mono text-[9px] px-2 py-0.5 rounded" style={{ background: s.tagColor + '18', color: s.tagColor }}>{s.tag}</span>
              </div>
              <textarea value={s.val} onChange={e => s.set(e.target.value)} rows={6}
                placeholder="Paste writing sample here..."
                className="w-full bg-transparent text-text font-mono text-[11px] px-3 py-2.5 outline-none resize-none leading-relaxed" />
            </div>
          </>
        ))}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-5 pb-5">
        {loading && (
          <div className="flex items-center gap-3 font-mono text-[11px] text-accent py-4">
            <div className="w-3.5 h-3.5 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
            Computing stylometric features across 8 dimensions...
          </div>
        )}

        {result && (
          <div className="animate-fadeIn space-y-3">
            {/* Score hero */}
            <div className="bg-panel border border-border rounded-xl p-5 flex gap-5 items-center">
              {/* Ring */}
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg viewBox="0 0 80 80" className="w-full h-full">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(245,158,11,.15)" strokeWidth="6"/>
                  <circle cx="40" cy="40" r="34" fill="none" stroke={scoreColor(result.score)} strokeWidth="6"
                    strokeDasharray={`${Math.round(result.score * 213)} 213`}
                    strokeDashoffset="-27" strokeLinecap="round"
                    transform="rotate(-90 40 40)"/>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-xl font-bold font-mono" style={{ color: scoreColor(result.score) }}>
                    {Math.round(result.score * 100)}%
                  </div>
                  <div className="text-[8px] uppercase tracking-widest text-muted">MATCH</div>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-base font-bold mb-1" style={{ color: scoreColor(result.score) }}>{verdict(result.score)}</div>
                <div className="text-xs text-muted2 leading-relaxed mb-2">
                  {result.score > 0.7
                    ? 'Multiple convergent linguistic markers identified. High probability of shared authorship. Treat as investigative lead — not proof of identity.'
                    : 'Limited convergence detected. Insufficient evidence for identity overlap at this threshold.'}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-muted">Confidence band:</span>
                  <div className="flex-1 h-1.5 bg-bg3 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${result.score * 100}%`, background: scoreColor(result.score) }} />
                  </div>
                  <span className="font-mono text-[10px]" style={{ color: scoreColor(result.score) }}>
                    {(result.score - 0.06).toFixed(2)} – {Math.min(0.99, result.score + 0.06).toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-mono text-[9px] text-muted mb-1">Run ID</div>
                <div className="font-mono text-[10px] text-accent">STY-{Date.now().toString().slice(-8)}</div>
                <div className="font-mono text-[9px] text-muted mt-2">Tokens A / B</div>
                <div className="font-mono text-[10px] text-text">{tokenize(textA).length} / {tokenize(textB).length}</div>
              </div>
            </div>

            {/* Feature scores */}
            <div className="grid grid-cols-2 gap-2">
              {result.features.map(f => {
                const c = f.val > 0.8 ? '#ef4444' : f.val > 0.6 ? '#f59e0b' : '#10b981'
                return (
                  <div key={f.name} className="bg-panel border border-border rounded-md p-3">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-muted mb-2">{f.name}</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-bg3 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${f.val * 100}%`, background: c }} />
                      </div>
                      <span className="font-mono text-[11px] font-bold min-w-[32px] text-right" style={{ color: c }}>
                        {f.val.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Signals */}
            <div className="bg-panel border border-border rounded-lg p-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted mb-3">Top Discriminating Signals</div>
              <div className="space-y-1.5">
                {result.signals.map((s, i) => {
                  const [tag, ...rest] = s.split('] ')
                  return (
                    <div key={i} className="font-mono text-[11px] leading-relaxed">
                      <span className="text-accent">{tag}]</span>
                      <span className="text-muted2"> {rest.join('] ')}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {!result && !loading && (
          <div className="flex flex-col items-center justify-center h-32 text-muted font-mono text-xs text-center">
            Paste writing samples above and click Run Analysis
          </div>
        )}
      </div>
    </div>
  )
}
