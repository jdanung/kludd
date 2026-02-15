'use client'

import { useRef, useEffect, useState } from 'react'

interface DrawingCanvasProps {
  onSave: (dataUrl: string) => void
  disabled?: boolean
}

export default function DrawingCanvas({ onSave, disabled }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState('#ffffff')
  const [lineWidth, setLineWidth] = useState(5)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size based on container
    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect()
      if (rect) {
        canvas.width = rect.width
        canvas.height = rect.height
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.strokeStyle = color
        ctx.lineWidth = lineWidth
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) {
      ctx.strokeStyle = color
      ctx.lineWidth = lineWidth
    }
  }, [color, lineWidth])

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return
    setIsDrawing(true)
    draw(e)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    const ctx = canvasRef.current?.getContext('2d')
    ctx?.beginPath()
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const rect = canvas.getBoundingClientRect()
    let x, y

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = e.clientX - rect.left
      y = e.clientY - rect.top
    }

    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  return (
    <div className="flex flex-col gap-4 w-full h-full min-h-[300px]">
      <div className="flex-1 glass-card relative overflow-hidden bg-kludd-purple/30">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full touch-none cursor-crosshair"
        />
      </div>

      <div className="flex items-center justify-between gap-2 p-2 glass-card">
        <div className="flex gap-2">
          {['#ffffff', '#ff2d78', '#00d4ff', '#7fff00', '#ff8c00'].map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-white scale-110' : 'border-transparent opacity-60'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={clear}
            className="px-4 py-2 text-sm font-display bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            RENSA
          </button>
          <button
            onClick={() => {
              const dataUrl = canvasRef.current?.toDataURL('image/png')
              if (dataUrl) onSave(dataUrl)
            }}
            className="px-6 py-2 text-sm font-display bg-kludd-blue text-kludd-bg font-bold rounded-lg hover:scale-105 active:scale-95 transition-all"
          >
            KLAR!
          </button>
        </div>
      </div>
    </div>
  )
}
