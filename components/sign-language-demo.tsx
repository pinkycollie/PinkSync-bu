"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Camera, Square, Loader2, Zap, CheckCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Webcam from "react-webcam"
import { useWebSocket } from "@/contexts/websocket-context"

interface TranslationResult {
  text: string
  confidence: number
  features_detected: boolean
}

export function SignLanguageDemo() {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [permissionGranted, setPermissionGranted] = useState(false)

  const webcamRef = useRef<Webcam>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunks = useRef<Blob[]>([])

  const { sendMessage, onMessage, offMessage, isConnected } = useWebSocket()

  useEffect(() => {
    // Request camera permission
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(() => setPermissionGranted(true))
      .catch(() => setError("Camera permission required for sign language recognition"))

    // Set up WebSocket message handler
    const handleMessage = (message: any) => {
      if (message.type === "translation_result") {
        setTranslationResult(message.data)
        setIsProcessing(false)
      } else if (message.type === "partial_translation") {
        setTranslationResult(message.data)
      } else if (message.type === "error") {
        setError(message.message)
        setIsProcessing(false)
      }
    }

    onMessage(handleMessage)

    return () => {
      offMessage(handleMessage)
    }
  }, [onMessage, offMessage])

  const startRecording = useCallback(() => {
    if (!webcamRef.current?.stream) return

    setError(null)
    setTranslationResult(null)
    recordedChunks.current = []

    const mediaRecorder = new MediaRecorder(webcamRef.current.stream, {
      mimeType: "video/webm",
    })

    mediaRecorderRef.current = mediaRecorder

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.current.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks.current, { type: "video/webm" })
      processVideo(blob)
    }

    mediaRecorder.start()
    setIsRecording(true)
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsProcessing(true)
    }
  }, [isRecording])

  const processVideo = async (videoBlob: Blob) => {
    try {
      // Convert blob to base64 for transmission
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64data = reader.result as string

        if (isConnected) {
          // Send via WebSocket for real-time processing
          sendMessage("translation_request", {
            video_data: base64data,
            source_language: "ASL",
            target_language: "en",
          })
        } else {
          // Fallback to HTTP API
          processVideoHTTP(base64data)
        }
      }
      reader.readAsDataURL(videoBlob)
    } catch (error) {
      setError("Failed to process video")
      setIsProcessing(false)
    }
  }

  const processVideoHTTP = async (videoData: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/translation/sign-to-text`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("pinksync_token")}`,
        },
        body: JSON.stringify({
          video_data: videoData,
          source_language: "ASL",
          target_language: "en",
        }),
      })

      if (!response.ok) {
        throw new Error("Translation failed")
      }

      const result = await response.json()
      setTranslationResult(result)
    } catch (error) {
      setError("Translation service unavailable. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (!permissionGranted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Camera className="w-6 h-6" />
            Camera Access Required
          </CardTitle>
          <CardDescription>Please allow camera access to try the sign language recognition demo</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={() => window.location.reload()} className="pinksync-glow">
            Grant Camera Access
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            AI Sign Language Recognition
          </CardTitle>
          <CardDescription>Record yourself signing and watch our AI translate in real-time</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Camera Feed */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <Webcam
              ref={webcamRef}
              audio={false}
              className="w-full h-full object-cover"
              screenshotFormat="image/jpeg"
              videoConstraints={{
                width: 1280,
                height: 720,
                facingMode: "user",
              }}
            />

            {/* Recording Indicator */}
            <AnimatePresence>
              {isRecording && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-4 left-4 flex items-center gap-2"
                >
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-white text-sm font-medium">Recording</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Processing Overlay */}
            <AnimatePresence>
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center"
                >
                  <div className="text-center text-white">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    <p>Processing sign language...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            {!isRecording ? (
              <Button onClick={startRecording} size="lg" className="pinksync-glow" disabled={isProcessing}>
                <Camera className="w-5 h-5 mr-2" />
                Start Recording
              </Button>
            ) : (
              <Button onClick={stopRecording} size="lg" variant="destructive">
                <Square className="w-5 h-5 mr-2" />
                Stop Recording
              </Button>
            )}
          </div>

          {/* Results */}
          <AnimatePresence>
            {translationResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Translation Result</h3>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    {Math.round(translationResult.confidence * 100)}% confidence
                  </Badge>
                </div>

                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <p className="text-lg leading-relaxed">{translationResult.text || "Processing..."}</p>
                  </CardContent>
                </Card>

                {translationResult.features_detected && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Sign language features detected successfully
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
              >
                <p className="text-destructive text-sm">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Demo Instructions */}
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Demo Instructions:</strong> Position yourself clearly in the camera frame and sign slowly for best
              results.
            </p>
            <p>
              This demo supports basic ASL signs. Full platform includes advanced recognition for technical and
              specialized vocabulary.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
