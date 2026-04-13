import {
  layoutNextLine,
  type PreparedTextWithSegments,
  type LayoutCursor,
} from "@chenglou/pretext"

export interface TextLine {
  text: string
  width: number
  x: number
  y: number
}

export interface MotorcyclePosition {
  x: number
  y: number
  width: number
  height: number
}

export interface RectObstacle {
  x: number
  y: number
  width: number
  height: number
}

export interface ImageObstacle {
  x: number
  y: number
  width: number
  height: number
  imageData?: ImageData // Optional: for alpha-channel based flow
}

export interface PolygonObstacle {
  polygon: Array<{ x: number; y: number }>
  x: number // for compatibility
  y: number // for compatibility
}

type Interval = {
  left: number
  right: number
}

const MIN_SLOT_WIDTH = 50
const H_PAD = 35
const V_PAD = 15
const RECT_H_PAD = 15
const RECT_V_PAD = 10

/**
 * Calculate the horizontal interval blocked by a circular obstacle for a given vertical band
 * This is the exact algorithm from the demo (circleIntervalForBand)
 */
function getCircleIntervalForBand(
  cx: number,
  cy: number,
  r: number,
  bandTop: number,
  bandBottom: number,
  hPad: number,
  vPad: number,
): Interval | null {
  const top = bandTop - vPad
  const bottom = bandBottom + vPad
  
  // Check if band is completely above or below circle
  if (top >= cy + r || bottom <= cy - r) {
    return null
  }
  
  // Calculate minimum distance from circle center to the band
  const minDy = cy >= top && cy <= bottom ? 0 : cy < top ? top - cy : cy - bottom
  
  // If minimum distance is greater than radius, no intersection
  if (minDy >= r) {
    return null
  }
  
  // Calculate maximum horizontal distance using Pythagorean theorem
  const maxDx = Math.sqrt(r * r - minDy * minDy)
  
  return {
    left: cx - maxDx - hPad,
    right: cx + maxDx + hPad,
  }
}

/**
 * Carve available text slots from base interval, subtracting blocked intervals
 * This is the core algorithm from the demo
 */
function carveTextLineSlots(base: Interval, blocked: Interval[]): Interval[] {
  let slots = [base]
  
  for (const interval of blocked) {
    const next: Interval[] = []
    
    for (const slot of slots) {
      // Slot doesn't intersect with blocked interval
      if (interval.right <= slot.left || interval.left >= slot.right) {
        next.push(slot)
        continue
      }
      
      // Carve out the blocked part
      if (interval.left > slot.left) {
        next.push({ left: slot.left, right: interval.left })
      }
      if (interval.right < slot.right) {
        next.push({ left: interval.right, right: slot.right })
      }
    }
    
    slots = next
  }
  
  // Filter out slots that are too narrow
  return slots.filter(slot => slot.right - slot.left >= MIN_SLOT_WIDTH)
}

/**
 * Get horizontal interval blocked by an image obstacle at a specific Y position
 * Samples the alpha channel to find the actual shape bounds
 */
function getImageIntervalForBand(
  imageObstacle: ImageObstacle,
  lineTop: number,
  lineBottom: number,
  hPad: number,
  vPad: number,
): Interval | null {
  const top = lineTop - vPad
  const bottom = lineBottom + vPad
  
  // Check if line intersects with image vertically
  if (bottom <= imageObstacle.y || top >= imageObstacle.y + imageObstacle.height) {
    return null
  }
  
  // If no image data, fall back to rectangular bounds
  if (!imageObstacle.imageData) {
    return {
      left: imageObstacle.x - hPad,
      right: imageObstacle.x + imageObstacle.width + hPad,
    }
  }
  
  // Sample the alpha channel at the line's Y position
  const relativeY = Math.floor(((lineTop + lineBottom) / 2 - imageObstacle.y) / imageObstacle.height * imageObstacle.imageData.height)
  
  if (relativeY < 0 || relativeY >= imageObstacle.imageData.height) {
    return null
  }
  
  // Find leftmost and rightmost opaque pixels in this row
  let leftmost = imageObstacle.imageData.width
  let rightmost = 0
  const alphaThreshold = 30 // Pixels with alpha > 30 are considered opaque
  
  for (let x = 0; x < imageObstacle.imageData.width; x++) {
    const pixelIndex = (relativeY * imageObstacle.imageData.width + x) * 4
    const alpha = imageObstacle.imageData.data[pixelIndex + 3]
    
    if (alpha > alphaThreshold) {
      if (x < leftmost) leftmost = x
      if (x > rightmost) rightmost = x
    }
  }
  
  // No opaque pixels found in this row
  if (leftmost > rightmost) {
    return null
  }
  
  // Convert image coordinates to page coordinates
  const scaleX = imageObstacle.width / imageObstacle.imageData.width
  const left = imageObstacle.x + leftmost * scaleX - hPad
  const right = imageObstacle.x + (rightmost + 1) * scaleX + hPad
  
  return { left, right }
}

/**
 * For a convex polygon, find the x-interval [left, right] that the polygon
 * occupies at scanline y (returns null if polygon doesn't cover that y)
 */
function polygonXIntervalAtY(poly: Array<{ x: number; y: number }>, y: number): { left: number; right: number } | null {
  let minX = Infinity
  let maxX = -Infinity
  const n = poly.length
  
  for (let i = 0; i < n; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % n]
    const minY = Math.min(a.y, b.y)
    const maxY = Math.max(a.y, b.y)
    
    if (y < minY || y > maxY) continue
    
    if (maxY === minY) {
      minX = Math.min(minX, a.x, b.x)
      maxX = Math.max(maxX, a.x, b.x)
    } else {
      const t = (y - a.y) / (b.y - a.y)
      const ix = a.x + t * (b.x - a.x)
      minX = Math.min(minX, ix)
      maxX = Math.max(maxX, ix)
    }
  }
  
  return minX === Infinity ? null : { left: minX, right: maxX }
}

/**
 * Layout text with obstacle avoidance using the demo's algorithm
 * Supports circular obstacles, rectangular obstacles, image-based obstacles, and polygon obstacles
 */
export function layoutTextWithObstacle(
  prepared: PreparedTextWithSegments,
  baseWidth: number,
  lineHeight: number,
  startY: number,
  motorcyclePos: MotorcyclePosition | null,
  rectObstacles: RectObstacle[] = [],
  imageObstacle: ImageObstacle | null = null,
  polygonObstacle: PolygonObstacle | null = null
): TextLine[] {
  const lines: TextLine[] = []
  let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
  let lineTop = startY
  let textExhausted = false
  
  while (!textExhausted) {
    const lineBottom = lineTop + lineHeight
    const blocked: Interval[] = []
    
    // Check if polygon obstacle blocks this line (highest priority)
    if (polygonObstacle && polygonObstacle.polygon) {
      // Sample at top, middle, and bottom of the line band for accuracy
      const sampleYs = [lineTop, (lineTop + lineBottom) * 0.5, lineBottom]
      let left = Infinity
      let right = -Infinity
      
      for (const sy of sampleYs) {
        const interval = polygonXIntervalAtY(polygonObstacle.polygon, sy)
        if (interval) {
          left = Math.min(left, interval.left)
          right = Math.max(right, interval.right)
        }
      }
      
      if (right > left) {
        blocked.push({
          left: left - H_PAD,
          right: right + H_PAD
        })
      }
    }
    // Check if image obstacle blocks this line (takes precedence over circle)
    else if (imageObstacle) {
      const interval = getImageIntervalForBand(
        imageObstacle,
        lineTop,
        lineBottom,
        H_PAD,
        V_PAD
      )
      if (interval) {
        blocked.push(interval)
      }
    }
    // Fallback to circular obstacle if no image or polygon obstacle
    else if (motorcyclePos) {
      // Treat the motorcycle as a circle with center and radius
      const cx = motorcyclePos.x + motorcyclePos.width / 2
      const cy = motorcyclePos.y + motorcyclePos.height / 2
      const r = Math.max(motorcyclePos.width, motorcyclePos.height) / 2
      
      const interval = getCircleIntervalForBand(
        cx,
        cy,
        r,
        lineTop,
        lineBottom,
        H_PAD,
        V_PAD
      )
      if (interval) {
        blocked.push(interval)
      }
    }
    
    // Check if any rectangular obstacles block this line
    for (const rect of rectObstacles) {
      const top = lineTop - RECT_V_PAD
      const bottom = lineBottom + RECT_V_PAD
      
      // Check vertical intersection
      if (bottom > rect.y && top < rect.y + rect.height) {
        blocked.push({
          left: rect.x - RECT_H_PAD,
          right: rect.x + rect.width + RECT_H_PAD,
        })
      }
    }
    
    // Carve out available slots
    const slots = carveTextLineSlots(
      { left: 0, right: baseWidth },
      blocked
    )
    
    // If no slots available, skip this line (but don't break - text continues below)
    if (slots.length === 0) {
      lineTop += lineHeight
      continue
    }
    
    // Sort slots left to right (demo's approach)
    const orderedSlots = [...slots].sort((a, b) => a.left - b.left)
    
    // Fill all available slots on this line
    for (const slot of orderedSlots) {
      const slotWidth = slot.right - slot.left
      
      // Layout next line in this slot
      const line = layoutNextLine(prepared, cursor, slotWidth)
      
      if (line === null) {
        textExhausted = true
        break
      }
      
      lines.push({
        text: line.text,
        width: line.width,
        x: slot.left,
        y: lineTop,
      })
      
      cursor = line.end
    }
    
    lineTop += lineHeight
  }
  
  return lines
}

/**
 * Hit test for dragging
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
