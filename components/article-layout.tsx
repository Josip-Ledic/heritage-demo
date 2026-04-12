"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { article } from "@/lib/article-data"
import { layoutTextWithFlow, type TextLine } from "@/lib/text-flow"
import { MotorcycleSilhouette } from "./motorcycle-silhouette"

export function ArticleLayout() {
  const [lines, setLines] = useState<TextLine[]>([])
  const [containerWidth, setContainerWidth] = useState(0)
  const [isClient, setIsClient] = useState(false)

  // Font configuration
  const fontSize = 18
  const lineHeight = 36 // 2.0 line height for readability
  const fontFamily = "Crimson Text"
  const font = `${fontSize}px '${fontFamily}'`

  // Calculate layout
  const calculateLayout = useCallback(() => {
    if (typeof window === "undefined" || containerWidth === 0) return

    // Layout the text with dynamic widths
    const layoutLines = layoutTextWithFlow(
      article.content,
      font,
      containerWidth,
      lineHeight
    )

    setLines(layoutLines)
  }, [containerWidth, font, lineHeight])

  // Set up container width measurement
  useEffect(() => {
    setIsClient(true)
    
    const updateWidth = () => {
      // Get the container width (max-width: 1400px, with padding)
      const maxWidth = 1400
      const padding = 64 * 2 // 4rem on each side
      const availableWidth = Math.min(window.innerWidth - padding, maxWidth - padding)
      setContainerWidth(availableWidth)
    }

    updateWidth()

    // Debounced resize handler
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

  // Recalculate layout when dependencies change
  useEffect(() => {
    if (isClient && containerWidth > 0) {
      calculateLayout()
    }
  }, [isClient, containerWidth, calculateLayout])

  // Show loading state or fallback
  if (!isClient || lines.length === 0) {
    return (
      <div className="min-h-screen bg-[#1e3a5f] text-[#faf9f6] flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold mb-2">HERITAGE Motors</div>
          <div className="text-sm opacity-70">Loading article...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1e3a5f] text-[#faf9f6]">
      <article className="max-w-[1400px] mx-auto px-16 py-24">
        {/* Article Header */}
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

        {/* Article Content with Text Flow */}
        <div className="relative">
          {/* Motorcycle Silhouette - Desktop only */}
          <div className="hidden lg:block">
            <MotorcycleSilhouette />
          </div>

          {/* Text Lines - Desktop with flow */}
          <div className="hidden lg:block">
            {lines.map((line, index) => (
              <div
                key={index}
                style={{
                  height: `${lineHeight}px`,
                  lineHeight: `${lineHeight}px`,
                  fontSize: `${fontSize}px`,
                }}
                className="whitespace-pre-wrap"
              >
                {line.text}
              </div>
            ))}
          </div>

          {/* Mobile/Tablet Fallback - Standard layout */}
          <div className="lg:hidden prose prose-lg prose-invert max-w-none">
            <div className="mb-8">
              <MotorcycleSilhouette />
            </div>
            <div className="whitespace-pre-wrap leading-relaxed">
              {article.content}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-24 pt-12 border-t border-[#c19a6b]/20">
          <div className="text-center text-sm text-[#faf9f6]/60">
            <p className="mb-2">© 2026 HERITAGE Motors. All rights reserved.</p>
            <p className="text-[#c19a6b]">Crafted with precision. Ridden with passion.</p>
          </div>
        </footer>
      </article>
    </div>
  )
}

// Made with Bob
