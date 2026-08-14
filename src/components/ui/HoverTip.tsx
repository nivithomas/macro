'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export function HoverTip({
  text,
  className = '',
  children,
}: {
  text: string
  className?: string
  children: React.ReactNode
}) {
  const anchorRef = useRef<HTMLSpanElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0, transform: 'translate(-50%, 0)' })

  useLayoutEffect(() => {
    if (!visible) return
    const anchor = anchorRef.current
    const tip = tipRef.current
    if (!anchor || !tip) return

    const rect = anchor.getBoundingClientRect()
    const padding = 12
    const tipW = tip.offsetWidth
    const tipH = tip.offsetHeight

    let x = rect.left + rect.width / 2
    x = Math.max(padding + tipW / 2, Math.min(window.innerWidth - padding - tipW / 2, x))

    const spaceBelow = window.innerHeight - rect.bottom - padding
    const spaceAbove = rect.top - padding
    let y: number
    let transform: string
    if (spaceBelow >= tipH || spaceBelow >= spaceAbove) {
      y = rect.bottom + padding
      transform = 'translate(-50%, 0)'
    } else {
      y = rect.top - padding
      transform = 'translate(-50%, -100%)'
    }

    setPos({ x, y, transform })
  }, [visible, text])

  if (!text.trim()) {
    return <span className={className}>{children}</span>
  }

  return (
    <>
      <span
        ref={anchorRef}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className={`inline-flex cursor-help ${className}`}
        tabIndex={0}
      >
        {children}
      </span>
      {visible && typeof document !== 'undefined' && createPortal(
        <div
          ref={tipRef}
          role="tooltip"
          style={{ left: pos.x, top: pos.y, transform: pos.transform }}
          className="fixed z-[9999] w-max max-w-[min(22rem,calc(100vw-1.5rem))] px-3 py-2.5 rounded-md bg-zinc-900 text-white text-[11px] leading-relaxed font-normal normal-case tracking-normal text-left shadow-lg pointer-events-none whitespace-normal break-words"
        >
          {text}
        </div>,
        document.body,
      )}
    </>
  )
}
