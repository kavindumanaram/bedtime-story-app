import { useCallback, useEffect, useRef, useState } from 'react'

export function useLongPress(callback: () => void, durationMs = 3000) {
  const [progress, setProgress] = useState(0)
  const [isHolding, setIsHolding] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)

  const cancel = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    timerRef.current = null
    rafRef.current = null
    startRef.current = null
    setIsHolding(false)
    setProgress(0)
  }, [])

  const start = useCallback(() => {
    cancel()
    startRef.current = Date.now()
    setIsHolding(true)

    const tick = () => {
      if (startRef.current === null) return
      const elapsed = Date.now() - startRef.current
      const p = Math.min(elapsed / durationMs, 1)
      setProgress(p)
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)

    timerRef.current = setTimeout(() => {
      cancel()
      callback()
    }, durationMs)
  }, [cancel, callback, durationMs])

  useEffect(() => cancel, [cancel])

  return {
    handlers: {
      onPointerDown: start,
      onPointerUp: cancel,
      onPointerLeave: cancel,
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    } as React.HTMLAttributes<HTMLElement>,
    progress,
    isHolding,
  }
}
