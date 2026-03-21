"use client"

import { useRef, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export interface OrbitActorNode {
  id: string
  name: string
  slug: string
  pfScore: number | null
  relationshipType: string | null
  alignmentScore: number | null
  isProfileActor: boolean
}

export interface OrbitVizProps {
  nodes: OrbitActorNode[]
  className?: string
}

const ACTOR_ALIASES: Record<string, string> = {
  "United States": "US",
  "China (CCP)": "China",
  "United Kingdom": "UK",
  "Russia": "Russia",
  "Saudi Arabia": "Saudi",
  "United Arab Emirates": "UAE",
  "European Union": "EU",
  "Afghan Taliban": "Taliban",
  "Afghanistan Taliban": "Taliban",
  "North Korea": "N. Korea",
  "South Korea": "S. Korea",
  "Islamic State": "ISIS",
  "Rapid Support Forces": "RSF",
  "Iran (Current Conflict)": "Iran",
  "Iraq (PMF)": "Iraq PMF",
  "Sinaloa Cartel": "Sinaloa",
  "Coalition Forces": "Coalition",
}

function getDisplayName(name: string): string {
  if (ACTOR_ALIASES[name]) return ACTOR_ALIASES[name]
  if (name.length <= 10) return name
  const words = name.split(' ')
  let result = ''
  for (const word of words) {
    if ((result + (result ? ' ' : '') + word).length > 9) break
    result += (result ? ' ' : '') + word
  }
  return result || name.slice(0, 9)
}

// --- color helpers ---
function lightenColor(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgb(${Math.round(r + (255 - r) * amount)},${Math.round(g + (255 - g) * amount)},${Math.round(b + (255 - b) * amount)})`
}

function darkenColor(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgb(${Math.round(r * (1 - amount))},${Math.round(g * (1 - amount))},${Math.round(b * (1 - amount))})`
}

function getNodeColor(node: OrbitActorNode): string {
  if (node.isProfileActor) return '#e8eaf0'
  const t = node.relationshipType
  if (!t) return '#6b7280'
  if (['Patron', 'Ally', 'Partner'].includes(t)) return '#60a5fa'
  if (['Adversary', 'Rival'].includes(t)) return '#ef4444'
  if (['Dependent', 'Proxy', 'Coercive Protectorate / Imposed Dominance'].includes(t)) return '#f97316'
  return '#6b7280'
}

// Push adjacent angles apart until no pair is closer than minGap.
// Preserves index correspondence with input array.
function applyMinSeparation(angles: number[], minGap: number): number[] {
  if (angles.length <= 1) return [...angles]
  const result = [...angles]
  let changed = true
  let iters = 0
  while (changed && iters < 50) {
    changed = false
    iters++
    const order = result.map((_, i) => i).sort((a, b) => result[a] - result[b])
    for (let k = 0; k < order.length; k++) {
      const i = order[k]
      const j = order[(k + 1) % order.length]
      let gap = result[j] - result[i]
      if (k + 1 === order.length) gap += 2 * Math.PI
      if (gap < minGap) {
        const push = (minGap - gap) / 2
        result[i] -= push
        result[j] += push
        changed = true
      }
    }
  }
  return result
}

// --- legend config ---
type ColorKey = 'blue' | 'red' | 'orange' | 'gray' | 'white'

const BASE_COLORS: Record<ColorKey, string> = {
  blue:   '#60a5fa',
  red:    '#ef4444',
  orange: '#f97316',
  gray:   '#6b7280',
  white:  '#e8eaf0',
}

const LEGEND_GROUPS: { label: string; keys: string[]; colorKey: ColorKey }[] = [
  { label: 'Patron · Ally',     keys: ['Patron', 'Ally', 'Partner'],                                              colorKey: 'blue'   },
  { label: 'Adversary · Rival', keys: ['Adversary', 'Rival'],                                                     colorKey: 'red'    },
  { label: 'Dependent · Proxy', keys: ['Dependent', 'Proxy', 'Coercive Protectorate / Imposed Dominance'],       colorKey: 'orange' },
  { label: 'Neutral',           keys: ['Neutral'],                                                                 colorKey: 'gray'   },
]

// --- canvas constants ---
const CANVAS_W = 480
const CANVAS_H = 300
const CX = 240
const CY = 155
const TILT = 0.26
const RING_RADII = [88, 152, 208]
const RING_BASE_ANGLES = [Math.PI * 0.5, Math.PI * 1.1, Math.PI * 1.7]

function getRingRy(rx: number): number {
  return Math.round(rx * Math.sin(TILT))
}

interface PositionedNode {
  node: OrbitActorNode
  x: number
  y: number
  radius: number
  color: string
  depth: number
  isProfile: boolean
}

export default function OrbitViz({ nodes, className }: OrbitVizProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const angleRef = useRef<number>(0)
  const isPausedRef = useRef<boolean>(false)
  const router = useRouter()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Partition nodes
  const profileNode = nodes.find(n => n.isProfileActor)
  const relNodes = nodes.filter(n => !n.isProfileActor)

  // Proportional ring distribution: sort by pfScore desc, assign by rank
  const sortedRel = [...relNodes].sort((a, b) => (b.pfScore ?? 0) - (a.pfScore ?? 0))
  const ringActors: OrbitActorNode[][] = [[], [], []]
  sortedRel.forEach((n, i) => {
    ringActors[i <= 1 ? 0 : i <= 4 ? 1 : 2].push(n)
  })

  // Precompute static base angles with min separation per ring
  const ringBaseAngles: number[][] = ringActors.map((actors, ringIdx) => {
    if (actors.length === 0) return []
    const base = actors.map((_, i) => RING_BASE_ANGLES[ringIdx] + (i / actors.length) * 2 * Math.PI)
    return applyMinSeparation(base, 0.45)
  })

  // --- render functions ---
  function computePositions(angleOffset: number): PositionedNode[] {
    const result: PositionedNode[] = []

    if (profileNode) {
      result.push({
        node: profileNode,
        x: CX, y: CY,
        radius: Math.max(18, Math.min(28, ((profileNode.pfScore ?? 50) / 100) * 32)),
        color: '#e8eaf0',
        depth: 1,
        isProfile: true,
      })
    }

    for (let ri = 0; ri < 3; ri++) {
      const actors = ringActors[ri]
      const baseAngles = ringBaseAngles[ri]
      const rx = RING_RADII[ri]
      const ry = getRingRy(rx)
      actors.forEach((actor, i) => {
        const theta = baseAngles[i] + angleOffset
        result.push({
          node: actor,
          x: CX + rx * Math.cos(theta),
          y: CY + ry * Math.sin(theta),
          radius: Math.max(7, Math.min(17, ((actor.pfScore ?? 30) / 100) * 21)),
          color: getNodeColor(actor),
          depth: (Math.sin(theta) + 1) / 2,
          isProfile: false,
        })
      })
    }

    return result
  }

  function drawRings(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
    ctx.lineWidth = 1
    ctx.setLineDash([2, 7])
    for (const radius of RING_RADII) {
      ctx.beginPath()
      ctx.ellipse(CX, CY, radius, getRingRy(radius), 0, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.setLineDash([])
  }

  function drawNode(ctx: CanvasRenderingContext2D, p: PositionedNode, hovered: string | null) {
    const { x, y, radius, color, depth, isProfile, node } = p
    const scale = isProfile ? 1 : 0.68 + 0.32 * depth
    const r = radius * scale

    ctx.save()
    ctx.globalAlpha = isProfile ? 1 : 0.45 + 0.55 * depth

    // Drop shadow under sphere
    ctx.beginPath()
    ctx.ellipse(x, y + r * 0.85, r * 0.7, r * 0.18, 0, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.fill()

    // Glow ring for profile actor
    if (isProfile) {
      ctx.beginPath()
      ctx.arc(x, y, r + 7, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(232,234,240,0.2)'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }

    // Hover highlight
    if (hovered === node.id && !isProfile) {
      ctx.beginPath()
      ctx.arc(x, y, r + 4, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // Base sphere gradient
    const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.05, x, y, r)
    grad.addColorStop(0, lightenColor(color, 0.55))
    grad.addColorStop(0.4, color)
    grad.addColorStop(1, darkenColor(color, 0.45))
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()

    // Tight specular highlight
    const spec = ctx.createRadialGradient(
      x - r * 0.28, y - r * 0.28, 0,
      x - r * 0.28, y - r * 0.28, r * 0.42
    )
    spec.addColorStop(0, 'rgba(255,255,255,0.55)')
    spec.addColorStop(0.5, 'rgba(255,255,255,0.12)')
    spec.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = spec
    ctx.fill()

    ctx.restore()
  }

  function drawLabel(ctx: CanvasRenderingContext2D, p: PositionedNode) {
    const { x, y, radius, depth, isProfile, node } = p
    const scale = isProfile ? 1 : 0.68 + 0.32 * depth
    const r = radius * scale
    const labelY = isProfile ? y - r - 10 : y + r + 14
    const name = isProfile ? node.name : getDisplayName(node.name)
    const fontSize = isProfile ? 11 : 9.5
    const alpha = isProfile ? 1 : Math.max(0, (depth - 0.2) / 0.8)

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.font = `${isProfile ? '600' : '400'} ${fontSize}px -apple-system, system-ui, sans-serif`
    ctx.textAlign = 'center'

    const metrics = ctx.measureText(name)
    const padX = 4
    const padY = 2

    // Dark pill background for legibility
    ctx.fillStyle = 'rgba(10,14,26,0.65)'
    ctx.beginPath()
    ctx.roundRect(
      x - metrics.width / 2 - padX,
      labelY - fontSize + 1 - padY,
      metrics.width + padX * 2,
      fontSize + padY * 2,
      3
    )
    ctx.fill()

    ctx.fillStyle = isProfile ? 'rgba(232,234,240,1)' : 'rgba(160,168,180,0.95)'
    ctx.fillText(name, x, labelY)
    ctx.restore()
  }

  function draw(ctx: CanvasRenderingContext2D, angleOffset: number, hovered: string | null) {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
    drawRings(ctx)
    const positioned = computePositions(angleOffset)
    positioned.sort((a, b) => a.depth - b.depth)
    for (const p of positioned) drawNode(ctx, p, hovered)
    for (const p of positioned) {
      if (p.isProfile || p.depth > 0.2) drawLabel(ctx, p)
    }
  }

  // Animation loop — re-binds when hoveredId changes so draw closure stays fresh
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = CANVAS_W * dpr
    canvas.height = CANVAS_H * dpr
    canvas.style.width = `${CANVAS_W}px`
    canvas.style.height = `${CANVAS_H}px`
    ctx.scale(dpr, dpr)

    let running = true
    function loop() {
      if (!running) return
      if (!isPausedRef.current) angleRef.current += 0.00022
      draw(ctx!, angleRef.current, hoveredId)
      animRef.current = requestAnimationFrame(loop)
    }
    loop()
    return () => {
      running = false
      cancelAnimationFrame(animRef.current)
    }
  }, [hoveredId]) // eslint-disable-line react-hooks/exhaustive-deps

  // --- mouse interaction ---
  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const positioned = computePositions(angleRef.current)
    let found: string | null = null
    for (const p of [...positioned].sort((a, b) => b.depth - a.depth)) {
      if (p.isProfile) continue
      const r = p.radius * (0.68 + 0.32 * p.depth)
      if (Math.hypot(mx - p.x, my - p.y) <= r) {
        found = p.node.id
        break
      }
    }
    if (found !== hoveredId) setHoveredId(found)
  }

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const positioned = computePositions(angleRef.current)
    for (const p of [...positioned].sort((a, b) => b.depth - a.depth)) {
      if (p.isProfile) continue
      const r = p.radius * (0.68 + 0.32 * p.depth)
      if (Math.hypot(mx - p.x, my - p.y) <= r) {
        router.push(`/actors/${p.node.slug}`)
        return
      }
    }
  }

  // All hooks called above — guard is safe here
  if (nodes.length <= 2) return null

  const presentTypes = new Set(relNodes.map(n => n.relationshipType ?? 'Neutral'))
  const legendItems = LEGEND_GROUPS.filter(g => g.keys.some(k => presentTypes.has(k)))

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', cursor: hoveredId ? 'pointer' : 'default' }}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onMouseEnter={() => { isPausedRef.current = true }}
        onMouseLeave={() => { setHoveredId(null); isPausedRef.current = false }}
      />
      {legendItems.length > 0 && (
        <div className="flex items-center gap-4 px-4 pb-3 flex-wrap">
          {legendItems.map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <svg width="6" height="6">
                <circle cx="3" cy="3" r="3" fill={BASE_COLORS[item.colorKey]} />
              </svg>
              <span style={{ fontSize: '10px', color: 'var(--muted)' }}>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
