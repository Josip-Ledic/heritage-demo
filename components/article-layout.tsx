"use client"

import { useEffect, useState, useRef } from "react"
import { prepareWithSegments, layoutWithLines } from "@chenglou/pretext"
import { article, type PullQuote } from "@/lib/article-data"
import {
  layoutTextWithObstacle,
  hitTestMotorcycle,
  type TextLine,
  type MotorcyclePosition,
  type RectObstacle,
} from "@/lib/text-flow"

interface PullQuoteBox {
  quote: PullQuote
  x: number
  y: number
  width: number
  lines: Array<{ text: string; y: number }>
}

export function ArticleLayout() {
  const [lines, setLines] = useState<TextLine[]>([])
  const [motorcyclePos, setMotorcyclePos] = useState<MotorcyclePosition | null>(null)
  const [pullQuoteBoxes, setPullQuoteBoxes] = useState<PullQuoteBox[]>([])
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
  
  const quoteFont = `italic 22px '${fontFamily}'`
  const quoteLineHeight = 34
  
  // Layout constants
  const GUTTER = 80
  const CONTENT_TOP = 240
  const QUOTE_WIDTH = 280

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
      const contentHeight = pageHeight - CONTENT_TOP - 100

      // Initialize motorcycle on first layout
      if (!motorcyclePos) {
        const motorcycleWidth = Math.min(contentWidth * 0.28, 220)
        const motorcycleHeight = motorcycleWidth * 0.6
        
        setMotorcyclePos({
          x: contentLeft + contentWidth - motorcycleWidth - 60,
          y: CONTENT_TOP + 120,
          width: motorcycleWidth,
          height: motorcycleHeight,
        })
        return
      }

      // Calculate pull quote positions
      const quoteBoxes: PullQuoteBox[] = article.pullQuotes.map((quote) => {
        const quoteY = CONTENT_TOP + contentHeight * quote.yPosition
        const quoteX = quote.side === 'left' 
          ? contentLeft 
          : contentLeft + contentWidth - QUOTE_WIDTH
        
        // Prepare and layout quote text
        const preparedQuote = prepareWithSegments(quote.text, quoteFont, {
          whiteSpace: "normal",
        })
        const quoteLayout = layoutWithLines(preparedQuote, QUOTE_WIDTH - 40, quoteLineHeight)
        
        return {
          quote,
          x: quoteX,
          y: quoteY,
          width: QUOTE_WIDTH,
          lines: quoteLayout.lines.map((line, idx) => ({
            text: line.text,
            y: quoteY + 20 + idx * quoteLineHeight,
          })),
        }
      })

      setPullQuoteBoxes(quoteBoxes)

      // Convert pull quote boxes to rectangular obstacles
      const rectObstacles: RectObstacle[] = quoteBoxes.map(box => ({
        x: box.x - contentLeft, // Convert to content-relative coordinates
        y: box.y,
        width: box.width,
        height: box.lines.length * quoteLineHeight + 40, // Height based on line count + padding
      }))

      // Layout text with obstacles (both motorcycle and pull quotes)
      const layoutLines = layoutTextWithObstacle(
        preparedTextRef.current!,
        contentWidth,
        lineHeight,
        CONTENT_TOP,
        motorcyclePos ? {
          ...motorcyclePos,
          x: motorcyclePos.x - contentLeft,
        } : null,
        rectObstacles
      )

      // Convert to page coordinates
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
  }, [motorcyclePos, CONTENT_TOP, GUTTER, font, quoteFont, lineHeight, quoteLineHeight])

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
    <div
      ref={stageRef}
      className="fixed inset-0 overflow-hidden bg-gradient-to-b from-[#1a2f4a] via-[#1e3a5f] to-[#152238]"
      style={{
        userSelect: isDragging ? "none" : "auto",
        WebkitUserSelect: isDragging ? "none" : "auto",
        cursor: isDragging ? "grabbing" : "default",
      }}
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#c19a6b] to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#c19a6b] to-transparent" />
      </div>

      {/* Header */}
      <div
        className="absolute left-0 right-0 text-center"
        style={{
          top: `${GUTTER}px`,
          zIndex: 20,
        }}
      >
        <div className="text-[#c19a6b] text-[10px] font-semibold tracking-[0.3em] uppercase mb-4 opacity-90">
          HERITAGE Motors · Est. 1952
        </div>
        <h1 
          className="text-5xl font-bold text-white mb-3 px-4 tracking-tight"
          style={{ fontFamily: fontFamily }}
        >
          {article.title}
        </h1>
        {article.subtitle && (
          <p className="text-lg text-[#faf9f6]/70 italic px-4" style={{ fontFamily: fontFamily }}>
            {article.subtitle}
          </p>
        )}
        <div className="flex items-center justify-center gap-3 mt-6 text-xs text-[#faf9f6]/50 tracking-wider">
          {article.author && <span>BY {article.author.toUpperCase()}</span>}
          <span className="text-[#c19a6b]">·</span>
          {article.date && <span>{article.date.toUpperCase()}</span>}
        </div>
      </div>

      {/* Drop cap */}
      <div
        className="absolute font-bold text-[#c19a6b] pointer-events-none leading-none"
        style={{
          left: `${(window.innerWidth - Math.min(window.innerWidth - GUTTER * 2, 900)) / 2}px`,
          top: `${CONTENT_TOP}px`,
          fontSize: "84px",
          zIndex: 15,
          textShadow: "0 2px 20px rgba(193, 154, 107, 0.3)",
        }}
      >
        {article.content[0]}
      </div>

      {/* Body text lines */}
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
            zIndex: 5,
            textShadow: "0 1px 2px rgba(0,0,0,0.1)",
          }}
        >
          {line.text}
        </span>
      ))}

      {/* Pull quotes */}
      {pullQuoteBoxes.map((box, idx) => (
        <div
          key={idx}
          className="absolute pointer-events-none"
          style={{
            left: `${box.x}px`,
            top: `${box.y}px`,
            width: `${box.width}px`,
            zIndex: 25,
          }}
        >
          {/* Quote box background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#c19a6b]/10 to-transparent backdrop-blur-sm rounded-sm border-l-2 border-[#c19a6b]/40" />
          
          {/* Quote lines */}
          <div className="relative px-5 py-4">
            {box.lines.map((line, lineIdx) => (
              <div
                key={lineIdx}
                className="text-[#c19a6b] font-serif italic"
                style={{
                  fontSize: "22px",
                  lineHeight: `${quoteLineHeight}px`,
                  fontFamily: fontFamily,
                  textShadow: "0 2px 10px rgba(193, 154, 107, 0.2)",
                }}
              >
                {lineIdx === 0 && <span className="text-4xl leading-none mr-1">&ldquo;</span>}
                {line.text}
                {lineIdx === box.lines.length - 1 && <span className="text-4xl leading-none ml-1">&rdquo;</span>}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Motorcycle orb */}
      {motorcyclePos && (
        <div
          className="absolute rounded-full transition-opacity duration-200"
          style={{
            left: `${motorcyclePos.x}px`,
            top: `${motorcyclePos.y}px`,
            width: `${motorcyclePos.width}px`,
            height: `${motorcyclePos.height}px`,
            cursor: isDragging ? "grabbing" : "grab",
            background: `radial-gradient(ellipse at 35% 35%, rgba(196, 163, 90, 0.4), rgba(196, 163, 90, 0.15) 55%, transparent 72%)`,
            boxShadow: `0 0 60px 15px rgba(196, 163, 90, 0.2), 0 0 120px 40px rgba(196, 163, 90, 0.08)`,
            zIndex: 30,
            pointerEvents: "auto",
            opacity: isDragging ? 0.9 : 1,
          }}
        />
      )}

      {/* Hint */}
      <div
        className="fixed top-5 left-1/2 -translate-x-1/2 text-[11px] text-white/15 bg-black/30 px-5 py-2 rounded-full pointer-events-none backdrop-blur-sm border border-white/5"
        style={{ zIndex: 100, letterSpacing: "0.05em" }}
      >
        Drag the orb to see text reflow · Zero DOM reads
      </div>

      {/* Footer */}
      <div
        className="fixed bottom-6 left-0 right-0 text-center text-[10px] text-[#faf9f6]/30 pointer-events-none tracking-wider"
        style={{ zIndex: 100 }}
      >
        <p>© 2026 HERITAGE MOTORS · CRAFTED WITH PRECISION · RIDDEN WITH PASSION</p>
      </div>
    </div>
  )
}

// Made with Bob
