"use client"

import * as React from "react"
import {
  BrainCircuit,
  FileCode,
  GitBranch,
  GitCommit,
  Layers3,
  Minus,
  MousePointer2,
  Move3D,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"

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
  color: string
  borderColor: string
  data?: Commit | CommitFile | null
  commitId?: string
  fileStatus?: string
  pinned?: boolean
  hue: number
}

interface Edge {
  source: string
  target: string
  color: string
}

const THEME = {
  bg: "#08080c",
  bgSoft: "#101017",
  panel: "#13131a",
  panel2: "#181821",
  panel3: "#1f1f29",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.12)",
  text: "#f5f3ef",
  muted: "#b3b0bb",
  subtle: "#73707d",
  accent: "#a78bfa",
  accent2: "#60a5fa",
  success: "#4ade80",
  warning: "#fbbf24",
  danger: "#fb7185",
  info: "#38bdf8",
  repo: "#f3cf8b",
}

const COMMIT_COLORS = [
  "#a78bfa",
  "#60a5fa",
  "#38bdf8",
  "#4ade80",
  "#fbbf24",
  "#f97316",
  "#f472b6",
  "#c084fc",
  "#22c55e",
  "#fb7185",
]

const FILE_STATUS: Record<string, { fill: string; border: string; glow: string }> = {
  added: { fill: "#4ade80", border: "#4ade8050", glow: "#4ade8022" },
  removed: { fill: "#fb7185", border: "#fb718550", glow: "#fb718522" },
  deleted: { fill: "#fb7185", border: "#fb718550", glow: "#fb718522" },
  modified: { fill: "#fbbf24", border: "#fbbf2450", glow: "#fbbf2422" },
  renamed: { fill: "#a78bfa", border: "#a78bfa50", glow: "#a78bfa22" },
  copied: { fill: "#38bdf8", border: "#38bdf850", glow: "#38bdf822" },
}

function getFileStatus(status?: string) {
  if (!status) return FILE_STATUS.modified
  return FILE_STATUS[status.toLowerCase()] ?? FILE_STATUS.modified
}

function truncateLabel(str: string, maxLen: number) {
  return str.length <= maxLen ? str : `${str.slice(0, maxLen - 1)}…`
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + width - r, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + r)
  ctx.lineTo(x + width, y + height - r)
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  ctx.lineTo(x + r, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function drawNode(
  ctx: CanvasRenderingContext2D,
  node: Node,
  selected: boolean,
  highlighted: boolean,
  alpha = 1,
) {
  const { x, y, radius, borderColor, color, type, label } = node

  ctx.save()
  ctx.globalAlpha = alpha

  const glowColor = selected
    ? `${borderColor}66`
    : highlighted
      ? `${borderColor}3a`
      : `${borderColor}18`

  if (selected || highlighted) {
    const glow = ctx.createRadialGradient(x, y, radius * 0.4, x, y, radius * 2.6)
    glow.addColorStop(0, glowColor)
    glow.addColorStop(1, `${borderColor}00`)
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(x, y, radius * 2.6, 0, Math.PI * 2)
    ctx.fill()
  }

  if (type === "repo") {
    const halo = ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius * 1.55)
    halo.addColorStop(0, `${THEME.repo}18`)
    halo.addColorStop(0.55, `${borderColor}28`)
    halo.addColorStop(1, `${borderColor}00`)
    ctx.fillStyle = halo
    ctx.beginPath()
    ctx.arc(x, y, radius * 1.55, 0, Math.PI * 2)
    ctx.fill()

    const fill = ctx.createRadialGradient(x - radius * 0.15, y - radius * 0.18, radius * 0.2, x, y, radius)
    fill.addColorStop(0, "#20202a")
    fill.addColorStop(1, color)
    ctx.fillStyle = fill
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()

    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.lineWidth = selected ? 2.25 : highlighted ? 1.6 : 1.15
    ctx.strokeStyle = selected ? borderColor : `${borderColor}aa`
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(x, y, radius * 0.64, 0, Math.PI * 2)
    ctx.strokeStyle = `${THEME.repo}${selected ? "66" : "3a"}`
    ctx.lineWidth = 1
    ctx.stroke()

    const ringDots = 5
    for (let i = 0; i < ringDots; i++) {
      const angle = -Math.PI / 2 + (i / ringDots) * Math.PI * 2
      const dotX = x + Math.cos(angle) * (radius * 1.1)
      const dotY = y + Math.sin(angle) * (radius * 1.1)
      ctx.beginPath()
      ctx.arc(dotX, dotY, 1.35, 0, Math.PI * 2)
      ctx.fillStyle = `${THEME.repo}${selected ? "99" : "55"}`
      ctx.fill()
    }

    ctx.fillStyle = THEME.text
    ctx.font = `${selected ? "700 " : "600 "}10px ui-monospace, SFMono-Regular, Menlo, monospace`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(truncateLabel(label, 10), x, y - 1)
    ctx.fillStyle = THEME.repo
    ctx.font = "600 8px ui-monospace, SFMono-Regular, Menlo, monospace"
    ctx.fillText("repo", x, y + 10)
  } else if (type === "commit") {
    const fill = ctx.createRadialGradient(x - radius * 0.18, y - radius * 0.18, radius * 0.2, x, y, radius * 1.2)
    fill.addColorStop(0, "#262631")
    fill.addColorStop(1, color)
    ctx.fillStyle = fill
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()

    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.lineWidth = selected ? 2.15 : highlighted ? 1.55 : 1
    ctx.strokeStyle = selected ? borderColor : `${borderColor}c0`
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(x, y, radius * 0.36, 0, Math.PI * 2)
    ctx.fillStyle = selected ? THEME.text : `${THEME.text}cc`
    ctx.fill()

    ctx.fillStyle = selected ? THEME.text : highlighted ? THEME.muted : THEME.subtle
    ctx.font = `${selected ? "700 " : "600 "}8.5px ui-monospace, SFMono-Regular, Menlo, monospace`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(label, x, y + radius + 11)
  } else {
    const w = Math.max(62, Math.min(130, label.length * 6.3 + 24))
    const h = 22
    const left = x - w / 2
    const top = y - h / 2

    const fill = ctx.createLinearGradient(left, top, left + w, top + h)
    fill.addColorStop(0, `${node.borderColor}24`)
    fill.addColorStop(1, `${color}`)
    ctx.fillStyle = fill
    roundRectPath(ctx, left, top, w, h, 10)
    ctx.fill()

    ctx.strokeStyle = selected ? borderColor : highlighted ? `${borderColor}b0` : `${borderColor}88`
    ctx.lineWidth = selected ? 1.7 : 1
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(left + 11, y, 2.2, 0, Math.PI * 2)
    ctx.fillStyle = borderColor
    ctx.fill()

    ctx.fillStyle = selected ? THEME.text : highlighted ? THEME.muted : "#d7d4de"
    ctx.font = `${selected ? "700 " : "600 "}8.5px ui-monospace, SFMono-Regular, Menlo, monospace`
    ctx.textAlign = "left"
    ctx.textBaseline = "middle"
    ctx.fillText(truncateLabel(label, 18), left + 18, y + 0.5)
  }

  ctx.restore()
}

export function MemoryGraph({ commits = [], repoName = "Repository", onQueryCommit }: MemoryGraphProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const nodesRef = React.useRef<Node[]>([])
  const edgesRef = React.useRef<Edge[]>([])
  const animFrameRef = React.useRef<number>(0)
  const tickCountRef = React.useRef(0)
  const stabilizedRef = React.useRef(false)

  const offsetRef = React.useRef({ x: 0, y: 0 })
  const scaleRef = React.useRef(1)

  const draggingNodeRef = React.useRef<Node | null>(null)
  const isPanningRef = React.useRef(false)
  const pointerDownPosRef = React.useRef({ x: 0, y: 0 })
  const lastPointerRef = React.useRef({ x: 0, y: 0 })

  const [selectedSelection, setSelectedSelection] = React.useState<{ id: string; type: NodeType } | null>(null)
  const selectedNodeRef = React.useRef<string | null>(null)
  const [size, setSize] = React.useState({ w: 800, h: 500 })

  React.useEffect(() => {
    const w = size.w
    const h = size.h
    const cx = w / 2
    const cy = h / 2
    const nodes: Node[] = []
    const edges: Edge[] = []

    nodes.push({
      id: "repo",
      type: "repo",
      label: repoName,
      x: cx,
      y: cy,
      vx: 0,
      vy: 0,
      radius: 38,
      color: THEME.panel3,
      borderColor: THEME.repo,
      hue: 45,
      pinned: true,
    })

    const visibleCommits = commits.slice(0, 30)

    visibleCommits.forEach((commit, ci) => {
      const angle = visibleCommits.length ? (ci / visibleCommits.length) * Math.PI * 2 - Math.PI / 2 : 0
      const dist = Math.min(w, h) * 0.25
      const commitColor = COMMIT_COLORS[ci % COMMIT_COLORS.length]

      const cNode: Node = {
        id: commit.id,
        type: "commit",
        label: commit.sha.slice(0, 7),
        x: cx + Math.cos(angle) * dist + (Math.random() - 0.5) * 18,
        y: cy + Math.sin(angle) * dist + (Math.random() - 0.5) * 18,
        vx: 0,
        vy: 0,
        radius: 18,
        color: THEME.panel2,
        borderColor: commitColor,
        hue: ci * 24,
        data: commit,
      }
      nodes.push(cNode)
      edges.push({ source: "repo", target: commit.id, color: `${commitColor}55` })

      const visFiles = commit.files.slice(0, 7)
      visFiles.forEach((file, fi) => {
        const spread = Math.min(1.4, (1.1 * visFiles.length) / 8)
        const fAngle = angle + ((fi - (visFiles.length - 1) / 2) / visFiles.length) * spread
        const fDist = dist + 86 + Math.random() * 16
        const fId = `file-${file.id}`
        const fs = getFileStatus(file.status)

        nodes.push({
          id: fId,
          type: "file",
          label: file.filePath.split("/").pop() ?? file.filePath,
          x: cx + Math.cos(fAngle) * fDist,
          y: cy + Math.sin(fAngle) * fDist,
          vx: 0,
          vy: 0,
          radius: 20,
          color: `${fs.fill}18`,
          borderColor: fs.fill,
          hue: 0,
          data: file,
          commitId: commit.id,
          fileStatus: file.status,
        })
        edges.push({ source: commit.id, target: fId, color: fs.fill + "40" })
      })
    })

    nodesRef.current = nodes
    edgesRef.current = edges
    tickCountRef.current = 0
    stabilizedRef.current = false
    selectedNodeRef.current = null
    offsetRef.current = { x: 0, y: 0 }
    scaleRef.current = 1
  }, [commits, repoName, size.w, size.h])

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

      if (!stabilizedRef.current) {
        const t = tickCountRef.current++
        const alpha = Math.max(0, 0.45 * Math.exp(-t * 0.018))

        if (alpha < 0.001) {
          stabilizedRef.current = true
        } else {
          const MAX_REP_DIST = 230
          for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
              const a = nodes[i]
              const b = nodes[j]
              const dx = b.x - a.x
              const dy = b.y - a.y
              if (Math.abs(dx) > MAX_REP_DIST || Math.abs(dy) > MAX_REP_DIST) continue
              const dist2 = dx * dx + dy * dy
              const minDist = a.radius + b.radius + 42
              const dist = Math.sqrt(dist2) || 1
              if (dist < minDist) {
                const force = ((minDist - dist) / dist) * 0.5 * alpha
                const fx = dx * force
                const fy = dy * force
                if (!a.pinned) {
                  a.vx -= fx
                  a.vy -= fy
                }
                if (!b.pinned) {
                  b.vx += fx
                  b.vy += fy
                }
              }
            }
          }

          const idealLen: Record<string, number> = { "repo-commit": 172, "commit-file": 90 }
          for (const edge of edges) {
            const a = nodes.find((n) => n.id === edge.source)
            const b = nodes.find((n) => n.id === edge.target)
            if (!a || !b) continue
            const dx = b.x - a.x
            const dy = b.y - a.y
            const dist = Math.sqrt(dx * dx + dy * dy) || 1
            const key = a.type === "repo" ? "repo-commit" : "commit-file"
            const ideal = idealLen[key] ?? 130
            const force = ((dist - ideal) / dist) * 0.14 * alpha
            if (!a.pinned) {
              a.vx += dx * force
              a.vy += dy * force
            }
            if (!b.pinned) {
              b.vx -= dx * force
              b.vy -= dy * force
            }
          }

          for (const node of nodes) {
            if (node.pinned) continue
            node.vx += (cx - node.x) * 0.0027 * alpha
            node.vy += (cy - node.y) * 0.0027 * alpha
          }

          for (const node of nodes) {
            if (node.pinned || node === draggingNodeRef.current) continue
            node.vx *= 0.8
            node.vy *= 0.8
            node.x += node.vx
            node.y += node.vy
          }
        }
      }

      const scale = scaleRef.current
      const ox = offsetRef.current.x
      const oy = offsetRef.current.y

      ctx.clearRect(0, 0, W, H)

      const base = ctx.createLinearGradient(0, 0, 0, H)
      base.addColorStop(0, THEME.bgSoft)
      base.addColorStop(1, THEME.bg)
      ctx.fillStyle = base
      ctx.fillRect(0, 0, W, H)

      const orbA = ctx.createRadialGradient(W * 0.18, H * 0.18, 0, W * 0.18, H * 0.18, Math.max(W, H) * 0.55)
      orbA.addColorStop(0, "rgba(167,139,250,0.18)")
      orbA.addColorStop(0.45, "rgba(167,139,250,0.05)")
      orbA.addColorStop(1, "rgba(167,139,250,0)")
      ctx.fillStyle = orbA
      ctx.fillRect(0, 0, W, H)

      const orbB = ctx.createRadialGradient(W * 0.82, H * 0.28, 0, W * 0.82, H * 0.28, Math.max(W, H) * 0.45)
      orbB.addColorStop(0, "rgba(56,189,248,0.12)")
      orbB.addColorStop(0.5, "rgba(56,189,248,0.03)")
      orbB.addColorStop(1, "rgba(56,189,248,0)")
      ctx.fillStyle = orbB
      ctx.fillRect(0, 0, W, H)

      ctx.save()
      ctx.translate(ox, oy)
      ctx.scale(scale, scale)

      const grid = 48
      const gx0 = Math.floor((-ox / scale) / grid) * grid
      const gy0 = Math.floor((-oy / scale) / grid) * grid
      const gx1 = gx0 + W / scale + grid * 2
      const gy1 = gy0 + H / scale + grid * 2

      ctx.strokeStyle = "rgba(255,255,255,0.035)"
      ctx.lineWidth = 1
      for (let gx = gx0; gx < gx1; gx += grid) {
        ctx.beginPath()
        ctx.moveTo(gx, gy0)
        ctx.lineTo(gx, gy1)
        ctx.stroke()
      }
      for (let gy = gy0; gy < gy1; gy += grid) {
        ctx.beginPath()
        ctx.moveTo(gx0, gy)
        ctx.lineTo(gx1, gy)
        ctx.stroke()
      }

      const nodeById = new Map(nodes.map((node) => [node.id, node]))
      const sel = selectedNodeRef.current ? nodeById.get(selectedNodeRef.current) ?? null : null

      for (const edge of edges) {
        const a = nodeById.get(edge.source)
        const b = nodeById.get(edge.target)
        if (!a || !b) continue

        const isLit = sel && (sel.id === a.id || sel.id === b.id || sel.commitId === a.id)

        ctx.save()
        ctx.beginPath()
        const mx = (a.x + b.x) / 2 + (b.y - a.y) * 0.1
        const my = (a.y + b.y) / 2 - (b.x - a.x) * 0.1
        ctx.moveTo(a.x, a.y)
        ctx.quadraticCurveTo(mx, my, b.x, b.y)

        if (isLit) {
          const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y)
          grad.addColorStop(0, `${a.borderColor}e6`)
          grad.addColorStop(1, `${b.borderColor}cc`)
          ctx.strokeStyle = grad
          ctx.lineWidth = 1.55
        } else {
          ctx.strokeStyle = sel ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"
          ctx.lineWidth = 0.9
        }

        ctx.stroke()
        ctx.restore()
      }

      for (const node of nodes) {
        const isSelected = sel?.id === node.id
        const isHighlighted =
          !!sel &&
          !isSelected &&
          (node.commitId === sel.id ||
            sel.commitId === node.id ||
            sel.type === "repo" ||
            edges.some(
              (edge) =>
                (edge.source === sel.id && edge.target === node.id) ||
                (edge.target === sel.id && edge.source === node.id),
            ))

        const alpha = sel && !isSelected && !isHighlighted ? 0.24 : 1
        drawNode(ctx, node, isSelected, isHighlighted, alpha)
      }

      ctx.restore()
    }

    animFrameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [size])

  function canvasToWorld(px: number, py: number) {
    return {
      x: (px - offsetRef.current.x) / scaleRef.current,
      y: (py - offsetRef.current.y) / scaleRef.current,
    }
  }

  function hitTest(wx: number, wy: number) {
    const nodes = nodesRef.current
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i]
      const dx = node.x - wx
      const dy = node.y - wy
      if (dx * dx + dy * dy <= (node.radius + 10) ** 2) return node
    }
    return null
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    const world = canvasToWorld(cx, cy)
    const hit = hitTest(world.x, world.y)

    pointerDownPosRef.current = { x: cx, y: cy }
    lastPointerRef.current = { x: cx, y: cy }

    if (hit) {
      draggingNodeRef.current = hit
      stabilizedRef.current = false
      ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
    } else {
      isPanningRef.current = true
      ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
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
      const world = canvasToWorld(cx, cy)
      draggingNodeRef.current.x = world.x
      draggingNodeRef.current.y = world.y
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
    const totalDx = cx - pointerDownPosRef.current.x
    const totalDy = cy - pointerDownPosRef.current.y
    const movedFar = totalDx * totalDx + totalDy * totalDy > 36

    if (draggingNodeRef.current) {
      if (!movedFar) {
        const node = draggingNodeRef.current
        const nextId = selectedNodeRef.current === node.id ? null : node.id
        selectedNodeRef.current = nextId
        setSelectedSelection(nextId ? { id: node.id, type: node.type } : null)
      } else {
        draggingNodeRef.current.vx = 0
        draggingNodeRef.current.vy = 0
      }
      draggingNodeRef.current = null
    } else {
      isPanningRef.current = false
      if (!movedFar) {
        selectedNodeRef.current = null
        setSelectedSelection(null)
      }
    }
  }

  const onWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const rect = canvasRef.current!.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    const factor = e.deltaY > 0 ? 0.88 : 1.14
    const newScale = Math.max(0.35, Math.min(3.2, scaleRef.current * factor))
    offsetRef.current.x = cx - (cx - offsetRef.current.x) * (newScale / scaleRef.current)
    offsetRef.current.y = cy - (cy - offsetRef.current.y) * (newScale / scaleRef.current)
    scaleRef.current = newScale
  }

  const selectedNode = React.useMemo(() => {
    if (!selectedSelection) return null

    if (selectedSelection.type === "repo" || selectedSelection.id === "repo") {
      return {
        id: "repo",
        type: "repo" as const,
        label: repoName,
        borderColor: THEME.repo,
      }
    }

    if (selectedSelection.type === "commit") {
      const commit = commits.find((entry) => entry.id === selectedSelection.id)
      if (!commit) return null
      const commitIndex = commits.findIndex((entry) => entry.id === commit.id)
      return {
        id: commit.id,
        type: "commit" as const,
        label: commit.sha.slice(0, 7),
        borderColor: COMMIT_COLORS[Math.max(0, commitIndex) % COMMIT_COLORS.length],
        data: commit,
      }
    }

    if (selectedSelection.type === "file") {
      for (const commit of commits) {
        const file = commit.files.find((entry) => `file-${entry.id}` === selectedSelection.id)
        if (file) {
          return {
            id: `file-${file.id}`,
            type: "file" as const,
            label: file.filePath.split("/").pop() ?? file.filePath,
            borderColor: getFileStatus(file.status).fill,
            commitId: commit.id,
            data: file,
          }
        }
      }
    }

    return null
  }, [selectedSelection, commits, repoName])

  const selectedCommit: Commit | null = React.useMemo(() => {
    if (!selectedNode) return null
    if (selectedNode.type === "commit") return selectedNode.data as Commit
    if (selectedNode.type === "file") return commits.find((commit) => commit.id === selectedNode.commitId) ?? null
    return null
  }, [selectedNode, commits])

  const selectedFile: CommitFile | null = React.useMemo(() => {
    if (selectedNode?.type === "file") return selectedNode.data as CommitFile
    return null
  }, [selectedNode])

  const sidebarOpen = !!selectedNode
  const selectedFileStatus = selectedFile ? getFileStatus(selectedFile.status) : null

  return (
    <div className="relative flex h-full min-h-0 gap-4 overflow-hidden">
      <div
        ref={containerRef}
        className="relative flex-1 min-w-0 overflow-hidden rounded-[2rem] border border-white/8 bg-zinc-950 shadow-[0_24px_80px_rgba(0,0,0,0.42)]"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-white/5 bg-zinc-950/55 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[#f3cf8b] shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
              <BrainCircuit className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-white">
                  Memory Graph
                </span>
                <span className="rounded-full border border-white/8 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-zinc-300">
                  {commits.length} commits
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-400">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/5 px-2 py-0.5">
                  <Layers3 className="h-3 w-3 text-[#a78bfa]" />
                  {commits.reduce((count, commit) => count + commit.files.length, 0)} files
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/5 px-2 py-0.5">
                  <Sparkles className="h-3 w-3 text-[#60a5fa]" />
                  linked by commit and file relationships
                </span>
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-2 text-[11px] text-zinc-400 md:flex">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/6 bg-white/5 px-2.5 py-1">
              <MousePointer2 className="h-3 w-3 text-zinc-300" />
              click to inspect
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/6 bg-white/5 px-2.5 py-1">
              <Move3D className="h-3 w-3 text-zinc-300" />
              drag to pan
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/6 bg-white/5 px-2.5 py-1">
              <Search className="h-3 w-3 text-zinc-300" />
              scroll to zoom
            </span>
          </div>
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

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-3 border-t border-white/5 bg-gradient-to-t from-zinc-950/90 via-zinc-950/45 to-transparent px-4 py-3">
          <div className="max-w-xl rounded-2xl border border-white/6 bg-zinc-950/55 px-3 py-2 text-[11px] text-zinc-300 backdrop-blur-md">
            The repo sits at the center, commits orbit as colored anchors, and files
            branch out as smaller chips. Select a node to reveal the exact diff context.
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <span className="rounded-full border border-white/6 bg-white/5 px-2.5 py-1 text-[10px] font-mono text-zinc-400">
              repo memory
            </span>
            <span className="rounded-full border border-white/6 bg-white/5 px-2.5 py-1 text-[10px] font-mono text-zinc-400">
              commit lineage
            </span>
            <span className="rounded-full border border-white/6 bg-white/5 px-2.5 py-1 text-[10px] font-mono text-zinc-400">
              file diffs
            </span>
          </div>
        </div>

        {commits.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-white/8 bg-white/5 text-[#f3cf8b] shadow-[0_0_50px_rgba(167,139,250,0.08)]">
              <BrainCircuit className="h-7 w-7" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-white">No commits indexed yet</p>
              <p className="mt-1 text-xs text-zinc-500">
                Add a repository to see the graph come alive.
              </p>
            </div>
          </div>
        )}
      </div>

      <div
        className="flex shrink-0 flex-col overflow-hidden rounded-[2rem] border border-white/8 bg-zinc-950/80 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl transition-all duration-200"
        style={{
          width: sidebarOpen ? "19rem" : "0",
          opacity: sidebarOpen ? 1 : 0,
          borderColor: sidebarOpen ? "rgba(255,255,255,0.09)" : "transparent",
        }}
      >
        {selectedNode && (
          <>
            <div className="flex items-center justify-between border-b border-white/6 bg-white/[0.03] px-4 py-3">
              <div className="min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-zinc-500">
                  Selection
                </div>
                <div className="mt-1 flex items-center gap-2">
                  {selectedNode.type === "commit" ? (
                    <GitCommit className="h-4 w-4 shrink-0 text-[#a78bfa]" />
                  ) : selectedNode.type === "file" ? (
                    <FileCode className="h-4 w-4 shrink-0 text-[#60a5fa]" />
                  ) : (
                    <GitBranch className="h-4 w-4 shrink-0 text-[#f3cf8b]" />
                  )}
                  <span className="truncate text-sm font-semibold text-white">
                    {selectedNode.type === "repo" ? repoName : selectedNode.label}
                  </span>
                </div>
              </div>
                <button
                  onClick={() => {
                    selectedNodeRef.current = null
                    setSelectedSelection(null)
                  }}
                className="rounded-full border border-white/8 bg-white/5 p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close selection"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="space-y-4 p-4">
                {selectedNode.type === "repo" && (
                  <>
                    <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-4">
                      <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-zinc-500">
                        Repository
                      </div>
                      <div className="mt-2 text-base font-semibold text-[#f3cf8b] break-all">
                        {repoName}
                      </div>
                      <p className="mt-2 text-xs leading-6 text-zinc-400">
                        The root node anchors every commit and file in the graph.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {[
                        ["Commits", commits.length],
                        ["Files", commits.reduce((count, commit) => count + commit.files.length, 0)],
                      ].map(([label, value]) => (
                        <div key={String(label)} className="rounded-[1.15rem] border border-white/8 bg-white/[0.03] p-3">
                          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">
                            {label}
                          </div>
                          <div className="mt-2 text-2xl font-semibold text-white">
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {selectedCommit && (
                  <div className="space-y-3">
                    <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em]"
                          style={{
                            borderColor: `${selectedNode.borderColor}55`,
                            background: `${selectedNode.borderColor}16`,
                            color: selectedNode.borderColor,
                          }}
                        >
                          {selectedCommit.sha.slice(0, 7)}
                        </span>
                        <span className="rounded-full border border-white/8 bg-white/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                          {selectedCommit.files.length} files
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-zinc-200">
                        {selectedCommit.message}
                      </p>

                      <div className="mt-4 flex items-center gap-3">
                        {selectedCommit.authorImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={selectedCommit.authorImage}
                            alt={selectedCommit.authorName ?? "Author"}
                            className="h-9 w-9 rounded-full object-cover ring-1 ring-white/10"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none"
                            }}
                          />
                        ) : (
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ring-1 ring-white/10"
                            style={{
                              background: `${selectedNode.borderColor}18`,
                              color: selectedNode.borderColor,
                            }}
                          >
                            {(selectedCommit.authorName ?? "?")
                              .trim()
                              .split(/\s+/)
                              .slice(0, 2)
                              .map((part) => part[0]?.toUpperCase() ?? "")
                              .join("")}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-white">
                            {selectedCommit.authorName ?? "Unknown author"}
                          </div>
                          <div className="text-[11px] text-zinc-500">
                            {new Date(selectedCommit.committedAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => onQueryCommit?.(selectedCommit.sha)}
                      className="w-full rounded-2xl border border-[#a78bfa]/25 bg-[#a78bfa] px-4 py-5 text-xs font-semibold text-zinc-950 shadow-[0_14px_30px_rgba(167,139,250,0.16)] transition-transform hover:scale-[1.01] hover:bg-[#c4b5fd] cursor-pointer"
                    >
                      <BrainCircuit className="h-4 w-4" />
                      Ask AI about this commit
                    </Button>
                  </div>
                )}

                {selectedFile && selectedFileStatus && (() => {
                  const total = selectedFile.additions + selectedFile.deletions
                  const addPct = total > 0 ? (selectedFile.additions / total) * 100 : 0

                  return (
                    <div className="space-y-3 rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-4">
                      <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-zinc-500">
                        Changed file
                      </div>
                      <p className="break-all font-mono text-[11px] leading-6 text-zinc-300">
                        {selectedFile.filePath}
                      </p>
                      <span
                        className="inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
                        style={{
                          color: selectedFileStatus.fill,
                          background: selectedFileStatus.glow,
                          borderColor: selectedFileStatus.border,
                        }}
                      >
                        {selectedFile.status ?? "modified"}
                      </span>
                      <div className="space-y-2">
                        <div className="flex items-center gap-4 text-[11px] font-mono">
                          <span className="inline-flex items-center gap-1.5 text-[#4ade80]">
                            <Plus className="h-3 w-3" />
                            {selectedFile.additions}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-[#fb7185]">
                            <Minus className="h-3 w-3" />
                            {selectedFile.deletions}
                          </span>
                        </div>
                        {total > 0 && (
                          <div className="h-1.5 overflow-hidden rounded-full bg-white/6">
                            <div className="h-full rounded-full bg-[#4ade80]" style={{ width: `${addPct}%` }} />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()}

                <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-zinc-500">
                    Legend
                  </div>
                  <div className="mt-3 space-y-2">
                    {[
                      { color: THEME.repo, label: "Repository root" },
                      { color: THEME.accent, label: "Commit node" },
                      { color: THEME.success, label: "Added file" },
                      { color: THEME.danger, label: "Deleted file" },
                      { color: THEME.warning, label: "Modified file" },
                      { color: THEME.info, label: "Copied file" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                        <span className="text-[11px] text-zinc-400">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
