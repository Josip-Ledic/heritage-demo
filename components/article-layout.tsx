"use client"

import { useEffect, useState, useRef } from "react"
import { prepareWithSegments } from "@chenglou/pretext"
import { article } from "@/lib/article-data"
import {
  layoutTextWithObstacle,
  hitTestMotorcycle,
  type TextLine,
  type MotorcyclePosition,
  type ImageObstacle,
} from "@/lib/text-flow"

export function ArticleLayout() {
  const [lines, setLines] = useState<TextLine[]>([])
  const [motorcyclePos, setMotorcyclePos] = useState<MotorcyclePosition | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [motorcycleStart, setMotorcycleStart] = useState<{ x: number; y: number } | null>(null)
  const [motorcycleImageData, setMotorcycleImageData] = useState<ImageData | null>(null)
  const [contentWidth, setContentWidth] = useState(0)
  const [contentLeft, setContentLeft] = useState(0)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const preparedTextRef = useRef<ReturnType<typeof prepareWithSegments> | null>(null)

  // Font configuration
  const fontSize = 18
  const lineHeight = 30
  const fontFamily = "Crimson Text"
  const font = `${fontSize}px '${fontFamily}'`
  
  // Layout constants - simple and clear
  const CONTENT_MAX_WIDTH = 900
  const GUTTER = 80
  const HEADER_HEIGHT = 320

  // Load motorcycle image and extract alpha channel
  useEffect(() => {
    const img = new Image()
    img.src = "/image-Photoroom.png"
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        try {
          const imageData = ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight)
          setMotorcycleImageData(imageData)
          
          // Initialize motorcycle position
          const aspectRatio = img.naturalWidth / img.naturalHeight
          const motorcycleWidth = 400
          const motorcycleHeight = motorcycleWidth / aspectRatio
          
          setMotorcyclePos({
            x: 0, // Will be positioned properly in layout effect
            y: HEADER_HEIGHT + 100,
            width: motorcycleWidth,
            height: motorcycleHeight,
          })
        } catch (e) {
          console.warn('Could not extract image data:', e)
        }
      }
    }
  }, [])

  // Prepare text once (skip first character for drop cap)
  useEffect(() => {
    if (typeof window !== "undefined" && !preparedTextRef.current) {
      const textWithoutFirstChar = article.content.substring(1)
      preparedTextRef.current = prepareWithSegments(textWithoutFirstChar, font, {
        whiteSpace: "normal",
      })
    }
  }, [font])

  // Layout calculation - this is where Pretext does its magic
  useEffect(() => {
    if (!preparedTextRef.current || typeof window === "undefined") return

    const updateLayout = () => {
      const pageWidth = window.innerWidth
      const calculatedContentWidth = Math.min(pageWidth - GUTTER * 2, CONTENT_MAX_WIDTH)
      const calculatedContentLeft = (pageWidth - calculatedContentWidth) / 2
      
      setContentWidth(calculatedContentWidth)
      setContentLeft(calculatedContentLeft)

      // Position motorcycle if not yet positioned
      if (motorcyclePos && motorcyclePos.x === 0) {
        setMotorcyclePos({
          ...motorcyclePos,
          x: calculatedContentLeft + calculatedContentWidth - motorcyclePos.width - 40,
        })
        return
      }

      // Create image obstacle for motorcycle
      const imageObstacle: ImageObstacle | null = motorcyclePos && motorcycleImageData ? {
        x: motorcyclePos.x - calculatedContentLeft, // Content-relative
        y: motorcyclePos.y,
        width: motorcyclePos.width,
        height: motorcyclePos.height,
        imageData: motorcycleImageData,
      } : null

      // Layout text with Pretext - it calculates everything for us
      const layoutLines = layoutTextWithObstacle(
        preparedTextRef.current!,
        calculatedContentWidth,
        lineHeight,
        HEADER_HEIGHT,
        null, // No circular obstacle
        [], // No rectangular obstacles for now
        imageObstacle
      )

      // Convert to page coordinates (Pretext gives us content-relative)
      const pageLines = layoutLines.map(line => ({
        ...line,
        x: line.x + calculatedContentLeft,
      }))

      setLines(pageLines)
    }

    updateLayout()

    const handleResize = () => updateLayout()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [motorcyclePos, motorcycleImageData, lineHeight, GUTTER, CONTENT_MAX_WIDTH, HEADER_HEIGHT])

  // Drag handlers
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handlePointerDown = (e: PointerEvent) => {
      if (!motorcyclePos) return

      if (hitTestMotorcycle(e.clientX, e.clientY, motorcyclePos)) {
        e.preventDefault()
        setIsDragging(true)
        setDragStart({ x: e.clientX, y: e.clientY })
        setMotorcycleStart({ x: motorcyclePos.x, y: motorcyclePos.y })
        container.setPointerCapture(e.pointerId)
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
        container.releasePointerCapture(e.pointerId)
      }
    }

    container.addEventListener("pointerdown", handlePointerDown)
    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)

    return () => {
      container.removeEventListener("pointerdown", handlePointerDown)
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [isDragging, dragStart, motorcycleStart, motorcyclePos])

  // Calculate content height based on text lines
  const contentHeight = lines.length > 0 
    ? Math.max(lines[lines.length - 1].y + lineHeight - HEADER_HEIGHT + 200, 800)
    : 800

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-b from-[#1a2f4a] via-[#1e3a5f] to-[#152238]"
      style={{
        userSelect: isDragging ? "none" : "auto",
        cursor: isDragging ? "grabbing" : "default",
      }}
    >
      {/* Header */}
      <div
        className="relative text-center px-8 pt-20 pb-12"
        style={{ zIndex: 20 }}
      >
        <div className="text-[#c19a6b] text-[9px] font-semibold tracking-[0.35em] uppercase mb-6 opacity-80">
          HERITAGE Motors · Est. 1952
        </div>
        <h1
          className="font-bold text-white mb-4 px-4 leading-[0.9]"
          style={{
            fontFamily: fontFamily,
            fontSize: "clamp(3rem, 8vw, 7rem)",
            letterSpacing: "-0.03em",
            textShadow: "0 4px 30px rgba(0,0,0,0.3)",
          }}
        >
          {article.title}
        </h1>
        {article.subtitle && (
          <p
            className="text-[#faf9f6]/70 italic px-4 max-w-2xl mx-auto"
            style={{
              fontFamily: fontFamily,
              fontSize: "clamp(1rem, 2vw, 1.5rem)",
              lineHeight: "1.4",
            }}
          >
            {article.subtitle}
          </p>
        )}
        <div className="flex items-center justify-center gap-4 mt-8 text-[10px] text-[#faf9f6]/40 tracking-[0.2em]">
          {article.author && <span>BY {article.author.toUpperCase()}</span>}
          <span className="text-[#c19a6b] opacity-60">·</span>
          {article.date && <span>{article.date.toUpperCase()}</span>}
        </div>
      </div>

      {/* Content area - positioned relative so text flows naturally */}
      <div
        className="relative"
        style={{
          minHeight: `${contentHeight}px`,
          paddingBottom: "100px",
        }}
      >
        {/* Drop cap */}
        <div
          className="absolute font-bold text-[#c19a6b] pointer-events-none leading-none"
          style={{
            left: `${contentLeft}px`,
            top: `${HEADER_HEIGHT}px`,
            fontSize: "84px",
            zIndex: 15,
            textShadow: "0 2px 20px rgba(193, 154, 107, 0.3)",
          }}
        >
          {article.content[0]}
        </div>

        {/* Body text - Pretext calculated these positions */}
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
              zIndex: 5,
              textShadow: "0 1px 2px rgba(0,0,0,0.1)",
            }}
          >
            {line.text}
          </span>
        ))}

        {/* Motorcycle - draggable */}
        {motorcyclePos && motorcyclePos.x > 0 && (
          <img
            src="/image-Photoroom.png"
            alt="Heritage Motorcycle"
            className="absolute transition-opacity duration-200"
            draggable={false}
            style={{
              left: `${motorcyclePos.x}px`,
              top: `${motorcyclePos.y}px`,
              width: `${motorcyclePos.width}px`,
              height: `${motorcyclePos.height}px`,
              cursor: isDragging ? "grabbing" : "grab",
              filter: isDragging 
                ? "brightness(1.1) drop-shadow(0 10px 30px rgba(196, 163, 90, 0.4))" 
                : "drop-shadow(0 5px 20px rgba(0, 0, 0, 0.3))",
              zIndex: 30,
              pointerEvents: "auto",
              opacity: isDragging ? 0.95 : 1,
            }}
          />
        )}
      </div>

      {/* Hint */}
      <div
        className="fixed top-5 left-1/2 -translate-x-1/2 text-[11px] text-white/15 bg-black/30 px-5 py-2 rounded-full pointer-events-none backdrop-blur-sm border border-white/5"
        style={{ zIndex: 100 }}
      >
        Drag the motorcycle to see text reflow · Powered by Pretext
      </div>

      {/* Footer */}
      <div
        className="fixed bottom-6 left-0 right-0 text-center text-[10px] text-[#faf9f6]/30 pointer-events-none tracking-wider"
        style={{ zIndex: 100 }}
      >
        <p>© 2026 HERITAGE MOTORS · CRAFTED WITH PRECISION</p>
      </div>
    </div>
  )
}

// Made with Bob
