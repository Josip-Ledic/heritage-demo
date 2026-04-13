'use client'

import { useRef, useEffect, useState, Suspense, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

interface Motorcycle3DProps {
  onBoundsChange?: (bounds: {
    width: number;
    height: number;
    rotation: number;
    polygon: Array<{ x: number; y: number }>;
  }) => void
  onDragStart?: () => void
  onDragEnd?: () => void
}

// Helper to get the correct asset path
const getAssetPath = (path: string) => {
  if (typeof window === 'undefined') {
    const assetPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX || ''
    return `${assetPrefix}${path}`
  }
  if (window.location.hostname.includes('github.io')) {
    return `/heritage-demo${path}`
  }
  return path
}

function MotorcycleModel({ onBoundsChange, onDragStart, onDragEnd }: {
  onBoundsChange?: (bounds: { width: number; height: number; rotation: number; polygon: Array<{ x: number; y: number }> }) => void
  onDragStart?: () => void
  onDragEnd?: () => void
}) {
  const meshRef = useRef<THREE.Group>(null)
  const [modelPath] = useState(() => getAssetPath('/motorcycle-3d.glb'))
  const { camera, size, raycaster, pointer } = useThree()
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef(new THREE.Vector3())
  
  // Load the GLB model using useGLTF hook (must be at top level)
  const { scene } = useGLTF(modelPath)

  // Clone the scene to avoid issues with reusing the same object
  const clonedScene = scene.clone()

  // Helper: project 3D world point to 2D screen coordinates
  const worldToScreen = useCallback((worldPos: THREE.Vector3) => {
    const projected = worldPos.clone().project(camera)
    return {
      x: (projected.x * 0.5 + 0.5) * size.width,
      y: (-projected.y * 0.5 + 0.5) * size.height
    }
  }, [camera, size])

  // Graham scan convex hull algorithm
  const convexHull = useCallback((points: Array<{ x: number; y: number }>) => {
    if (points.length <= 3) return points
    
    // Find bottom-most (then left-most) point
    let pivot = points.reduce((best, p) =>
      (p.y > best.y || (p.y === best.y && p.x < best.x)) ? p : best,
      points[0]
    )
    
    // Sort by polar angle
    const sorted = points.filter(p => p !== pivot).sort((a, b) => {
      const angA = Math.atan2(a.y - pivot.y, a.x - pivot.x)
      const angB = Math.atan2(b.y - pivot.y, b.x - pivot.x)
      if (angA !== angB) return angA - angB
      const dA = (a.x - pivot.x) ** 2 + (a.y - pivot.y) ** 2
      const dB = (b.x - pivot.x) ** 2 + (b.y - pivot.y) ** 2
      return dA - dB
    })
    
    const hull = [pivot]
    for (const p of sorted) {
      while (hull.length >= 2) {
        const a = hull[hull.length - 2]
        const b = hull[hull.length - 1]
        const cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x)
        if (cross <= 0) hull.pop()
        else break
      }
      hull.push(p)
    }
    return hull
  }, [])

  // Calculate screen-space polygon from actual 3D model vertices (more accurate silhouette)
  const calculateScreenPolygon = useCallback(() => {
    if (!meshRef.current) return null
    
    // CRITICAL: Update world matrices before sampling
    meshRef.current.updateMatrixWorld(true)
    
    const points: Array<{ x: number; y: number }> = []
    
    // Sample vertices from the actual geometry for accurate silhouette
    meshRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const geometry = child.geometry
        const positionAttribute = geometry.attributes.position
        
        if (positionAttribute) {
          // Sample every Nth vertex to keep performance reasonable
          const sampleRate = Math.max(1, Math.floor(positionAttribute.count / 50))
          
          for (let i = 0; i < positionAttribute.count; i += sampleRate) {
            const vertex = new THREE.Vector3()
            vertex.fromBufferAttribute(positionAttribute, i)
            
            // Transform to world space
            vertex.applyMatrix4(child.matrixWorld)
            
            // Project to screen
            const screenPt = worldToScreen(vertex)
            points.push(screenPt)
          }
        }
      }
    })
    
    // Fallback to bounding box if no vertices found
    if (points.length === 0) {
      const box = new THREE.Box3().setFromObject(meshRef.current)
      const size3D = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      const halfSize = size3D.clone().multiplyScalar(0.5)
      
      const corners = [
        new THREE.Vector3(center.x + halfSize.x, center.y + halfSize.y, center.z + halfSize.z),
        new THREE.Vector3(center.x - halfSize.x, center.y + halfSize.y, center.z + halfSize.z),
        new THREE.Vector3(center.x + halfSize.x, center.y - halfSize.y, center.z + halfSize.z),
        new THREE.Vector3(center.x - halfSize.x, center.y - halfSize.y, center.z + halfSize.z),
        new THREE.Vector3(center.x + halfSize.x, center.y + halfSize.y, center.z - halfSize.z),
        new THREE.Vector3(center.x - halfSize.x, center.y + halfSize.y, center.z - halfSize.z),
        new THREE.Vector3(center.x + halfSize.x, center.y - halfSize.y, center.z - halfSize.z),
        new THREE.Vector3(center.x - halfSize.x, center.y - halfSize.y, center.z - halfSize.z),
      ]
      
      points.push(...corners.map(worldToScreen))
    }
    
    // Compute convex hull
    const hull = convexHull(points)
    
    // Calculate bounding dimensions
    const xs = hull.map(p => p.x)
    const ys = hull.map(p => p.y)
    const width = Math.max(...xs) - Math.min(...xs)
    const height = Math.max(...ys) - Math.min(...ys)
    
    return { polygon: hull, width, height }
  }, [worldToScreen, convexHull])

  // Handle dragging
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const x = (screenX / size.width) * 2 - 1
    const y = -(screenY / size.height) * 2 + 1
    const vec = new THREE.Vector3(x, y, 0.5)
    vec.unproject(camera)
    const dir = vec.sub(camera.position).normalize()
    const distance = -camera.position.z / dir.z
    return camera.position.clone().add(dir.multiplyScalar(distance))
  }, [camera, size])

  const handlePointerDown = useCallback((e: any) => {
    e.stopPropagation()
    if (meshRef.current) {
      const worldPos = screenToWorld(e.clientX, e.clientY)
      dragOffset.current.copy(meshRef.current.position).sub(worldPos)
      setIsDragging(true)
      onDragStart?.()
    }
  }, [screenToWorld, onDragStart])

  const handlePointerMove = useCallback((e: any) => {
    if (isDragging && meshRef.current) {
      const worldPos = screenToWorld(e.clientX, e.clientY)
      meshRef.current.position.copy(worldPos.add(dragOffset.current))
    }
  }, [isDragging, screenToWorld])

  const handlePointerUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false)
      onDragEnd?.()
    }
  }, [isDragging, onDragEnd])

  // Rotate the model slowly around Y-axis only and update bounds
  useFrame((state, delta) => {
    if (meshRef.current && !isDragging) {
      // Only rotate around Y-axis for stable rotation (pause during drag)
      meshRef.current.rotation.y += delta * 0.2
      meshRef.current.rotation.x = 0
      meshRef.current.rotation.z = 0
    }
    
    // Always calculate and report bounds
    if (meshRef.current && onBoundsChange) {
      const result = calculateScreenPolygon()
      if (result) {
        onBoundsChange({
          width: result.width,
          height: result.height,
          rotation: meshRef.current.rotation.y,
          polygon: result.polygon
        })
      }
    }
  })

  return (
    <group
      ref={meshRef}
      position={[0, 1, 0]}
      scale={2}
      rotation={[0, 0, 0]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <primitive object={clonedScene} />
    </group>
  )
}

// Preload will be done dynamically based on environment
if (typeof window !== 'undefined') {
  useGLTF.preload(getAssetPath('/motorcycle-3d.glb'))
}

function LoadingFallback() {
  // Return null to hide the loading cube
  return null
}

export default function Motorcycle3D({ onBoundsChange, onDragStart, onDragEnd }: Motorcycle3DProps = {}) {
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Use setTimeout to avoid synchronous setState in effect
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-lg">
        <div className="text-amber-200 text-sm">Loading 3D Model...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/50 to-red-800/50 rounded-lg">
        <div className="text-red-200 text-sm">Error loading 3D model</div>
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: false,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45} />
        
        {/* Lighting - brighter */}
        <ambientLight intensity={1.2} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />
        <directionalLight position={[-10, -10, -5]} intensity={0.8} />
        <pointLight position={[0, 5, 0]} intensity={0.6} />
        <pointLight position={[5, 0, 5]} intensity={0.5} />
        
        {/* 3D Model with Suspense for loading */}
        <Suspense fallback={<LoadingFallback />}>
          <MotorcycleModel
            onBoundsChange={onBoundsChange}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}

// Made with Bob
