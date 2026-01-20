'use client'

import { useRef, useState, useCallback } from 'react'

export interface SignatureData {
  dataUrl: string
  isEmpty: boolean
}

interface SignaturePadProps {
  onChange: (data: SignatureData) => void
  className?: string
  width?: number
  height?: number
}

export function SignaturePad({ onChange, className, width = 400, height = 200 }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  // Fonction utilitaire pour obtenir les coordonnées depuis un événement (souris ou tactile)
  const getCoordinates = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    
    // Gérer les événements tactiles
    if ('touches' in e && e.touches.length > 0) {
      const touch = e.touches[0]
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      }
    }
    
    // Gérer les événements de souris
    if ('clientX' in e) {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
    }
    
    return null
  }, [])

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // Empêcher le comportement par défaut pour les événements tactiles (scrolling, etc.)
    if ('touches' in e) {
      e.preventDefault()
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const coords = getCoordinates(e)
    if (!coords) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(coords.x, coords.y)
    setIsDrawing(true)
  }, [getCoordinates])

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    // Empêcher le comportement par défaut pour les événements tactiles
    if ('touches' in e) {
      e.preventDefault()
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const coords = getCoordinates(e)
    if (!coords) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#000'
    ctx.lineTo(coords.x, coords.y)
    ctx.stroke()
  }, [isDrawing, getCoordinates])

  const save = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dataUrl = canvas.toDataURL()
    const isEmpty = canvas.toDataURL() === 'data:,'

    onChange({ dataUrl, isEmpty })
  }, [onChange])

  const stopDrawing = useCallback((e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // Empêcher le comportement par défaut pour les événements tactiles
    if (e && 'touches' in e) {
      e.preventDefault()
    }
    
    setIsDrawing(false)
    // Sauvegarder automatiquement après avoir arrêté de dessiner
    save()
  }, [save])

  const clear = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    onChange({ dataUrl: '', isEmpty: true })
  }, [onChange])

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-300 rounded cursor-crosshair bg-white touch-none"
        style={{ touchAction: 'none' }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        onTouchCancel={stopDrawing}
      />
      <button
        type="button"
        onClick={clear}
        className="mt-2 px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded border border-gray-600"
      >
        Effacer
      </button>
    </div>
  )
}