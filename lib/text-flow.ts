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

type Interval = {
  left: number
  right: number
}

const MIN_SLOT_WIDTH = 50
const H_PAD = 20
const V_PAD = 8
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
 * Layout text with obstacle avoidance using the demo's algorithm
 * Supports both circular obstacles (orb) and rectangular obstacles (pull quotes)
 */
export function layoutTextWithObstacle(
  prepared: PreparedTextWithSegments,
  baseWidth: number,
  lineHeight: number,
  startY: number,
  motorcyclePos: MotorcyclePosition | null,
  rectObstacles: RectObstacle[] = []
): TextLine[] {
  const lines: TextLine[] = []
  let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
  let lineTop = startY
  let textExhausted = false
  
  while (!textExhausted) {
    const lineBottom = lineTop + lineHeight
    const blocked: Interval[] = []
    
    // Check if motorcycle blocks this line
    if (motorcyclePos) {
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
