'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X, Menu } from 'lucide-react'

interface CommitInfo {
  number: number
  hash: string
  message: string
}

const COMMITS: CommitInfo[] = [
  { number: 1, hash: 'a45d6df', message: 'feat: initial commit' },
  { number: 2, hash: 'e5282b6', message: 'first' },
  { number: 3, hash: '7b0b909', message: 'second' },
  { number: 4, hash: 'f49c679', message: 'third' },
  { number: 5, hash: '581aae7', message: 'fourth' },
  { number: 6, hash: 'ad734ba', message: 'fifth' },
  { number: 7, hash: '276e75e', message: 'sixth' },
  { number: 8, hash: 'd78194d', message: 'seventh' },
  { number: 9, hash: '56f5342', message: 'eight' },
  { number: 10, hash: '154e484', message: 'nineth' },
  { number: 11, hash: '98324c9', message: 'tenth' },
]

function getInitialCommit(): number {
  if (typeof window === 'undefined') return 1
  const path = window.location.pathname
  const match = path.match(/\/commit-(\d+)/)
  return match ? parseInt(match[1]) : 1
}

function isProduction(): boolean {
  if (typeof window === 'undefined') return false
  // Check if we're in a commit subdirectory (production deployment)
  return window.location.pathname.includes('/commit-')
}

export function CommitDebugPanel() {
  const [isExpanded, setIsExpanded] = useState(true)
  const [currentCommit, setCurrentCommit] = useState<number>(getInitialCommit)
  
  // Don't show panel in development mode
  if (!isProduction()) {
    return null
  }

  const navigateToCommit = (commitNumber: number) => {
    const baseUrl = window.location.origin + window.location.pathname.split('/commit-')[0]
    window.location.href = `${baseUrl}/commit-${commitNumber}/`
  }

  const goToPrevious = () => {
    if (currentCommit > 1) {
      navigateToCommit(currentCommit - 1)
    }
  }

  const goToNext = () => {
    if (currentCommit < COMMITS.length) {
      navigateToCommit(currentCommit + 1)
    }
  }

  const currentCommitInfo = COMMITS.find(c => c.number === currentCommit) || COMMITS[0]

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-4 right-4 z-50 bg-[#1e3a5f] text-[#faf9f6] p-3 rounded-lg shadow-lg hover:bg-[#2a4a7f] transition-colors border-2 border-[#c19a6b]"
        aria-label="Open debug panel"
      >
        <Menu className="w-5 h-5" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-[#1e3a5f] text-[#faf9f6] rounded-lg shadow-2xl border-2 border-[#c19a6b] w-80 overflow-hidden">
      {/* Header */}
      <div className="bg-[#c19a6b] text-[#1e3a5f] px-4 py-2 flex items-center justify-between">
        <div className="font-bold text-sm">Debug: Commit Navigator</div>
        <button
          onClick={() => setIsExpanded(false)}
          className="hover:bg-[#1e3a5f] hover:text-[#faf9f6] rounded p-1 transition-colors"
          aria-label="Minimize panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Current Commit Info */}
        <div className="space-y-1">
          <div className="text-xs text-[#c19a6b] font-semibold">CURRENT COMMIT</div>
          <div className="text-lg font-bold">
            #{currentCommit} of {COMMITS.length}
          </div>
          <div className="text-xs text-[#c19a6b] font-mono">
            {currentCommitInfo.hash}
          </div>
          <div className="text-sm text-[#faf9f6]/80 italic">
            &ldquo;{currentCommitInfo.message}&rdquo;
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="space-y-2">
          <div className="text-xs text-[#c19a6b] font-semibold">NAVIGATE</div>
          
          {/* Prev/Next Buttons */}
          <div className="flex gap-2">
            <button
              onClick={goToPrevious}
              disabled={currentCommit === 1}
              className="flex-1 bg-[#2a4a7f] hover:bg-[#c19a6b] hover:text-[#1e3a5f] disabled:opacity-30 disabled:cursor-not-allowed px-3 py-2 rounded transition-colors flex items-center justify-center gap-1 text-sm font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={goToNext}
              disabled={currentCommit === COMMITS.length}
              className="flex-1 bg-[#2a4a7f] hover:bg-[#c19a6b] hover:text-[#1e3a5f] disabled:opacity-30 disabled:cursor-not-allowed px-3 py-2 rounded transition-colors flex items-center justify-center gap-1 text-sm font-medium"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Commit Selector */}
          <select
            value={currentCommit}
            onChange={(e) => navigateToCommit(parseInt(e.target.value))}
            className="w-full bg-[#2a4a7f] text-[#faf9f6] px-3 py-2 rounded border border-[#c19a6b]/30 focus:border-[#c19a6b] focus:outline-none text-sm"
          >
            {COMMITS.map((commit) => (
              <option key={commit.number} value={commit.number}>
                #{commit.number}: {commit.message}
              </option>
            ))}
          </select>
        </div>

        {/* Home Link */}
        <div className="pt-2 border-t border-[#c19a6b]/30">
          <button
            onClick={() => { window.location.href = '/' }}
            className="block w-full text-center text-sm text-[#c19a6b] hover:text-[#faf9f6] transition-colors"
          >
            ← Back to Landing Page
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#2a4a7f] px-4 py-2 text-xs text-[#faf9f6]/60 text-center">
        HERITAGE Motors Demo
      </div>
    </div>
  )
}

// Made with Bob
