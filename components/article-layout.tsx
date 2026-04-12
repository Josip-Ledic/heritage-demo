"use client"

import { useEffect, useState, useRef } from "react"
import { prepareWithSegments } from "@chenglou/pretext"
import { article } from "@/lib/article-data"
import {
  layoutTextWithObstacle,
  hitTestMotorcycle,
  type TextLine,
  type MotorcyclePosition,
} from "@/lib/text-flow"

export function ArticleLayout() {
  const [lines, setLines] = useState<TextLine[]>([])
  const [motorcyclePos, setMotorcyclePos] = useState<MotorcyclePosition | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [motorcycleStart, setMotorcycleStart] = useState<{ x: number; y: number } | null>(null)
  
  const stageRef = useRef<HTMLDivElement>(null)
  const preparedTextRef = useRef<ReturnType<typeof prepareWithSegments> | null>(null)

  // Font configuration
  const fontSize = 18
  const lineHeight = 30
  const fontFamily = "Crimson Text"
  const font = `${fontSize}px '${fontFamily}'`
  
  // Layout constants
  const GUTTER = 80
  const CONTENT_TOP = 180

  // Prepare text once
  useEffect(() => {
    if (typeof window !== "undefined" && !preparedTextRef.current) {
      preparedTextRef.current = prepareWithSegments(article.content, font, {
        whiteSpace: "normal",
      })
    }
  }, [font])

  // Layout calculation
  useEffect(() => {
    if (!preparedTextRef.current || !stageRef.current) return

    const updateLayout = () => {
      const pageWidth = window.innerWidth
      const pageHeight = window.innerHeight
      const contentWidth = Math.min(pageWidth - GUTTER * 2, 900)
      const contentLeft = (pageWidth - contentWidth) / 2

      // Initialize motorcycle on first layout
      if (!motorcyclePos) {
        const motorcycleWidth = Math.min(contentWidth * 0.3, 200)
        const motorcycleHeight = motorcycleWidth * 0.6
        
        setMotorcyclePos({
          x: contentLeft + contentWidth - motorcycleWidth - 40,
          y: CONTENT_TOP + 80,
          width: motorcycleWidth,
          height: motorcycleHeight,
        })
        return
      }

      // Layout text with obstacle
      const layoutLines = layoutTextWithObstacle(
        preparedTextRef.current!,
        contentWidth,
        lineHeight,
        CONTENT_TOP,
        motorcyclePos ? {
          ...motorcyclePos,
          x: motorcyclePos.x - contentLeft, // Convert to content-relative
        } : null
      )

      // Convert back to page coordinates
      const pageLines = layoutLines.map(line => ({
        ...line,
        x: line.x + contentLeft,
      }))

      setLines(pageLines)
    }

    updateLayout()

    const handleResize = () => updateLayout()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [motorcyclePos, CONTENT_TOP, GUTTER])

  // Pointer handlers
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const handlePointerDown = (e: PointerEvent) => {
      if (!motorcyclePos) return

      const x = e.clientX
      const y = e.clientY

      if (hitTestMotorcycle(x, y, motorcyclePos)) {
        e.preventDefault()
        setIsDragging(true)
        setDragStart({ x, y })
        setMotorcycleStart({ x: motorcyclePos.x, y: motorcyclePos.y })
        stage.setPointerCapture(e.pointerId)
      }
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging || !dragStart || !motorcycleStart || !motorcyclePos) return

      const dx = e.clientX - dragStart.x
      const dy = e.clientY - dragStart.y

      setMotorcyclePos({
        ...motorcyclePos,
        x: motorcycleStart.x + dx,
        y: motorcycleStart.y + dy,
      })
    }

    const handlePointerUp = (e: PointerEvent) => {
      if (isDragging) {
        setIsDragging(false)
        setDragStart(null)
        setMotorcycleStart(null)
        stage.releasePointerCapture(e.pointerId)
      }
    }

    stage.addEventListener("pointerdown", handlePointerDown)
    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
    window.addEventListener("pointercancel", handlePointerUp)

    return () => {
      stage.removeEventListener("pointerdown", handlePointerDown)
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
      window.removeEventListener("pointercancel", handlePointerUp)
    }
  }, [isDragging, dragStart, motorcycleStart, motorcyclePos])

  return (
    <>
      {/* Full-screen stage like the demo */}
      <div
        ref={stageRef}
        className="fixed inset-0 overflow-hidden bg-[#1e3a5f]"
        style={{
          userSelect: isDragging ? "none" : "auto",
          WebkitUserSelect: isDragging ? "none" : "auto",
          cursor: isDragging ? "grabbing" : "default",
        }}
      >
        {/* Header */}
        <div
          className="absolute left-0 right-0 text-center"
          style={{
            top: `${GUTTER}px`,
            zIndex: 2,
          }}
        >
          <div className="text-[#c19a6b] text-xs font-semibold tracking-widest uppercase mb-3">
            HERITAGE Motors
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 px-4">
            {article.title}
          </h1>
        </div>

        {/* Drop cap - first letter */}
        <div
          className="absolute font-bold text-[#c19a6b] pointer-events-none"
          style={{
            left: `${(window.innerWidth - Math.min(window.innerWidth - GUTTER * 2, 900)) / 2}px`,
            top: `${CONTENT_TOP}px`,
            fontSize: "72px",
            lineHeight: "72px",
            zIndex: 2,
          }}
        >
          {article.content[0]}
        </div>

        {/* Text lines */}
        {lines.map((line, index) => (
          <span
            key={index}
            className="absolute whitespace-pre"
            style={{
              left: `${line.x}px`,
              top: `${line.y}px`,
              fontSize: `${fontSize}px`,
              lineHeight: `${lineHeight}px`,
              fontFamily: fontFamily,
              color: "#faf9f6",
              userSelect: "text",
              WebkitUserSelect: "text",
              zIndex: 1,
            }}
          >
            {line.text}
          </span>
        ))}

        {/* Motorcycle orb */}
        {motorcyclePos && (
          <div
            className="absolute rounded-full"
            style={{
              left: `${motorcyclePos.x}px`,
              top: `${motorcyclePos.y}px`,
              width: `${motorcyclePos.width}px`,
              height: `${motorcyclePos.height}px`,
              cursor: isDragging ? "grabbing" : "grab",
              background: `radial-gradient(ellipse at 35% 35%, rgba(196, 163, 90, 0.35), rgba(196, 163, 90, 0.12) 55%, transparent 72%)`,
              boxShadow: `0 0 60px 15px rgba(196, 163, 90, 0.18), 0 0 120px 40px rgba(196, 163, 90, 0.07)`,
              zIndex: 10,
              pointerEvents: "auto",
            }}
          />
        )}

        {/* Hint */}
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 text-xs text-white/20 bg-black/40 px-4 py-2 rounded-full pointer-events-none"
          style={{ zIndex: 100 }}
        >
          Drag the orb · Zero DOM reads
        </div>

        {/* Footer */}
        <div
          className="fixed bottom-4 left-0 right-0 text-center text-xs text-[#faf9f6]/40 pointer-events-none"
          style={{ zIndex: 100 }}
        >
          <p>© 2026 HERITAGE Motors · Crafted with precision</p>
        </div>
      </div>
    </>
  )
}

// Made with Bob
