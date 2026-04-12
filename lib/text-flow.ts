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

/**
 * Defines the motorcycle silhouette shape by returning available text width
 * for each line. The motorcycle is positioned on the right side, so we return
 * the width available on the LEFT side of the motorcycle.
 * 
 * @param lineIndex - The line number (0-based)
 * @param baseWidth - The full container width
 * @param lineHeight - Height of each line in pixels
 * @returns Available width for text on this line
 */
export function getLineWidth(
  lineIndex: number,
  baseWidth: number,
  lineHeight: number
): number {
  // Calculate vertical position
  const y = lineIndex * lineHeight
  
  // Motorcycle dimensions (based on SVG viewBox and positioning)
  // The motorcycle is 45% of container width, positioned on the right
  const motorcycleWidth = baseWidth * 0.45
  const motorcycleStartX = baseWidth - motorcycleWidth
  
  // Motorcycle vertical positioning (starts at 25% from top, ~400px tall in viewBox)
  const motorcycleTopY = baseWidth * 0.25 // Approximate based on container
  const motorcycleBottomY = motorcycleTopY + (motorcycleWidth * 0.5) // Aspect ratio adjustment
  
  // Define the motorcycle shape profile (left edge at different heights)
  // These values represent how far the motorcycle extends into the text area
  const getMotorcycleIntrusion = (yPos: number): number => {
    if (yPos < motorcycleTopY) {
      // Above motorcycle - full width available
      return 0
    } else if (yPos > motorcycleBottomY) {
      // Below motorcycle - full width available
      return 0
    } else {
      // Beside motorcycle - calculate intrusion based on shape
      const relativeY = (yPos - motorcycleTopY) / (motorcycleBottomY - motorcycleTopY)
      
      // Create a curved profile (wider in the middle, narrower at top/bottom)
      // This approximates a motorcycle silhouette
      let intrusion: number
      
      if (relativeY < 0.2) {
        // Top section (handlebars/windscreen) - moderate intrusion
        intrusion = motorcycleWidth * 0.6
      } else if (relativeY < 0.4) {
        // Upper-middle (tank/seat) - maximum intrusion
        intrusion = motorcycleWidth * 0.75
      } else if (relativeY < 0.7) {
        // Middle (body/frame) - significant intrusion
        intrusion = motorcycleWidth * 0.7
      } else if (relativeY < 0.85) {
        // Lower section (wheels) - maximum intrusion
        intrusion = motorcycleWidth * 0.8
      } else {
        // Bottom (exhaust) - moderate intrusion
        intrusion = motorcycleWidth * 0.5
      }
      
      return intrusion
    }
  }
  
  const intrusion = getMotorcycleIntrusion(y)
  
  // Add comfortable spacing (breathing room)
  const spacing = 40 // pixels of spacing between text and motorcycle
  
  // Calculate available width
  const availableWidth = baseWidth - intrusion - spacing
  
  // Ensure minimum width for readability
  const minWidth = baseWidth * 0.4
  return Math.max(availableWidth, minWidth)
}

/**
 * Layout text with dynamic line widths using Pretext
 * 
 * @param text - The article text to layout
 * @param font - Font string (e.g., "18px 'Crimson Text'")
 * @param baseWidth - Container width
 * @param lineHeight - Line height in pixels
 * @returns Array of text lines with their content and widths
 */
export function layoutTextWithFlow(
  text: string,
  font: string,
  baseWidth: number,
  lineHeight: number
): TextLine[] {
  // Prepare the text once (expensive operation)
  const prepared = prepareWithSegments(text, font, { whiteSpace: "normal" })
  
  const lines: TextLine[] = []
  let cursor: LayoutCursor | null = { segmentIndex: 0, graphemeIndex: 0 }
  let lineIndex = 0
  
  // Iterate through lines with varying widths
  while (cursor !== null) {
    const maxWidth = getLineWidth(lineIndex, baseWidth, lineHeight)
    
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

// Made with Bob
