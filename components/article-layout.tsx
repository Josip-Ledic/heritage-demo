"use client"

import { useEffect, useState, useRef } from "react"
import { prepareWithSegments } from "@chenglou/pretext"
import { article } from "@/lib/article-data"
import {
  layoutTextWithObstacle,
  type TextLine,
  type MotorcyclePosition,
  type ImageObstacle,
  type RectObstacle,
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
  
  const contentRef = useRef<HTMLDivElement>(null)
  const preparedTextRef = useRef<ReturnType<typeof prepareWithSegments> | null>(null)

  // Font configuration
  const fontSize = 18
  const lineHeight = 30
  const fontFamily = "Crimson Text"
  const font = `${fontSize}px '${fontFamily}'`
  
  // Layout constants
  const CONTENT_MAX_WIDTH = 900
  const GUTTER = 80
  const DROP_CAP_SIZE = 84
  const DROP_CAP_WIDTH = 60
  const DROP_CAP_HEIGHT = lineHeight * 3

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
          
          // Initialize motorcycle position - very large and prominent
          const aspectRatio = img.naturalWidth / img.naturalHeight
          const motorcycleWidth = 800
          const motorcycleHeight = motorcycleWidth / aspectRatio
          
          setMotorcyclePos({
            x: 0, // Will be centered in layout effect
            y: 0, // Will be positioned relative to content
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

  // Layout calculation
  useEffect(() => {
    if (!preparedTextRef.current || typeof window === "undefined" || !contentRef.current) return

    const updateLayout = () => {
      const pageWidth = window.innerWidth
      const calculatedContentWidth = Math.min(pageWidth - GUTTER * 2, CONTENT_MAX_WIDTH)
      const calculatedContentLeft = (pageWidth - calculatedContentWidth) / 2
      
      // Get the actual Y position where content starts
      const contentTop = contentRef.current?.getBoundingClientRect().top || 0
      const scrollY = window.scrollY
      const contentStartY = contentTop + scrollY
      
      setContentWidth(calculatedContentWidth)
      setContentLeft(calculatedContentLeft)

      // Position motorcycle centered and overlapping with title if not yet positioned
      if (motorcyclePos && motorcyclePos.x === 0) {
        setMotorcyclePos({
          ...motorcyclePos,
          x: calculatedContentLeft + (calculatedContentWidth - motorcyclePos.width) / 2,
          y: contentStartY - 100, // Overlap upward into title area
        })
        return
      }

      // Create drop cap obstacle
      const dropCapObstacle: RectObstacle = {
        x: 0,
        y: contentStartY,
        width: DROP_CAP_WIDTH,
        height: DROP_CAP_HEIGHT,
      }

      // Create image obstacle for motorcycle
      const imageObstacle: ImageObstacle | null = motorcyclePos && motorcycleImageData ? {
        x: motorcyclePos.x - calculatedContentLeft,
        y: motorcyclePos.y,
        width: motorcyclePos.width,
        height: motorcyclePos.height,
        imageData: motorcycleImageData,
      } : null

      // Layout text with Pretext
      const layoutLines = layoutTextWithObstacle(
        preparedTextRef.current!,
        calculatedContentWidth,
        lineHeight,
        contentStartY,
        null,
        [dropCapObstacle],
        imageObstacle
      )

      // Convert to page coordinates and make relative to content div
      const pageLines = layoutLines.map(line => ({
        ...line,
        x: line.x + calculatedContentLeft,
        y: line.y - contentStartY, // Make relative to content div
      }))

      setLines(pageLines)
    }

    updateLayout()

    const handleResize = () => updateLayout()
    window.addEventListener("resize", handleResize)
    window.addEventListener("scroll", updateLayout) // Update on scroll too
    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("scroll", updateLayout)
    }
  }, [motorcyclePos, motorcycleImageData, lineHeight, GUTTER, CONTENT_MAX_WIDTH, DROP_CAP_WIDTH, DROP_CAP_HEIGHT])

  // Simple drag handlers
  const handleMotorcyclePointerDown = (e: React.PointerEvent<HTMLImageElement>) => {
    if (!motorcyclePos) return
    
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setMotorcycleStart({ x: motorcyclePos.x, y: motorcyclePos.y })
  }

  const handleMotorcyclePointerMove = (e: React.PointerEvent<HTMLImageElement>) => {
    if (!isDragging || !dragStart || !motorcycleStart || !motorcyclePos) return

    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y

    setMotorcyclePos({
      ...motorcyclePos,
      x: motorcycleStart.x + dx,
      y: motorcycleStart.y + dy,
    })
  }

  const handleMotorcyclePointerUp = (e: React.PointerEvent<HTMLImageElement>) => {
    if (isDragging) {
      e.currentTarget.releasePointerCapture(e.pointerId)
      setIsDragging(false)
      setDragStart(null)
      setMotorcycleStart(null)
    }
  }

  // Calculate content height based on text lines
  const contentHeight = lines.length > 0 
    ? Math.max(lines[lines.length - 1].y + lineHeight + 200, 800)
    : 800

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-[#1a2f4a] via-[#1e3a5f] to-[#152238]"
      style={{
        userSelect: isDragging ? "none" : "auto",
        cursor: isDragging ? "grabbing" : "default",
      }}
    >
      {/* Header - natural flow, above motorcycle */}
      <div className="relative text-center px-8 pt-12 pb-6" style={{ zIndex: 40 }}>
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
            className="text-[#faf9f6]/70 italic px-4 max-w-2xl mx-auto mb-4"
            style={{
              fontFamily: fontFamily,
              fontSize: "clamp(1rem, 2vw, 1.5rem)",
              lineHeight: "1.4",
            }}
          >
            {article.subtitle}
          </p>
        )}
        <div className="flex items-center justify-center gap-4 text-[10px] text-[#faf9f6]/40 tracking-[0.2em]">
          {article.author && <span>BY {article.author.toUpperCase()}</span>}
          <span className="text-[#c19a6b] opacity-60">·</span>
          {article.date && <span>{article.date.toUpperCase()}</span>}
        </div>
      </div>

      {/* Content area - sibling to header, natural flow */}
      <div
        ref={contentRef}
        className="relative"
        style={{
          minHeight: `${contentHeight}px`,
          paddingBottom: "100px",
        }}
      >
        {/* Drop cap */}
        {contentLeft > 0 && (
          <div
            className="absolute font-bold text-[#c19a6b] pointer-events-none leading-none"
            style={{
              left: `${contentLeft}px`,
              top: 0,
              fontSize: "84px",
              zIndex: 15,
              textShadow: "0 2px 20px rgba(193, 154, 107, 0.3)",
            }}
          >
            {article.content[0]}
          </div>
        )}

        {/* Body text */}
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

        {/* Motorcycle - draggable, positioned absolutely on page */}
        {motorcyclePos && motorcyclePos.x > 0 && (
          <img
            src="/image-Photoroom.png"
            alt="Heritage Motorcycle"
            className="fixed transition-opacity duration-200"
            draggable={false}
            onPointerDown={handleMotorcyclePointerDown}
            onPointerMove={handleMotorcyclePointerMove}
            onPointerUp={handleMotorcyclePointerUp}
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
              touchAction: "none",
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
