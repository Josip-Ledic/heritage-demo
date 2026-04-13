"use client"

import { useEffect, useState, useRef } from "react"
import { layoutWithLines, prepareWithSegments } from "@chenglou/pretext"
import { article } from "@/lib/article-data"
import {
  layoutTextWithObstacle,
  type TextLine,
  type MotorcyclePosition,
  type ImageObstacle,
  type RectObstacle,
} from "@/lib/text-flow"

type SidebarStyle = {
  position: 'absolute' | 'fixed';
  top: string;
  width: string;
};

export function ArticleLayout() {
  // Layout constants
  const SIDEBAR_WIDTH = 160
  const SIDEBAR_TOP_OFFSET = 120
  const SIDEBAR_BOTTOM_OFFSET = 80

  const [lines, setLines] = useState<TextLine[]>([])
  const [motorcyclePos, setMotorcyclePos] = useState<MotorcyclePosition | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [motorcycleStart, setMotorcycleStart] = useState<{ x: number; y: number } | null>(null)
  const [motorcycleImageData, setMotorcycleImageData] = useState<ImageData | null>(null)
  const [contentWidth, setContentWidth] = useState(0)
  const [contentLeft, setContentLeft] = useState(0)
  const [sidebarTop, setSidebarTop] = useState(SIDEBAR_TOP_OFFSET)
  const [sidebarStyle, setSidebarStyle] = useState<SidebarStyle>({
    position: 'absolute',
    top: `${SIDEBAR_TOP_OFFSET}px`,
    width: `${SIDEBAR_WIDTH}px`
  })

  const contentRef = useRef<HTMLDivElement>(null)
  const preparedTextRef = useRef<ReturnType<typeof prepareWithSegments> | null>(null)

  // Font configuration - refined typography
    const fontSize = 21
    const lineHeight = 31
    const headingFontFamily = "Merriweather"
    const bodyFontFamily = "Oxanium"
    const font = `${fontSize}px '${bodyFontFamily}'`

  const CONTENT_MAX_WIDTH = 900
  const GUTTER = 80
  const DROP_CAP_SIZE = 84
  const DROP_CAP_WIDTH = 60
  const DROP_CAP_HEIGHT = lineHeight * 2 // Reduced from 3 to 2 line heights

  // Load motorcycle image and extract alpha channel
  useEffect(() => {
    const img = new Image()
    img.src = "/bike1.png"
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
          const motorcycleWidth = 810
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

  // Sidebar sticky behavior
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const sidebarStickyThreshold = 200 // When to make it sticky as you scroll down

      // Make sidebar sticky when scrolled past the threshold
      if (scrollY > sidebarStickyThreshold) {
        setSidebarStyle({
          position: 'fixed',
          top: '20px',
          width: `${SIDEBAR_WIDTH}px`
        })
      } else {
        // Return to absolute positioning when scrolled back up
        setSidebarStyle({
          position: 'absolute',
          top: `${SIDEBAR_TOP_OFFSET}px`,
          width: `${SIDEBAR_WIDTH}px`
        })
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Prepare text once (skip first character for drop cap)
  useEffect(() => {
    if (typeof window !== "undefined" && !preparedTextRef.current) {
      const textWithoutFirstChar = article.content.substring(1)
      preparedTextRef.current = prepareWithSegments(textWithoutFirstChar, font, {
        whiteSpace: "pre-wrap", // Preserve paragraph breaks
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

      // Create image obstacle for motorcycle (convert fixed position to page coordinates)
      const imageObstacle: ImageObstacle | null = motorcyclePos && motorcycleImageData ? {
        x: motorcyclePos.x - calculatedContentLeft,
        y: motorcyclePos.y + scrollY, // Add scroll offset since motorcycle is fixed
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
        y: line.y - contentStartY,
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
  }, [motorcyclePos, motorcycleImageData, lineHeight, GUTTER, CONTENT_MAX_WIDTH, DROP_CAP_WIDTH, DROP_CAP_HEIGHT, headingFontFamily])

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
      className="min-h-screen relative"
      style={{
        userSelect: isDragging ? "none" : "auto",
        cursor: isDragging ? "grabbing" : "default",
        background: `
          radial-gradient(ellipse at 50% 10%, rgba(26, 47, 74, 0.9) 0%, rgba(26, 47, 74, 0.7) 100%),
          linear-gradient(135deg, rgba(193, 154, 107, 0.05) 0%, rgba(193, 154, 107, 0.02) 100%)
        `,
      }}
    >
      {/* Animated background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/route66.avif')",
          backgroundBlendMode: "overlay",
          zIndex: 0,
          opacity: 0.25,
          filter: "blur(1px) brightness(0.9) contrast(1.1)",
        }}
      />

      {/* Gradient overlay */}
      <div
        className="fixed inset-0"
        style={{
                  background: `
                    linear-gradient(
                      to bottom,
                      rgba(26, 47, 74, 0.7) 0%,
                      rgba(26, 47, 74, 0.4) 30%,
                      transparent 70%
                    )
                  `,
                  zIndex: 1,
                  pointerEvents: "none",
                }}
      />
      {/* Header - natural flow, above motorcycle */}
      <div className="relative text-center px-8 pt-16 pb-6" style={{ zIndex: 40 }}>
        <div className="text-[#c19a6b] text-[11px] font-semibold tracking-[0.35em] uppercase mb-8 opacity-80" style={{ fontFamily: "'Space Mono'" }}>
          HERITAGE Motors · Est. 1952
        </div>
        <h1
                  className="font-bold text-white mb-6 px-4 leading-[0.85]"
                  style={{
                    fontFamily: headingFontFamily,
                    fontSize: "clamp(4rem, 10vw, 9rem)",
                    letterSpacing: "-0.02em",
                    textShadow: `
                      0 2px 4px rgba(0, 0, 0, 0.1)
                    `,
                    fontWeight: 900,
                    transform: "translateZ(0)",
                  }}
                >
                  {article.title.split(" ").map((word, index) =>
                    word === "Innovation" ? (
                      <span key={index} style={{ fontStyle: "italic" }}>
                        {word}{" "}
                      </span>
                    ) : (
                      <span key={index}>{word} </span>
                    )
                  )}
                </h1>
        {article.subtitle && (
          <p
            className="text-[#faf9f6]/80 italic px-4 max-w-3xl mx-auto mb-6"
            style={{
                          fontFamily: bodyFontFamily,
                          fontSize: "clamp(1.2rem, 2.2vw, 1.8rem)",
                          lineHeight: "1.4",
                          textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                          fontWeight: 400,
                        }}
          >
            {article.subtitle}
          </p>
        )}
        <div className="flex items-center justify-center gap-4 text-[12px] text-[#faf9f6]/50 tracking-[0.25em] font-medium" style={{ fontFamily: "'Space Mono'" }}>
          {article.author && <span>BY {article.author.toUpperCase()}</span>}
          <span className="text-[#c19a6b] opacity-70">·</span>
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
        {contentLeft >= 0 && (
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

        {/* Body text - improved typography */}
        {lines.map((line, index) => (
                  <span
                    key={index}
                    className="absolute whitespace-pre"
                    style={{
                      left: `${line.x}px`,
                      top: `${line.y}px`,
                      fontSize: `${fontSize}px`,
                      lineHeight: `${lineHeight}px`,
                      fontFamily: "Oxanium",
                      color: "#faf9f6",
                      userSelect: "text",
                      zIndex: 5,
                      textShadow: "0 1px 2px rgba(0,0,0,0.1)",
                      fontWeight: 400,
                      letterSpacing: "0.01em",
                    }}
                  >
                    {line.text}
                  </span>
                ))}

                {/* Sidebar - becomes sticky when scrolled down */}
                <div
                  className="left-0 p-4 bg-black/10 backdrop-blur-sm rounded-r-lg z-20 transition-all duration-200"
                  style={sidebarStyle}
                >
                  <div className="font-bold mb-2" style={{
                    fontFamily: bodyFontFamily,
                    fontSize: "0.9rem",
                    lineHeight: "1.4",
                    color: "#c19a6b",  // Gold color
                    textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                  }}>Heritage Craftsmanship</div>
                  <p style={{
                    fontFamily: bodyFontFamily,
                    fontSize: "0.9rem",
                    lineHeight: "1.4",
                    color: "#faf9f6",
                    textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                  }}>Every HERITAGE motorcycle is handcrafted with precision, blending timeless design with cutting-edge engineering.</p>
                </div>

        {/* Motorcycle - draggable, fixed positioning to prevent clipping */}
        {motorcyclePos && (
          <img
            src="/bike1.png"
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
                            ? "brightness(1.05) drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15))"
                            : "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1))",
                          zIndex: 30,
                          pointerEvents: "auto",
                          opacity: isDragging ? 0.98 : 1,
                          touchAction: "none",
                          transition: "filter 0.3s ease, opacity 0.2s ease",
                        }}
          />
        )}
      </div>

      {/* Hint - top right corner */}
      <div
        className="fixed top-6 right-6 text-[10px] text-white/20 bg-black/20 px-4 py-2 rounded-full pointer-events-none backdrop-blur-sm border border-white/10"
        style={{ zIndex: 100 }}
      >
        Drag the motorcycle
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
