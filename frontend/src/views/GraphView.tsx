import { useEffect, useRef, useState } from 'react'

const NODES = [
  { id: 'anon_x7',  label: '@anon_x7',      x: 0.28, y: 0.35, r: 18, color: '#ef4444', type: 'account' },
  { id: 'darkbyte', label: 'darkbyte_99',    x: 0.68, y: 0.35, r: 18, color: '#ef4444', type: 'account' },
  { id: 'vk_user',  label: 'vk_user_4421',  x: 0.50, y: 0.68, r: 15, color: '#f59e0b', type: 'account' },
  { id: 'nexus',    label: '@nexus_relay',   x: 0.48, y: 0.44, r: 13, color: '#7c3aed', type: 'shared'  },
  { id: 'twitter',  label: 'Twitter',        x: 0.12, y: 0.18, r: 10, color: '#10b981', type: 'platform'},
  { id: 'discord',  label: 'Discord',        x: 0.82, y: 0.20, r: 10, color: '#10b981', type: 'platform'},
  { id: 'telegram', label: 'Telegram',       x: 0.50, y: 0.85, r: 10, color: '#10b981', type: 'platform'},
  { id: '4chan',     label: '4chan',           x: 0.80, y: 0.62, r: 10, color: '#10b981', type: 'platform'},
]

const EDGES = [
  { from: 'anon_x7',  to: 'darkbyte', w: 3,   color: 'rgba(239,68,68,0.7)',  label: '87% match' },
  { from: 'anon_x7',  to: 'nexus',    w: 1.5, color: 'rgba(124,58,237,0.5)', label: null },
  { from: 'darkbyte', to: 'nexus',    w: 1.5, color: 'rgba(124,58,237,0.5)', label: null },
  { from: 'vk_user',  to: 'nexus',    w: 1,   color: 'rgba(124,58,237,0.4)', label: null },
  { from: 'anon_x7',  to: 'vk_user',  w: 1,   color: 'rgba(245,158,11,0.4)', label: null },
  { from: 'darkbyte', to: 'vk_user',  w: 1,   color: 'rgba(245,158,11,0.4)', label: null },
  { from: 'anon_x7',  to: 'twitter',  w: 1,   color: 'rgba(16,185,129,0.3)', label: null },
  { from: 'darkbyte', to: 'discord',  w: 1,   color: 'rgba(16,185,129,0.3)', label: null },
  { from: 'darkbyte', to: '4chan',     w: 1,   color: 'rgba(16,185,129,0.3)', label: null },
  { from: 'vk_user',  to: 'telegram', w: 1,   color: 'rgba(16,185,129,0.3)', label: null },
]

export default function GraphView() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({ zoom: 1, ox: 0, oy: 0, dragging: false, mx: 0, my: 0 })
  const animRef = useRef(0)
  const [selected, setSelected] = useState<string | null>('anon_x7')
  const [stats] = useState({ nodes: NODES.length, edges: EDGES.length, clusters: 1 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const nmap = Object.fromEntries(NODES.map(n => [n.id, n]))
    const cx = (n: typeof NODES[0]) => (n.x - 0.5) * canvas.width * 0.85
    const cy = (n: typeof NODES[0]) => (n.y - 0.5) * canvas.height * 0.85

    const draw = () => {
      const s = stateRef.current
      const t = Date.now() / 1000
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.translate(canvas.width / 2 + s.ox, canvas.height / 2 + s.oy)
      ctx.scale(s.zoom, s.zoom)

      // Grid
      ctx.strokeStyle = 'rgba(30,45,74,0.4)'
      ctx.lineWidth = 0.5
      for (let x = -600; x < 600; x += 40) { ctx.beginPath(); ctx.moveTo(x, -400); ctx.lineTo(x, 400); ctx.stroke() }
      for (let y = -400; y < 400; y += 40) { ctx.beginPath(); ctx.moveTo(-600, y); ctx.lineTo(600, y); ctx.stroke() }

      // Edges
      EDGES.forEach(e => {
        const a = nmap[e.from], b = nmap[e.to]
        if (!a || !b) return
        ctx.beginPath()
        ctx.moveTo(cx(a), cy(a))
        ctx.lineTo(cx(b), cy(b))
        ctx.strokeStyle = e.color
        ctx.lineWidth = e.w
        ctx.stroke()
        if (e.label) {
          const mx = (cx(a) + cx(b)) / 2, my = (cy(a) + cy(b)) / 2
          ctx.fillStyle = 'rgba(6,8,16,0.9)'
          ctx.fillRect(mx - 30, my - 9, 60, 15)
          ctx.fillStyle = '#ef4444'
          ctx.font = '9px Space Mono, monospace'
          ctx.textAlign = 'center'
          ctx.fillText(e.label, mx, my + 3)
        }
      })

      // Nodes
      NODES.forEach(n => {
        const x = cx(n), y = cy(n)
        const pulse = n.type === 'account' ? Math.sin(t * 2 + n.x * 10) * 2 : 0
        const isSelected = n.id === selected

        // Glow
        const grd = ctx.createRadialGradient(x, y, 0, x, y, n.r + 10 + pulse)
        grd.addColorStop(0, n.color + '55')
        grd.addColorStop(1, 'transparent')
        ctx.beginPath(); ctx.arc(x, y, n.r + 10 + pulse, 0, Math.PI * 2)
        ctx.fillStyle = grd; ctx.fill()

        // Circle
        ctx.beginPath(); ctx.arc(x, y, n.r + pulse * 0.3, 0, Math.PI * 2)
        ctx.fillStyle = n.color + '22'
        ctx.strokeStyle = isSelected ? n.color : n.color + 'aa'
        ctx.lineWidth = isSelected ? 2.5 : 1.5
        ctx.fill(); ctx.stroke()

        // Inner dot
        ctx.beginPath(); ctx.arc(x, y, n.r * 0.28, 0, Math.PI * 2)
        ctx.fillStyle = n.color; ctx.fill()

        // Label
        ctx.fillStyle = isSelected ? '#e2e8f0' : '#94a3b8'
        ctx.font = `${n.type === 'account' ? 'bold ' : ''}${n.type === 'account' ? 11 : 9}px Syne, sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(n.label, x, y + n.r + 14)
      })

      ctx.restore()
      animRef.current = requestAnimationFrame(draw)
    }

    draw()

    // Mouse events
    const onDown = (e: MouseEvent) => {
      stateRef.current.dragging = true
      stateRef.current.mx = e.clientX
      stateRef.current.my = e.clientY
    }
    const onMove = (e: MouseEvent) => {
      const s = stateRef.current
      if (!s.dragging) return
      s.ox += (e.clientX - s.mx) / s.zoom
      s.oy += (e.clientY - s.my) / s.zoom
      s.mx = e.clientX; s.my = e.clientY
    }
    const onUp = () => { stateRef.current.dragging = false }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      stateRef.current.zoom *= e.deltaY > 0 ? 0.9 : 1.1
    }
    const onClick = (e: MouseEvent) => {
      const s = stateRef.current
      const rect = canvas.getBoundingClientRect()
      const mx = (e.clientX - rect.left - canvas.width / 2 - s.ox) / s.zoom
      const my = (e.clientY - rect.top - canvas.height / 2 - s.oy) / s.zoom
      for (const n of NODES) {
        const dx = mx - cx(n), dy = my - cy(n)
        if (Math.sqrt(dx * dx + dy * dy) < n.r + 5) { setSelected(n.id); break }
      }
    }

    canvas.addEventListener('mousedown', onDown)
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseup', onUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('click', onClick)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousedown', onDown)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseup', onUp)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('click', onClick)
    }
  }, [selected])

  const zoom = (f: number) => { stateRef.current.zoom *= f }
  const reset = () => { stateRef.current = { ...stateRef.current, zoom: 1, ox: 0, oy: 0 } }

  const selectedNode = NODES.find(n => n.id === selected)

  return (
    <div className="flex-1 relative overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Info badge */}
      <div className="absolute top-4 left-4 bg-bg/90 border border-border rounded-md px-3 py-2">
        <div className="font-mono text-[9px] text-muted mb-1">CASE-2024-0047 · NETWORK GRAPH</div>
        <div className="font-mono text-[11px] text-accent">{stats.nodes} nodes · {stats.edges} edges · {stats.clusters} cluster</div>
      </div>

      {/* Selected node info */}
      {selectedNode && (
        <div className="absolute top-4 right-14 bg-bg/90 border border-border rounded-md px-3 py-2 min-w-[160px]">
          <div className="font-mono text-[9px] text-muted mb-1">SELECTED NODE</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: selectedNode.color }}></div>
            <span className="text-xs font-bold">{selectedNode.label}</span>
          </div>
          <div className="font-mono text-[10px] text-muted mt-1 capitalize">{selectedNode.type}</div>
        </div>
      )}

      {/* Toolbar */}
      <div className="absolute top-4 right-4 flex flex-col gap-1.5">
        {[
          { label: '+', action: () => zoom(1.2), title: 'Zoom in' },
          { label: '−', action: () => zoom(0.8), title: 'Zoom out' },
          { label: '⟲', action: reset,            title: 'Reset view' },
        ].map(b => (
          <button key={b.label} onClick={b.action} title={b.title}
            className="w-8 h-8 bg-panel border border-border rounded-md flex items-center justify-center text-muted hover:border-accent hover:text-accent transition-all text-sm font-bold">
            {b.label}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
        {[
          { color: '#ef4444', label: 'High match' },
          { color: '#f59e0b', label: 'Medium match' },
          { color: '#00d4ff', label: 'Account' },
          { color: '#7c3aed', label: 'Shared entity' },
          { color: '#10b981', label: 'Platform' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5 bg-bg/80 border border-border rounded px-2 py-1 font-mono text-[10px]">
            <span className="w-2 h-2 rounded-full" style={{ background: l.color }}></span>
            {l.label}
          </div>
        ))}
      </div>
    </div>
  )
}
