'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Mic, Square, Play, Pause, Trash2, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface NoteVocaleProps {
  audioUrl?: string | null
  onAudioChange: (url: string | null) => void
  maxDurationSeconds?: number
  disabled?: boolean
}

export function NoteVocale({ 
  audioUrl, 
  onAudioChange, 
  maxDurationSeconds = 180, // 3 minutes par défaut
  disabled = false 
}: NoteVocaleProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [localAudioUrl, setLocalAudioUrl] = useState<string | null>(audioUrl || null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setLocalAudioUrl(audioUrl || null)
  }, [audioUrl])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(audioBlob)
        setLocalAudioUrl(url)
        onAudioChange(url)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Timer pour le chrono
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxDurationSeconds - 1) {
            stopRecording()
            toast.info('Durée maximale atteinte')
            return prev
          }
          return prev + 1
        })
      }, 1000)

    } catch (error) {
      console.error('Erreur accès microphone:', error)
      toast.error('Impossible d\'accéder au microphone')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsRecording(false)
  }

  const togglePlayback = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const deleteAudio = () => {
    if (localAudioUrl && localAudioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(localAudioUrl)
    }
    setLocalAudioUrl(null)
    onAudioChange(null)
    setCurrentTime(0)
    setDuration(0)
  }

  return (
    <Card className={cn(
      "border-border",
      isRecording && "border-red-500/50 bg-red-500/5"
    )}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Label */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className={cn(
                "w-4 h-4",
                isRecording ? "text-red-500 animate-pulse" : "text-amber-500"
              )} />
              <span className="text-sm font-medium">Note vocale terrain</span>
              <span className="text-xs text-muted-foreground">(optionnelle)</span>
            </div>
            {localAudioUrl && !isRecording && (
              <Button
                variant="ghost"
                size="sm"
                onClick={deleteAudio}
                disabled={disabled}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Recording / Playback Controls */}
          {!localAudioUrl ? (
            // Mode enregistrement
            <div className="flex flex-col items-center gap-4 py-4">
              {isRecording ? (
                <>
                  {/* Chrono */}
                  <div className="text-3xl font-mono font-bold text-red-500">
                    {formatTime(recordingTime)}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-sm text-red-400">Enregistrement en cours...</span>
                  </div>
                  {/* Stop Button */}
                  <Button
                    size="lg"
                    onClick={stopRecording}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-full w-16 h-16"
                  >
                    <Square className="w-6 h-6" />
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground text-center">
                    Parlez librement : contraintes, idées, remarques client...
                  </p>
                  {/* Record Button */}
                  <Button
                    size="lg"
                    onClick={startRecording}
                    disabled={disabled}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-full w-16 h-16 shadow-lg shadow-amber-500/20"
                  >
                    <Mic className="w-6 h-6" />
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Max {Math.floor(maxDurationSeconds / 60)} minutes
                  </span>
                </>
              )}
            </div>
          ) : (
            // Mode lecture
            <div className="space-y-3">
              <audio
                ref={audioRef}
                src={localAudioUrl}
                onEnded={handleAudioEnded}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
              />
              
              {/* Progress Bar */}
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="absolute h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>

              {/* Time Display */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>

              {/* Play/Pause Button */}
              <div className="flex justify-center">
                <Button
                  size="lg"
                  onClick={togglePlayback}
                  disabled={disabled}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-full w-14 h-14"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 ml-1" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
