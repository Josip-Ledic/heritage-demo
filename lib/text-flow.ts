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

type Interval = {
  left: number
  right: number
}

const MIN_SLOT_WIDTH = 50
const H_PAD = 20
const V_PAD = 8

/**
 * Check if a line's vertical band intersects with the obstacle
 */
function getObstacleInterval(
  obstacleX: number,
  obstacleY: number,
  obstacleWidth: number,
  obstacleHeight: number,
  lineTop: number,
  lineBottom: number,
): Interval | null {
  const top = lineTop - V_PAD
  const bottom = lineBottom + V_PAD
  
  // No intersection if line is above or below obstacle
  if (top >= obstacleY + obstacleHeight || bottom <= obstacleY) {
    return null
  }
  
  // Return blocked horizontal interval
  return {
    left: obstacleX - H_PAD,
    right: obstacleX + obstacleWidth + H_PAD,
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
 */
export function layoutTextWithObstacle(
  prepared: PreparedTextWithSegments,
  baseWidth: number,
  lineHeight: number,
  startY: number,
  motorcyclePos: MotorcyclePosition | null
): TextLine[] {
  const lines: TextLine[] = []
  let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
  let lineTop = startY
  
  while (true) {
    const lineBottom = lineTop + lineHeight
    const blocked: Interval[] = []
    
    // Check if motorcycle blocks this line
    if (motorcyclePos) {
      const interval = getObstacleInterval(
        motorcyclePos.x,
        motorcyclePos.y,
        motorcyclePos.width,
        motorcyclePos.height,
        lineTop,
        lineBottom
      )
      if (interval) {
        blocked.push(interval)
      }
    }
    
    // Carve out available slots
    const slots = carveTextLineSlots(
      { left: 0, right: baseWidth },
      blocked
    )
    
    // If no slots available, skip this line
    if (slots.length === 0) {
      lineTop += lineHeight
      continue
    }
    
    // Use the widest slot (demo uses leftmost, but widest is better for readability)
    const bestSlot = slots.reduce((best, slot) => {
      const bestWidth = best.right - best.left
      const slotWidth = slot.right - slot.left
      return slotWidth > bestWidth ? slot : best
    })
    
    const slotWidth = bestSlot.right - bestSlot.left
    
    // Layout next line in this slot
    const line = layoutNextLine(prepared, cursor, slotWidth)
    
    if (line === null) break
    
    lines.push({
      text: line.text,
      width: line.width,
      x: bestSlot.left,
      y: lineTop,
    })
    
    cursor = line.end
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
