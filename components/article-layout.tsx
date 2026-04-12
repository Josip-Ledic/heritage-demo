"use client"

import { useEffect, useState, useRef, useCallback } from "react"
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
  const [containerWidth, setContainerWidth] = useState(0)
  const [motorcyclePos, setMotorcyclePos] = useState<MotorcyclePosition | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [motorcycleStart, setMotorcycleStart] = useState<{ x: number; y: number } | null>(null)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const preparedTextRef = useRef<ReturnType<typeof prepareWithSegments> | null>(null)

  // Font configuration
  const fontSize = 18
  const lineHeight = 36
  const fontFamily = "Crimson Text"
  const font = `${fontSize}px '${fontFamily}'`
  const headerHeight = 300

  // Prepare text once
  useEffect(() => {
    if (typeof window !== "undefined" && !preparedTextRef.current) {
      preparedTextRef.current = prepareWithSegments(article.content, font, {
        whiteSpace: "normal",
      })
    }
  }, [font])

  // Calculate layout
  const calculateLayout = useCallback(() => {
    if (!preparedTextRef.current || containerWidth === 0) return

    const layoutLines = layoutTextWithObstacle(
      preparedTextRef.current,
      containerWidth,
      lineHeight,
      headerHeight,
      motorcyclePos
    )

    setLines(layoutLines)
  }, [containerWidth, lineHeight, headerHeight, motorcyclePos])

  // Initialize motorcycle position
  useEffect(() => {
    if (containerWidth > 0 && !motorcyclePos) {
      const motorcycleWidth = containerWidth * 0.45
      const motorcycleHeight = motorcycleWidth * 0.5
      
      setMotorcyclePos({
        x: containerWidth - motorcycleWidth,
        y: headerHeight + containerWidth * 0.15,
        width: motorcycleWidth,
        height: motorcycleHeight,
      })
    }
  }, [containerWidth, motorcyclePos, headerHeight])

  // Measure container
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setContainerWidth(rect.width)
      }
    }

    updateWidth()

    let timeoutId: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(updateWidth, 250)
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
      clearTimeout(timeoutId)
    }
  }, [])

  // Recalculate layout
  useEffect(() => {
    if (containerWidth > 0 && preparedTextRef.current) {
      calculateLayout()
    }
  }, [containerWidth, calculateLayout])

  // Drag handlers
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!motorcyclePos) return

      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      if (hitTestMotorcycle(x, y, motorcyclePos)) {
        e.preventDefault()
        setIsDragging(true)
        setDragStart({ x: e.clientX, y: e.clientY })
        setMotorcycleStart({ x: motorcyclePos.x, y: motorcyclePos.y })
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      }
    },
    [motorcyclePos]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !dragStart || !motorcycleStart || !motorcyclePos) return

      const dx = e.clientX - dragStart.x
      const dy = e.clientY - dragStart.y

      const newX = Math.max(
        0,
        Math.min(containerWidth - motorcyclePos.width, motorcycleStart.x + dx)
      )
      const newY = Math.max(headerHeight, motorcycleStart.y + dy)

      setMotorcyclePos({
        ...motorcyclePos,
        x: newX,
        y: newY,
      })
    },
    [isDragging, dragStart, motorcycleStart, motorcyclePos, containerWidth, headerHeight]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (isDragging) {
        setIsDragging(false)
        setDragStart(null)
        setMotorcycleStart(null)
        ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
      }
    },
    [isDragging]
  )

  return (
    <div className="min-h-screen bg-[#1e3a5f] text-[#faf9f6]">
      <article className="max-w-[1400px] mx-auto px-16 py-24">
        {/* Header */}
        <header className="mb-16 max-w-2xl">
          <div className="text-[#c19a6b] text-sm font-semibold tracking-wider uppercase mb-4">
            HERITAGE Motors
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 leading-tight">
            {article.title}
          </h1>
          {article.subtitle && (
            <p className="text-xl text-[#faf9f6]/80 mb-6">{article.subtitle}</p>
          )}
          <div className="flex gap-6 text-sm text-[#faf9f6]/60">
            {article.author && <div>By {article.author}</div>}
            {article.date && <div>{article.date}</div>}
          </div>
        </header>

        {/* Content */}
        <div
          ref={containerRef}
          className="relative touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ cursor: isDragging ? "grabbing" : "default" }}
        >
          {/* Motorcycle - Desktop */}
          {motorcyclePos && (
            <div
              className="hidden lg:block absolute z-10"
              style={{
                left: `${motorcyclePos.x}px`,
                top: `${motorcyclePos.y}px`,
                width: `${motorcyclePos.width}px`,
                height: `${motorcyclePos.height}px`,
                cursor: isDragging ? "grabbing" : "grab",
              }}
            >
              <svg viewBox="0 0 800 400" fill="none" className="w-full h-full" style={{ pointerEvents: "none" }}>
                <g fill="#c19a6b">
                  <circle cx="200" cy="300" r="80" />
                  <circle cx="200" cy="300" r="50" fill="#1e3a5f" />
                  <circle cx="600" cy="300" r="80" />
                  <circle cx="600" cy="300" r="50" fill="#1e3a5f" />
                  <path d="M 200 300 L 250 250 L 300 200 L 400 180 L 500 200 L 550 250 L 600 300" strokeWidth="25" stroke="#c19a6b" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  <ellipse cx="320" cy="200" rx="80" ry="30" />
                  <path d="M 350 200 Q 420 160 480 190 Q 490 200 480 210 Q 420 230 350 210 Z" />
                  <rect x="540" y="220" width="60" height="15" rx="7" />
                  <path d="M 560 235 L 600 300" strokeWidth="20" stroke="#c19a6b" strokeLinecap="round" />
                  <path d="M 250 250 L 200 300" strokeWidth="18" stroke="#c19a6b" strokeLinecap="round" />
                  <ellipse cx="280" cy="320" rx="60" ry="12" />
                  <rect x="220" y="308" width="60" height="24" rx="12" />
                  <path d="M 480 190 Q 520 140 540 180 L 520 200 Q 500 180 480 190 Z" opacity="0.6" />
                </g>
              </svg>
            </div>
          )}

          {/* Text - Desktop with flow */}
          {lines.length > 0 && (
            <div className="hidden lg:block">
              {lines.map((line, index) => (
                <div
                  key={index}
                  style={{
                    height: `${lineHeight}px`,
                    lineHeight: `${lineHeight}px`,
                    fontSize: `${fontSize}px`,
                    pointerEvents: "none",
                    userSelect: "none",
                  }}
                  className="whitespace-pre-wrap"
                >
                  {line.text}
                </div>
              ))}
            </div>
          )}

          {/* Mobile fallback */}
          <div className="lg:hidden prose prose-lg prose-invert max-w-none">
            <div className="mb-8">
              <svg viewBox="0 0 800 400" fill="none" className="w-full h-auto max-w-md mx-auto">
                <g fill="#c19a6b">
                  <circle cx="200" cy="300" r="80" />
                  <circle cx="200" cy="300" r="50" fill="#1e3a5f" />
                  <circle cx="600" cy="300" r="80" />
                  <circle cx="600" cy="300" r="50" fill="#1e3a5f" />
                  <path d="M 200 300 L 250 250 L 300 200 L 400 180 L 500 200 L 550 250 L 600 300" strokeWidth="25" stroke="#c19a6b" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  <ellipse cx="320" cy="200" rx="80" ry="30" />
                  <path d="M 350 200 Q 420 160 480 190 Q 490 200 480 210 Q 420 230 350 210 Z" />
                  <rect x="540" y="220" width="60" height="15" rx="7" />
                  <path d="M 560 235 L 600 300" strokeWidth="20" stroke="#c19a6b" strokeLinecap="round" />
                  <path d="M 250 250 L 200 300" strokeWidth="18" stroke="#c19a6b" strokeLinecap="round" />
                  <ellipse cx="280" cy="320" rx="60" ry="12" />
                  <rect x="220" y="308" width="60" height="24" rx="12" />
                  <path d="M 480 190 Q 520 140 540 180 L 520 200 Q 500 180 480 190 Z" opacity="0.6" />
                </g>
              </svg>
            </div>
            <div className="whitespace-pre-wrap leading-relaxed">{article.content}</div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-24 pt-12 border-t border-[#c19a6b]/20">
          <div className="text-center text-sm text-[#faf9f6]/60">
            <p className="mb-2">© 2026 HERITAGE Motors. All rights reserved.</p>
            <p className="text-[#c19a6b]">Crafted with precision. Ridden with passion.</p>
            <p className="mt-4 text-xs opacity-50">💡 Drag the motorcycle to see text reflow in real-time</p>
          </div>
        </footer>
      </article>
    </div>
  )
}

// Made with Bob
