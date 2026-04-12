"use client"

import { useEffect, useState } from "react"

export function MotorcycleSilhouette() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger fade-in animation after mount
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className={`absolute right-0 top-1/4 w-[45%] transition-opacity duration-1000 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 800 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
      >
        {/* Motorcycle silhouette - simplified sport bike facing right */}
        <g fill="#c19a6b">
          {/* Rear wheel */}
          <circle cx="200" cy="300" r="80" />
          <circle cx="200" cy="300" r="50" fill="#1e3a5f" />
          
          {/* Front wheel */}
          <circle cx="600" cy="300" r="80" />
          <circle cx="600" cy="300" r="50" fill="#1e3a5f" />
          
          {/* Frame and body */}
          <path d="M 200 300 L 250 250 L 300 200 L 400 180 L 500 200 L 550 250 L 600 300" 
                strokeWidth="25" 
                stroke="#c19a6b" 
                fill="none" 
                strokeLinecap="round" 
                strokeLinejoin="round" />
          
          {/* Seat */}
          <ellipse cx="320" cy="200" rx="80" ry="30" />
          
          {/* Tank */}
          <path d="M 350 200 Q 420 160 480 190 Q 490 200 480 210 Q 420 230 350 210 Z" />
          
          {/* Handlebars */}
          <rect x="540" y="220" width="60" height="15" rx="7" />
          
          {/* Front fork */}
          <path d="M 560 235 L 600 300" 
                strokeWidth="20" 
                stroke="#c19a6b" 
                strokeLinecap="round" />
          
          {/* Rear suspension */}
          <path d="M 250 250 L 200 300" 
                strokeWidth="18" 
                stroke="#c19a6b" 
                strokeLinecap="round" />
          
          {/* Exhaust */}
          <ellipse cx="280" cy="320" rx="60" ry="12" />
          <rect x="220" y="308" width="60" height="24" rx="12" />
          
          {/* Windscreen */}
          <path d="M 480 190 Q 520 140 540 180 L 520 200 Q 500 180 480 190 Z" 
                opacity="0.6" />
        </g>
      </svg>
    </div>
  )
}

// Made with Bob
