'use client'

import { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

function MotorcycleModel() {
  const meshRef = useRef<THREE.Group>(null)
  
  // Load the GLB model using useGLTF hook (must be at top level)
  const { scene } = useGLTF('/heritage-demo/motorcycle-3d.glb')

  // Rotate the model slowly around Y-axis
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3 // Slow rotation
    }
  })

  return (
    <group ref={meshRef} position={[0, -1, 0]} scale={2}>
      <primitive object={scene} />
    </group>
  )
}

// Preload the model
useGLTF.preload('/heritage-demo/motorcycle-3d.glb')

export default function Motorcycle3D() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Use setTimeout to avoid synchronous setState in effect
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-amber-200 text-lg">Loading 3D Model...</div>
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        <pointLight position={[0, 5, 0]} intensity={0.5} />
        
        {/* 3D Model */}
        <MotorcycleModel />
        
        {/* Controls - disabled for auto-rotation */}
        {/* <OrbitControls enableZoom={false} enablePan={false} /> */}
      </Canvas>
    </div>
  )
}

// Made with Bob
