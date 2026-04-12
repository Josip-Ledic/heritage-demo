import {
  prepareWithSegments,
  layoutNextLineRange,
  materializeLineRange,
  type PreparedTextWithSegments,
  type LayoutCursor,
  type LayoutLineRange,
} from "@chenglou/pretext"

export interface TextLine {
  text: string
  width: number
  lineIndex: number
}

export interface MotorcyclePosition {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Calculate the horizontal interval blocked by a circular/rectangular obstacle
 * for a given vertical band (line of text)
 */
function getObstacleInterval(
  obstacleX: number,
  obstacleY: number,
  obstacleWidth: number,
  obstacleHeight: number,
  lineTop: number,
  lineBottom: number,
  hPad: number = 40,
  vPad: number = 10
): { left: number; right: number } | null {
  const top = lineTop - vPad
  const bottom = lineBottom + vPad
  
  // Check if line intersects with obstacle vertically
  if (top >= obstacleY + obstacleHeight || bottom <= obstacleY) {
    return null
  }
  
  // Return the horizontal interval blocked by the obstacle
  return {
    left: obstacleX - hPad,
    right: obstacleX + obstacleWidth + hPad,
  }
}

/**
 * Calculate available text width for a line, accounting for motorcycle position
 * 
 * @param lineIndex - The line number (0-based)
 * @param lineTop - Top Y position of the line
 * @param baseWidth - The full container width
 * @param lineHeight - Height of each line in pixels
 * @param motorcyclePos - Current motorcycle position and dimensions
 * @returns Available width for text on this line
 */
export function getLineWidthWithObstacle(
  lineIndex: number,
  lineTop: number,
  baseWidth: number,
  lineHeight: number,
  motorcyclePos: MotorcyclePosition | null
): number {
  if (!motorcyclePos) {
    return baseWidth
  }
  
  const lineBottom = lineTop + lineHeight
  
  // Check if this line intersects with the motorcycle
  const interval = getObstacleInterval(
    motorcyclePos.x,
    motorcyclePos.y,
    motorcyclePos.width,
    motorcyclePos.height,
    lineTop,
    lineBottom
  )
  
  if (!interval) {
    // No intersection - full width available
    return baseWidth
  }
  
  // Calculate available width on the left side of the motorcycle
  const leftWidth = Math.max(0, interval.left)
  
  // Calculate available width on the right side
  const rightWidth = Math.max(0, baseWidth - interval.right)
  
  // Use the larger available space
  const availableWidth = Math.max(leftWidth, rightWidth)
  
  // Ensure minimum width for readability
  const minWidth = baseWidth * 0.3
  return Math.max(availableWidth, minWidth)
}

/**
 * Layout text with dynamic line widths using Pretext, accounting for motorcycle position
 * 
 * @param prepared - Prepared text from prepareWithSegments
 * @param baseWidth - Container width
 * @param lineHeight - Line height in pixels
 * @param startY - Starting Y position for text
 * @param motorcyclePos - Current motorcycle position
 * @returns Array of text lines with their content and widths
 */
export function layoutTextWithObstacle(
  prepared: PreparedTextWithSegments,
  baseWidth: number,
  lineHeight: number,
  startY: number,
  motorcyclePos: MotorcyclePosition | null
): TextLine[] {
  const lines: TextLine[] = []
  let cursor: LayoutCursor | null = { segmentIndex: 0, graphemeIndex: 0 }
  let lineIndex = 0
  
  // Iterate through lines with varying widths
  while (cursor !== null) {
    const lineTop = startY + lineIndex * lineHeight
    const maxWidth = getLineWidthWithObstacle(
      lineIndex,
      lineTop,
      baseWidth,
      lineHeight,
      motorcyclePos
    )
    
    // Get the next line range
    const range: LayoutLineRange | null = layoutNextLineRange(
      prepared,
      cursor,
      maxWidth
    )
    
    if (range === null) break
    
    // Materialize the line to get the actual text
    const line = materializeLineRange(prepared, range)
    
    lines.push({
      text: line.text,
      width: line.width,
      lineIndex,
    })
    
    cursor = range.end
    lineIndex++
  }
  
  return lines
}

/**
 * Calculate the total height needed for the text layout
 */
export function calculateTextHeight(lineCount: number, lineHeight: number): number {
  return lineCount * lineHeight
}

/**
 * Hit test to check if a point is inside the motorcycle bounds
 */
export function hitTestMotorcycle(
  x: number,
  y: number,
  motorcyclePos: MotorcyclePosition
): boolean {
  return (
    x >= motorcyclePos.x &&
    x <= motorcyclePos.x + motorcyclePos.width &&
    y >= motorcyclePos.y &&
    y <= motorcyclePos.y + motorcyclePos.height
  )
}

// Made with Bob
