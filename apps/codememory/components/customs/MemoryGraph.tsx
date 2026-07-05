"use client"

import * as React from "react"
import { BrainCircuit, GitCommit, FileCode, Plus, Minus, X } from "lucide-react"
import { Button } from "@/components/ui/button"

// ─── Types ──────────────────────────────────────────────────────────────────────

type CommitFile = {
  id: string
  filePath: string
  status?: string
  additions: number
  deletions: number
  changes: number
}

type Commit = {
  id: string
  sha: string
  message: string
  authorName: string | null
  authorImage?: string | null
  committedAt: string | Date
  files: CommitFile[]
}

interface MemoryGraphProps {
  commits: Commit[]
  repoName?: string
  onQueryCommit?: (sha: string) => void
}

// ─── Node / Edge Structures ─────────────────────────────────────────────────────

type NodeType = "repo" | "commit" | "file"

interface Node {
  id: string
  type: NodeType
  label: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  // Base HSL values for flexible rendering
  hue: number
  saturation: number
  lightness: number
  data?: Commit | CommitFile | null
  commitId?: string
  fileStatus?: string
  pinned?: boolean
}

interface Edge {
  source: string
  target: string
  hue: number
}

// ─── Color Palette — vivid commit hues ─────────────────────────────────────────

const COMMIT_HUES = [
  260, // violet
  195, // cyan
  340, // pink
  160, // emerald
  30,  // amber
  210, // sky
  290, // fuchsia
  80,  // lime
  15,  // orange
  230, // indigo
  130, // green
  320, // rose
  45,  // yellow
  270, // purple
  185, // teal
  350, // red
  55,  // gold
  250, // blue-violet
  100, // yellow-green
  305, // magenta
]

const FILE_STATUS_HSL: Record<string, [number, number, number]> = {
  added: [152, 72, 52],  // emerald
  removed: [4, 74, 62],  // rose-red
  deleted: [4, 74, 62],
  modified: [42, 92, 58],  // amber
  renamed: [262, 80, 68],  // violet
  copied: [199, 80, 62],  // cyan
}

function fileStatusHSL(status?: string): [number, number, number] {
  if (!status) return FILE_STATUS_HSL.modified
  return FILE_STATUS_HSL[status.toLowerCase()] ?? FILE_STATUS_HSL.modified
}

function hslStr(h: number, s: number, l: number, a = 1) {
  return `hsla(${h},${s}%,${l}%,${a})`
}

function truncateLabel(str: string, maxLen: number) {
  return str.length <= maxLen ? str : str.slice(0, maxLen - 1) + "…"
}

// ─── Canvas Drawing Helpers ─────────────────────────────────────────────────────

function drawGlossyNode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  h: number,
  s: number,
  l: number,
  selected: boolean,
  highlighted: boolean,
  alpha = 1.0,
) {
  const boost = selected ? 1.25 : highlighted ? 1.1 : 1.0

  // ── Outer glow ──────────────────────────────────────────────────────────────
  const glowR = r * (selected ? 3.2 : highlighted ? 2.6 : 2.0)
  const glow = ctx.createRadialGradient(x, y, r * 0.4, x, y, glowR)
  glow.addColorStop(0, hslStr(h, s, l + 10, selected ? 0.55 : 0.3))
  glow.addColorStop(1, hslStr(h, s, l, 0))
  ctx.beginPath()
  ctx.arc(x, y, glowR, 0, Math.PI * 2)
  ctx.fillStyle = glow
  ctx.fill()

  // ── Base sphere gradient ─────────────────────────────────────────────────────
  const baseGrd = ctx.createRadialGradient(x - r * 0.28, y - r * 0.32, r * 0.02, x + r * 0.1, y + r * 0.15, r * 1.1)
  baseGrd.addColorStop(0, hslStr(h, Math.min(s + 10, 100), Math.min(l * boost + 22, 90), alpha))
  baseGrd.addColorStop(0.55, hslStr(h, s, l * boost, alpha))
  baseGrd.addColorStop(1, hslStr(h, Math.min(s + 5, 100), Math.max(l * boost - 22, 8), alpha))
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = baseGrd
  ctx.fill()

  // ── Inner rim shadow (gives depth) ──────────────────────────────────────────
  const rimGrd = ctx.createRadialGradient(x, y, r * 0.7, x, y, r)
  rimGrd.addColorStop(0, "rgba(0,0,0,0)")
  rimGrd.addColorStop(1, "rgba(0,0,0,0.35)")
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = rimGrd
  ctx.fill()

  // ── Specular highlight (glossy top-left spot) ────────────────────────────────
  const hx = x - r * 0.3
  const hy = y - r * 0.32
  const specR = r * 0.55
  const spec = ctx.createRadialGradient(hx, hy, 0, hx, hy, specR)
  spec.addColorStop(0, `rgba(255,255,255,${selected ? 0.7 : 0.42})`)
  spec.addColorStop(0.45, `rgba(255,255,255,${selected ? 0.18 : 0.1})`)
  spec.addColorStop(1, "rgba(255,255,255,0)")
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = spec
  ctx.fill()

  // ── Border ring ─────────────────────────────────────────────────────────────
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.strokeStyle = hslStr(h, Math.min(s + 20, 100), selected ? 88 : highlighted ? 78 : 68, selected ? 0.9 : 0.55)
  ctx.lineWidth = selected ? 2 : 1.2
  ctx.stroke()

  // ── Selection pulse ring ─────────────────────────────────────────────────────
  if (selected) {
    const t = (Date.now() % 1400) / 1400
    const pulseR = r + 9 + t * 13
    const pulseA = (1 - t) * 0.7
    ctx.beginPath()
    ctx.arc(x, y, pulseR, 0, Math.PI * 2)
    ctx.strokeStyle = hslStr(h, s, l + 20, pulseA)
    ctx.lineWidth = 1.5
    ctx.stroke()
  }
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function MemoryGraph({ commits = [], repoName = "Repository", onQueryCommit }: MemoryGraphProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const nodesRef = React.useRef<Node[]>([])
  const edgesRef = React.useRef<Edge[]>([])
  const animFrameRef = React.useRef<number>(0)
  const tickCountRef = React.useRef(0)
  const stabilizedRef = React.useRef(false)

  // Camera
  const offsetRef = React.useRef({ x: 0, y: 0 })
  const scaleRef = React.useRef(1)

  // Drag / pan
  const draggingNodeRef = React.useRef<Node | null>(null)
  const isPanningRef = React.useRef(false)
  const pointerDownPosRef = React.useRef({ x: 0, y: 0 })   // for click detection
  const lastPointerRef = React.useRef({ x: 0, y: 0 })       // for delta movement

  // Selection (dual: ref for canvas loop, state for React re-render)
  const [selectedNode, setSelectedNode] = React.useState<Node | null>(null)
  const selectedNodeRef = React.useRef<Node | null>(null)

  const [size, setSize] = React.useState({ w: 800, h: 500 })

  // ── Build graph nodes & edges ───────────────────────────────────────────────

  React.useEffect(() => {
    const w = size.w
    const h = size.h
    const cx = w / 2
    const cy = h / 2

    const nodes: Node[] = []
    const edges: Edge[] = []

    // Center repo node
    nodes.push({
      id: "repo",
      type: "repo",
      label: repoName,
      x: cx, y: cy, vx: 0, vy: 0,
      radius: 38,
      hue: 265, saturation: 70, lightness: 38,
      pinned: true,
    })

    // Cap for performance — 30 commits, 7 files each = 240 nodes max
    const visibleCommits = commits.slice(0, 30)

    visibleCommits.forEach((commit, ci) => {
      const angle = (ci / visibleCommits.length) * 2 * Math.PI - Math.PI / 2
      const dist = Math.min(w, h) * 0.26
      const commitHue = COMMIT_HUES[ci % COMMIT_HUES.length]

      const cNode: Node = {
        id: commit.id,
        type: "commit",
        label: commit.sha.slice(0, 7),
        x: cx + Math.cos(angle) * dist + (Math.random() - 0.5) * 24,
        y: cy + Math.sin(angle) * dist + (Math.random() - 0.5) * 24,
        vx: 0, vy: 0,
        radius: 19,
        hue: commitHue, saturation: 80, lightness: 45,
        data: commit,
      }
      nodes.push(cNode)
      edges.push({ source: "repo", target: commit.id, hue: commitHue })

      const visFiles = commit.files.slice(0, 7)
      visFiles.forEach((file, fi) => {
        const spread = Math.min(1.5, (1.2 * (visFiles.length)) / 8)
        const fAngle = angle + ((fi - (visFiles.length - 1) / 2) / visFiles.length) * spread
        const fDist = dist + 88 + Math.random() * 18
        const fId = `file-${file.id}`
        const [fh, fs, fl] = fileStatusHSL(file.status)

        nodes.push({
          id: fId,
          type: "file",
          label: file.filePath.split("/").pop() ?? file.filePath,
          x: cx + Math.cos(fAngle) * fDist,
          y: cy + Math.sin(fAngle) * fDist,
          vx: 0, vy: 0,
          radius: 12,
          hue: fh, saturation: fs, lightness: fl,
          data: file,
          commitId: commit.id,
          fileStatus: file.status,
        })
        edges.push({ source: commit.id, target: fId, hue: fh })
      })
    })

    nodesRef.current = nodes
    edgesRef.current = edges
    tickCountRef.current = 0
    stabilizedRef.current = false

    // Clear selection
    selectedNodeRef.current = null
    setSelectedNode(null)

    // Reset camera to center
    offsetRef.current = { x: 0, y: 0 }
    scaleRef.current = 1
  }, [commits, repoName, size.w, size.h])

  // ── Resize observer ─────────────────────────────────────────────────────────

  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight })
    })
    ro.observe(el)
    setSize({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  // ── Render + physics loop ───────────────────────────────────────────────────

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const tick = () => {
      animFrameRef.current = requestAnimationFrame(tick)

      const nodes = nodesRef.current
      const edges = edgesRef.current
      const W = canvas.width
      const H = canvas.height
      const cx = W / 2
      const cy = H / 2

      // ── Physics (only while not yet stabilized) ──────────────────────────────
      if (!stabilizedRef.current) {
        const t = tickCountRef.current++
        // Cooling schedule: strong at start, fades to zero
        const alpha = Math.max(0, 0.45 * Math.exp(-t * 0.018))

        if (alpha < 0.001) {
          stabilizedRef.current = true
        } else {
          // Repulsion — skip pairs that are already far apart (> 220px)
          const MAX_REP_DIST = 220
          for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
              const a = nodes[i]
              const b = nodes[j]
              const dx = b.x - a.x
              const dy = b.y - a.y
              if (Math.abs(dx) > MAX_REP_DIST || Math.abs(dy) > MAX_REP_DIST) continue
              const dist2 = dx * dx + dy * dy
              const minDist = a.radius + b.radius + 55
              const dist = Math.sqrt(dist2) || 1
              if (dist < minDist) {
                const force = ((minDist - dist) / dist) * 0.55 * alpha
                const fx = dx * force
                const fy = dy * force
                if (!a.pinned) { a.vx -= fx; a.vy -= fy }
                if (!b.pinned) { b.vx += fx; b.vy += fy }
              }
            }
          }

          // Spring attraction along edges
          const idealLen: Record<string, number> = { "repo-commit": 175, "commit-file": 88 }
          for (const edge of edges) {
            const a = nodes.find(n => n.id === edge.source)
            const b = nodes.find(n => n.id === edge.target)
            if (!a || !b) continue
            const dx = b.x - a.x
            const dy = b.y - a.y
            const dist = Math.sqrt(dx * dx + dy * dy) || 1
            const key = a.type === "repo" ? "repo-commit" : "commit-file"
            const ideal = idealLen[key] ?? 140
            const force = ((dist - ideal) / dist) * 0.14 * alpha
            if (!a.pinned) { a.vx += dx * force; a.vy += dy * force }
            if (!b.pinned) { b.vx -= dx * force; b.vy -= dy * force }
          }

          // Gravity toward center
          for (const n of nodes) {
            if (n.pinned) continue
            n.vx += (cx - n.x) * 0.003 * alpha
            n.vy += (cy - n.y) * 0.003 * alpha
          }

          // Integrate + damping
          for (const n of nodes) {
            if (n.pinned || n === draggingNodeRef.current) continue
            n.vx *= 0.78
            n.vy *= 0.78
            n.x += n.vx
            n.y += n.vy
          }
        }
      }

      // ── Render ───────────────────────────────────────────────────────────────
      const scale = scaleRef.current
      const ox = offsetRef.current.x
      const oy = offsetRef.current.y

      ctx.clearRect(0, 0, W, H)

      // Background
      const bgGrd = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.75)
      bgGrd.addColorStop(0, "#111018")
      bgGrd.addColorStop(1, "#08080d")
      ctx.fillStyle = bgGrd
      ctx.fillRect(0, 0, W, H)

      ctx.save()
      ctx.translate(ox, oy)
      ctx.scale(scale, scale)

      // Dot grid
      const gs = 44
      const gx0 = Math.floor(-ox / scale / gs) * gs
      const gy0 = Math.floor(-oy / scale / gs) * gs
      const gx1 = gx0 + W / scale + gs * 2
      const gy1 = gy0 + H / scale + gs * 2
      ctx.fillStyle = "rgba(255,255,255,0.035)"
      for (let gx = gx0; gx < gx1; gx += gs) {
        for (let gy = gy0; gy < gy1; gy += gs) {
          ctx.beginPath()
          ctx.arc(gx, gy, 1, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      const sel = selectedNodeRef.current

      // ── Edges ─────────────────────────────────────────────────────────────────
      for (const edge of edges) {
        const a = nodes.find(n => n.id === edge.source)
        const b = nodes.find(n => n.id === edge.target)
        if (!a || !b) continue

        const isLit = sel && (sel.id === a.id || sel.id === b.id || sel.commitId === a.id)

        ctx.save()
        ctx.beginPath()
        const mx = (a.x + b.x) / 2 + (b.y - a.y) * 0.1
        const my = (a.y + b.y) / 2 - (b.x - a.x) * 0.1
        ctx.moveTo(a.x, a.y)
        ctx.quadraticCurveTo(mx, my, b.x, b.y)

        if (isLit) {
          // Glowing animated edge
          const edgeGrd = ctx.createLinearGradient(a.x, a.y, b.x, b.y)
          edgeGrd.addColorStop(0, hslStr(edge.hue, 80, 65, 0.85))
          edgeGrd.addColorStop(1, hslStr(edge.hue, 70, 58, 0.4))
          ctx.strokeStyle = edgeGrd
          ctx.lineWidth = 1.8
          ctx.shadowColor = hslStr(edge.hue, 80, 65, 0.5)
          ctx.shadowBlur = 6
        } else {
          ctx.strokeStyle = hslStr(edge.hue, 40, 35, sel ? 0.12 : 0.3)
          ctx.lineWidth = 0.8
        }
        ctx.stroke()
        ctx.restore()
      }

      // ── Nodes ─────────────────────────────────────────────────────────────────
      for (const node of nodes) {
        const isSelected = sel?.id === node.id
        const isHighlighted =
          sel &&
          !isSelected &&
          (node.commitId === sel.id ||
            sel.commitId === node.id ||
            (sel.type === "repo") ||
            edges.some(e =>
              (e.source === sel.id && e.target === node.id) ||
              (e.target === sel.id && e.source === node.id)
            ))

        const alpha = sel && !isSelected && !isHighlighted ? 0.35 : 1.0

        drawGlossyNode(
          ctx,
          node.x, node.y, node.radius,
          node.hue, node.saturation, node.lightness,
          isSelected, !!isHighlighted, alpha,
        )

        // Labels
        ctx.save()
        ctx.globalAlpha = alpha
        if (node.type === "repo") {
          ctx.fillStyle = "#f4f4f5"
          ctx.font = "bold 9.5px 'SF Mono', monospace"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          const parts = node.label.split("/")
          ctx.fillText(truncateLabel(parts[parts.length - 1], 9), node.x, node.y)
        } else if (node.type === "commit") {
          ctx.fillStyle = isSelected ? "#fff" : isHighlighted ? "#f4f4f5" : "#d4d4d8"
          ctx.font = `${isSelected ? "bold " : ""}8px 'SF Mono', monospace`
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(node.label, node.x, node.y)
        } else if (isSelected || isHighlighted) {
          ctx.fillStyle = isSelected ? "#fff" : "#d4d4d8"
          ctx.font = "6.5px sans-serif"
          ctx.textAlign = "center"
          ctx.textBaseline = "top"
          ctx.fillText(truncateLabel(node.label, 16), node.x, node.y + node.radius + 3)
        }
        ctx.restore()
      }

      ctx.restore()
    }

    animFrameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animFrameRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size])

  // ── Coordinate helpers ──────────────────────────────────────────────────────

  function canvasToWorld(px: number, py: number) {
    return {
      x: (px - offsetRef.current.x) / scaleRef.current,
      y: (py - offsetRef.current.y) / scaleRef.current,
    }
  }

  function hitTest(wx: number, wy: number) {
    const nodes = nodesRef.current
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i]
      const dx = n.x - wx
      const dy = n.y - wy
      if (dx * dx + dy * dy <= (n.radius + 6) ** 2) return n
    }
    return null
  }

  // ── Pointer events ──────────────────────────────────────────────────────────

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    const w = canvasToWorld(cx, cy)
    const hit = hitTest(w.x, w.y)

    // Record down position for click detection (don't use lastPointer for this)
    pointerDownPosRef.current = { x: cx, y: cy }
    lastPointerRef.current = { x: cx, y: cy }

    if (hit) {
      draggingNodeRef.current = hit
      stabilizedRef.current = false // reactivate physics so drag is smooth
        ; (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
    } else {
      isPanningRef.current = true
        ; (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
    }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    const dx = cx - lastPointerRef.current.x
    const dy = cy - lastPointerRef.current.y
    lastPointerRef.current = { x: cx, y: cy }

    if (draggingNodeRef.current) {
      const w = canvasToWorld(cx, cy)
      draggingNodeRef.current.x = w.x
      draggingNodeRef.current.y = w.y
      draggingNodeRef.current.vx = 0
      draggingNodeRef.current.vy = 0
    } else if (isPanningRef.current) {
      offsetRef.current.x += dx
      offsetRef.current.y += dy
    }
  }

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top

    // Use distance from pointerDown position to detect click vs drag
    const totalDx = cx - pointerDownPosRef.current.x
    const totalDy = cy - pointerDownPosRef.current.y
    const movedFar = totalDx * totalDx + totalDy * totalDy > 36  // 6px threshold

    if (draggingNodeRef.current) {
      if (!movedFar) {
        // It was a click — toggle selection
        const node = draggingNodeRef.current
        const next = selectedNodeRef.current?.id === node.id ? null : node
        selectedNodeRef.current = next
        setSelectedNode(next)
      } else {
        // Dropped after drag — pin in place with zero velocity
        draggingNodeRef.current.vx = 0
        draggingNodeRef.current.vy = 0
      }
      draggingNodeRef.current = null
    } else {
      isPanningRef.current = false
      if (!movedFar) {
        // Clicked empty space — deselect
        selectedNodeRef.current = null
        setSelectedNode(null)
      }
    }
  }

  const onWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const rect = canvasRef.current!.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    const factor = e.deltaY > 0 ? 0.88 : 1.14
    const newScale = Math.max(0.25, Math.min(3.5, scaleRef.current * factor))
    offsetRef.current.x = cx - (cx - offsetRef.current.x) * (newScale / scaleRef.current)
    offsetRef.current.y = cy - (cy - offsetRef.current.y) * (newScale / scaleRef.current)
    scaleRef.current = newScale
  }

  // ── Derived state for sidebar ───────────────────────────────────────────────

  const selectedCommit: Commit | null = React.useMemo(() => {
    if (!selectedNode) return null
    if (selectedNode.type === "commit") return selectedNode.data as Commit
    if (selectedNode.type === "file") return commits.find(c => c.id === selectedNode.commitId) ?? null
    return null
  }, [selectedNode, commits])

  const selectedFile: CommitFile | null = React.useMemo(() => {
    if (selectedNode?.type === "file") return selectedNode.data as CommitFile
    return null
  }, [selectedNode])

  const sidebarOpen = !!selectedNode

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="relative flex h-full min-h-0 gap-4 overflow-hidden">
      {/* Canvas panel */}
      <div
        ref={containerRef}
        className="relative flex-1 min-w-0 rounded-2xl overflow-hidden"
        style={{ background: "#08080d", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* HUD overlay */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full animate-pulse"
              style={{ background: "#a78bfa", boxShadow: "0 0 8px 2px rgba(167,139,250,0.6)" }}
            />
            <span className="font-mono text-[11px] text-zinc-400">Memory Graph</span>
            <span
              className="rounded-full px-2 py-0.5 font-mono text-[10px] text-zinc-500"
              style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.04)" }}
            >
              {commits.length} commits · {commits.reduce((s, c) => s + c.files.length, 0)} files
            </span>
          </div>
          <span className="text-[10px] text-zinc-600 font-mono">drag · scroll to zoom · click to inspect</span>
        </div>

        <canvas
          ref={canvasRef}
          width={size.w}
          height={size.h}
          className="block h-full w-full select-none"
          style={{ touchAction: "none", cursor: "grab" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onWheel={onWheel}
        />

        {commits.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div
              className="h-14 w-14 rounded-full flex items-center justify-center"
              style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}
            >
              <BrainCircuit className="h-7 w-7 text-zinc-600" />
            </div>
            <p className="text-xs text-zinc-600 font-mono">No commits indexed yet</p>
          </div>
        )}
      </div>

      {/* Sidebar — slides in */}
      <div
        className="flex flex-col rounded-2xl overflow-hidden transition-all duration-200 shrink-0"
        style={{
          width: sidebarOpen ? "17rem" : "0",
          opacity: sidebarOpen ? 1 : 0,
          border: sidebarOpen ? "1px solid rgba(255,255,255,0.07)" : "none",
          background: sidebarOpen ? "rgba(10,10,16,0.92)" : "transparent",
          backdropFilter: "blur(16px)",
        }}
      >
        {selectedNode && (
          <>
            {/* Sidebar header */}
            <div
              className="flex items-center justify-between shrink-0 px-4 py-3"
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                background: `hsla(${selectedNode.hue},50%,15%,0.6)`,
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                {selectedNode.type === "commit" ? (
                  <GitCommit className="h-3.5 w-3.5 shrink-0" style={{ color: hslStr(selectedNode.hue, 80, 70) }} />
                ) : selectedNode.type === "file" ? (
                  <FileCode className="h-3.5 w-3.5 shrink-0" style={{ color: hslStr(selectedNode.hue, 75, 65) }} />
                ) : (
                  <BrainCircuit className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                )}
                <span className="font-mono text-xs font-semibold text-zinc-100 truncate">
                  {selectedNode.type === "repo" ? repoName : selectedNode.label}
                </span>
              </div>
              <button
                onClick={() => { selectedNodeRef.current = null; setSelectedNode(null) }}
                className="shrink-0 ml-2 rounded-md p-1 transition-colors cursor-pointer"
                style={{ color: "#71717a" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#d4d4d8")}
                onMouseLeave={e => (e.currentTarget.style.color = "#71717a")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {/* Repo node info */}
              {selectedNode.type === "repo" && (
                <>
                  <div
                    className="rounded-xl p-3 space-y-3"
                    style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}
                  >
                    <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">Repository</div>
                    <div className="font-mono text-sm text-violet-300 break-all">{repoName}</div>
                  </div>
                  <div
                    className="rounded-xl p-3 grid grid-cols-2 gap-3"
                    style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}
                  >
                    <div>
                      <div className="text-[10px] text-zinc-500 font-mono mb-1">Commits</div>
                      <div className="text-2xl font-bold text-zinc-100">{commits.length}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500 font-mono mb-1">Total Files</div>
                      <div className="text-2xl font-bold text-zinc-100">
                        {commits.reduce((s, c) => s + c.files.length, 0)}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Commit details */}
              {selectedCommit && (
                <div className="space-y-3">
                  <div
                    className="rounded-xl p-3 space-y-2.5"
                    style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}
                  >
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className="font-mono text-xs px-1.5 py-0.5 rounded"
                        style={{
                          color: hslStr(selectedNode.type === "commit" ? selectedNode.hue : 265, 80, 75),
                          background: hslStr(selectedNode.type === "commit" ? selectedNode.hue : 265, 60, 20, 0.4),
                          border: `1px solid ${hslStr(selectedNode.type === "commit" ? selectedNode.hue : 265, 60, 40, 0.4)}`,
                        }}
                      >
                        {selectedCommit.sha.slice(0, 7)}
                      </span>
                      <span className="font-mono text-[10px] text-zinc-500">
                        {new Date(selectedCommit.committedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-200 leading-relaxed">{selectedCommit.message}</p>

                    {/* Author avatar row */}
                    <div className="flex items-center gap-2.5 pt-0.5">
                      {selectedCommit.authorImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={selectedCommit.authorImage}
                          alt={selectedCommit.authorName ?? "Author"}
                          className="h-7 w-7 rounded-full object-cover ring-1"
                          style={{
                            ringColor: hslStr(selectedNode.type === "commit" ? selectedNode.hue : 265, 70, 55, 0.5),
                            boxShadow: `0 0 0 1.5px ${hslStr(selectedNode.type === "commit" ? selectedNode.hue : 265, 70, 55, 0.45)}`,
                          }}
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
                        />
                      ) : (
                        /* Initials fallback */
                        <div
                          className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                          style={{
                            background: hslStr(selectedNode.type === "commit" ? selectedNode.hue : 265, 65, 28, 0.8),
                            color: hslStr(selectedNode.type === "commit" ? selectedNode.hue : 265, 80, 82),
                            border: `1px solid ${hslStr(selectedNode.type === "commit" ? selectedNode.hue : 265, 60, 50, 0.4)}`,
                          }}
                        >
                          {(selectedCommit.authorName ?? "?")
                            .trim()
                            .split(/\s+/)
                            .slice(0, 2)
                            .map(p => p[0]?.toUpperCase() ?? "")
                            .join("")}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-zinc-300 truncate">
                          {selectedCommit.authorName ?? "Unknown Author"}
                        </div>
                        <div className="text-[10px] text-zinc-600 font-mono">
                          {new Date(selectedCommit.committedAt).toLocaleString(undefined, {
                            month: "short", day: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => onQueryCommit?.(selectedCommit.sha)}
                    className="w-full rounded-full font-medium text-xs gap-2 py-4 cursor-pointer transition-all"
                    style={{
                      background: "#fff",
                      color: "#09090b",
                    }}
                  >
                    <BrainCircuit className="h-4 w-4" />
                    Ask AI about this commit
                  </Button>
                </div>
              )}

              {/* File details */}
              {selectedFile && (
                <div
                  className="rounded-xl p-3 space-y-2.5"
                  style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}
                >
                  <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">Changed File</div>
                  <p className="font-mono text-[11px] text-zinc-300 break-all leading-relaxed">{selectedFile.filePath}</p>
                  <span
                    className="inline-block capitalize rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      color: hslStr(selectedNode.hue, selectedNode.saturation, selectedNode.lightness + 20),
                      background: hslStr(selectedNode.hue, selectedNode.saturation, selectedNode.lightness, 0.18),
                      border: `1px solid ${hslStr(selectedNode.hue, selectedNode.saturation, selectedNode.lightness, 0.4)}`,
                    }}
                  >
                    {selectedFile.status ?? "modified"}
                  </span>
                  <div className="flex items-center gap-4 text-[11px] font-mono pt-0.5">
                    <span className="flex items-center gap-1" style={{ color: "#34d399" }}>
                      <Plus className="h-3 w-3" />{selectedFile.additions}
                    </span>
                    <span className="flex items-center gap-1" style={{ color: "#f87171" }}>
                      <Minus className="h-3 w-3" />{selectedFile.deletions}
                    </span>
                  </div>
                </div>
              )}

              {/* Legend */}
              <div
                className="rounded-xl p-3 space-y-2"
                style={{ border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
              >
                <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-600">Legend</div>
                <div className="space-y-1.5">
                  {([
                    [265, 70, 40, "Repository (center)"],
                    [260, 80, 45, "Commit nodes (each unique color)"],
                    [152, 72, 52, "Added file"],
                    [4, 74, 62, "Deleted / removed file"],
                    [42, 92, 58, "Modified file"],
                  ] as [number, number, number, string][]).map(([h, s, l, label]) => (
                    <div key={label} className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ background: hslStr(h, s, l) }}
                      />
                      <span className="text-[11px] text-zinc-500">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
{/* Sidebar header */ }
            <div
              className="flex items-center justify-between shrink-0 px-4 py-3"
              style={{ borderBottom: "1px solid #30363d", background: "#0d1117" }}
            >
              <div className="flex items-center gap-2 min-w-0">
                {selectedNode.type === "commit" ? (
                  <GitCommit className="h-3.5 w-3.5 shrink-0" style={{ color: hsl(commitHue, 75, 65) }} />
                ) : selectedNode.type === "file" ? (
                  <FileCode className="h-3.5 w-3.5 shrink-0" style={{ color: fileStatus(selectedNode.fileStatus).gh }} />
                ) : (
                  <GitBranch className="h-3.5 w-3.5 shrink-0" style={{ color: "#f0c040" }} />
                )}
                <span className="font-mono text-xs font-semibold truncate" style={{ color: "#e6edf3" }}>
                  {selectedNode.type === "repo" ? repoName : selectedNode.label}
                </span>
              </div>
              <button
                onClick={() => { selectedNodeRef.current = null; setSelectedNode(null) }}
                className="shrink-0 ml-2 rounded-md p-1 cursor-pointer transition-colors"
                style={{ color: "#484f58" }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#e6edf3")}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "#484f58")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0" style={{ scrollbarWidth: "thin", scrollbarColor: "#30363d #161b22" }}>
              <div className="p-4 space-y-3">

                {/* ── Repo stats ─────────────────────────────────────────── */}
                {selectedNode.type === "repo" && (
                  <>
                    <div className="rounded-lg p-3 space-y-2.5" style={{ border: "1px solid #30363d", background: "#0d1117" }}>
                      <div className="text-[10px] uppercase font-mono tracking-wider" style={{ color: "#484f58" }}>Repository</div>
                      <div className="font-mono text-sm break-all" style={{ color: "#f0c040" }}>{repoName}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[["Commits", commits.length], ["Total Files", commits.reduce((s, c) => s + c.files.length, 0)]].map(([label, val]) => (
                        <div key={String(label)} className="rounded-lg p-3" style={{ border: "1px solid #30363d", background: "#0d1117" }}>
                          <div className="text-[10px] font-mono mb-1" style={{ color: "#484f58" }}>{label}</div>
                          <div className="text-xl font-bold" style={{ color: "#e6edf3" }}>{val}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* ── Commit card ────────────────────────────────────────── */}
                {selectedCommit && (
                  <div className="space-y-3">
                    <div className="rounded-lg p-3 space-y-3" style={{ border: "1px solid #30363d", background: "#0d1117" }}>
                      {/* SHA + date row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="font-mono text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: "#3fb950" + "22", color: "#3fb950", border: "1px solid #3fb95044" }}
                        >
                          {selectedCommit.sha.slice(0, 7)}
                        </span>
                        <span className="font-mono text-[10px]" style={{ color: "#484f58" }}>
                          {new Date(selectedCommit.committedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>

                      {/* Message */}
                      <p className="text-xs leading-relaxed" style={{ color: "#e6edf3" }}>
                        {selectedCommit.message}
                      </p>

                      {/* Author row */}
                      <div className="flex items-center gap-2.5 pt-0.5">
                        {selectedCommit.authorImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={selectedCommit.authorImage}
                            alt={selectedCommit.authorName ?? "Author"}
                            className="h-7 w-7 rounded-full object-cover"
                            style={{ boxShadow: `0 0 0 1.5px ${hsl(commitHue, 70, 55, 0.5)}` }}
                            onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
                          />
                        ) : (
                          <div
                            className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                            style={{
                              background: hsl(commitHue, 60, 20),
                              color: hsl(commitHue, 80, 78),
                              border: `1px solid ${hsl(commitHue, 60, 40, 0.4)}`,
                            }}
                          >
                            {(selectedCommit.authorName ?? "?").trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? "").join("")}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-medium truncate" style={{ color: "#c9d1d9" }}>
                            {selectedCommit.authorName ?? "Unknown"}
                          </div>
                          <div className="text-[10px] font-mono" style={{ color: "#484f58" }}>
                            {new Date(selectedCommit.committedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => onQueryCommit?.(selectedCommit.sha)}
                      className="w-full rounded-lg font-medium text-xs gap-2 py-4 cursor-pointer"
                      style={{ background: "#238636", color: "#fff", border: "1px solid #2ea043" }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#2ea043")}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "#238636")}
                    >
                      <BrainCircuit className="h-4 w-4" />
                      Ask AI about this commit
                    </Button>
                  </div>
                )}

                {/* ── File card ──────────────────────────────────────────── */}
                {selectedFile && (() => {
                  const fs = fileStatus(selectedFile.status)
                  return (
                    <div className="rounded-lg p-3 space-y-2.5" style={{ border: "1px solid #30363d", background: "#0d1117" }}>
                      <div className="text-[10px] uppercase font-mono tracking-wider" style={{ color: "#484f58" }}>Changed File</div>
                      <p className="font-mono text-[11px] break-all leading-relaxed" style={{ color: "#c9d1d9" }}>
                        {selectedFile.filePath}
                      </p>
                      <span
                        className="inline-block capitalize rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ color: fs.gh, background: fs.gh + "18", border: `1px solid ${fs.gh}44` }}
                      >
                        {selectedFile.status ?? "modified"}
                      </span>
                      {/* GitHub-style diff stats bar */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center gap-2 text-[11px] font-mono">
                          <span className="flex items-center gap-1" style={{ color: "#3fb950" }}>
                            <Plus className="h-3 w-3" />{selectedFile.additions}
                          </span>
                          <span className="flex items-center gap-1" style={{ color: "#f85149" }}>
                            <Minus className="h-3 w-3" />{selectedFile.deletions}
                          </span>
                        </div>
                        {/* Mini diff bar */}
                        {(selectedFile.additions + selectedFile.deletions) > 0 && (() => {
                          const total = selectedFile.additions + selectedFile.deletions
                          const addPct = (selectedFile.additions / total) * 100
                          return (
                            <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5">
                              <div className="rounded-full" style={{ width: `${addPct}%`, background: "#3fb950" }} />
                              <div className="rounded-full flex-1" style={{ background: "#f85149" }} />
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  )
                })()}

                {/* ── Legend ─────────────────────────────────────────────── */}
                <div className="rounded-lg p-3 space-y-2" style={{ border: "1px solid #21262d", background: "#0d1117" }}>
                  <div className="text-[10px] uppercase font-mono tracking-wider" style={{ color: "#484f58" }}>Legend</div>
                  <div className="space-y-1.5">
                    {([
                      { color: "#f0c040", label: "★ Repository (sun)" },
                      { color: hsl(195, 80, 55), label: "● Commit (planet)" },
                      { color: "#3fb950", label: "◉ Added file" },
                      { color: "#f85149", label: "◉ Deleted file" },
                      { color: "#d29922", label: "◉ Modified file" },
                    ]).map(item => (
                      <div key={item.label} className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full shrink-0" style={{ background: item.color }} />
                        <span className="text-[11px] font-mono" style={{ color: "#484f58" }}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div >
    </div >
  )
}
