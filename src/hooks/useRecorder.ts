import { useRef, useState } from 'react'

const BARS = 26

interface Recording {
  recorder: MediaRecorder
  stream: MediaStream
  audio: AudioContext
  frame: number
  chunks: Blob[]
}

/** Records from the microphone, exposing live levels (0–1 per bar) and elapsed seconds. */
export function useRecorder() {
  const [levels, setLevels] = useState<number[]>(() => Array(BARS).fill(0))
  const [seconds, setSeconds] = useState(0)
  const current = useRef<Recording | null>(null)

  const release = () => {
    const rec = current.current
    if (!rec) return
    cancelAnimationFrame(rec.frame)
    rec.stream.getTracks().forEach((t) => t.stop())
    void rec.audio.close()
    current.current = null
  }

  /** Throws a NotAllowedError when microphone access is denied. */
  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    const audio = new AudioContext()
    const analyser = audio.createAnalyser()
    analyser.fftSize = 64
    audio.createMediaStreamSource(stream).connect(analyser)
    const data = new Uint8Array(analyser.frequencyBinCount)
    const rec: Recording = { recorder, stream, audio, frame: 0, chunks: [] }
    const startedAt = performance.now()

    const tick = () => {
      analyser.getByteFrequencyData(data)
      setLevels(Array.from({ length: BARS }, (_, i) => data[i % data.length] / 255))
      setSeconds(Math.floor((performance.now() - startedAt) / 1000))
      rec.frame = requestAnimationFrame(tick)
    }

    recorder.ondataavailable = (e) => rec.chunks.push(e.data)
    recorder.start()
    current.current = rec
    tick()
  }

  const stop = () =>
    new Promise<Blob>((resolve) => {
      const rec = current.current!
      rec.recorder.onstop = () => resolve(new Blob(rec.chunks, { type: rec.recorder.mimeType }))
      rec.recorder.stop()
      release()
    })

  return { start, stop, cancel: release, levels, seconds }
}
