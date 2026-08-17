import { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SignaturePadHandle {
  /** PNG data URL, or null if the pad is empty */
  toDataURL: () => string | null
  clear: () => void
  isEmpty: () => boolean
}

interface SignaturePadProps {
  className?: string
  onChange?: (hasSignature: boolean) => void
}

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  ({ className, onChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const drawing = useRef(false)
    const hasDrawn = useRef(false)
    const [empty, setEmpty] = useState(true)

    // Scale the canvas backing store for crisp lines on high-DPI screens
    // while keeping the CSS size fixed.
    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ratio = window.devicePixelRatio || 1
      const { width, height } = canvas.getBoundingClientRect()
      canvas.width = width * ratio
      canvas.height = height * ratio
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(ratio, ratio)
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.strokeStyle = '#0F172A'
      }
    }, [])

    function getPoint(e: React.PointerEvent<HTMLCanvasElement>) {
      const rect = canvasRef.current!.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.setPointerCapture(e.pointerId)
      const ctx = canvas.getContext('2d')!
      const { x, y } = getPoint(e)
      ctx.beginPath()
      ctx.moveTo(x, y)
      drawing.current = true
    }

    function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
      if (!drawing.current) return
      const ctx = canvasRef.current!.getContext('2d')!
      const { x, y } = getPoint(e)
      ctx.lineTo(x, y)
      ctx.stroke()
      if (!hasDrawn.current) {
        hasDrawn.current = true
        setEmpty(false)
        onChange?.(true)
      }
    }

    function handlePointerUp() {
      drawing.current = false
    }

    function clear() {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
      hasDrawn.current = false
      setEmpty(true)
      onChange?.(false)
    }

    useImperativeHandle(ref, () => ({
      toDataURL: () => (hasDrawn.current ? canvasRef.current!.toDataURL('image/png') : null),
      clear,
      isEmpty: () => !hasDrawn.current,
    }))

    return (
      <div className={cn('relative', className)}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Signature drawing area — draw your signature with mouse or touch"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="w-full h-40 rounded-md border border-slate-300 bg-white touch-none cursor-crosshair focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        />
        {empty && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-slate-300">
            Draw your signature here
          </span>
        )}
        <button
          type="button"
          onClick={clear}
          aria-label="Clear signature"
          className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-white/90 border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:text-slate-700 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        >
          <RotateCcw className="h-3 w-3" /> Clear
        </button>
      </div>
    )
  },
)
SignaturePad.displayName = 'SignaturePad'
