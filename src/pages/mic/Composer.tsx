import { useLayoutEffect, useRef, useState } from 'react'

import { Icon } from '../../components/ui/Icon'
import type { MicSession } from '../../hooks/useMicSession'
import './Composer.css'

interface ComposerProps {
  session: MicSession
  text: string
  onTextChange: (text: string) => void
  onSend: () => void
}

const HINTS = {
  idle: 'Tap to talk',
  recording: 'Listening… tap to stop',
  thinking: 'Thinking…',
  filed: 'Tap to add more',
  error: 'Tap to talk',
}

/** The big mic orb, and a text box for typing instead. While typing, the orb steps aside. */
export function Composer({ session, text, onTextChange, onSend }: ComposerProps) {
  const [typing, setTyping] = useState(false)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const { phase } = session

  // Grow with the text (up to the CSS max-height, then scroll), and shrink back after sending.
  useLayoutEffect(() => {
    const el = textRef.current!
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [text])
  const recording = phase === 'recording'
  const busy = phase === 'thinking'

  const toggleRecording = () => (recording ? session.stopRecording() : session.startRecording())

  return (
    <div className={`composer ${typing ? 'composer-typing' : ''}`}>
      {!typing && (
        <div className="composer-dock">
          <div className={`composer-orb-well ${recording ? 'composer-recording' : ''}`}>
            <button
              className="composer-orb"
              aria-label={recording ? 'Stop recording' : 'Start talking'}
              disabled={busy}
              onClick={() => void toggleRecording()}
            >
              {recording ? <span className="composer-stop" aria-hidden="true" /> : <Icon name="mic" size={40} strokeWidth={2.1} />}
            </button>
          </div>
          <p className="composer-hint">{HINTS[phase]}</p>
        </div>
      )}

      <form
        className="composer-input"
        onSubmit={(e) => {
          e.preventDefault()
          onSend()
        }}
      >
        {typing && (
          <button
            type="button"
            className="composer-voice clay-sm"
            aria-label="Switch to voice"
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => (document.activeElement as HTMLElement | null)?.blur()}
          >
            <Icon name="mic" size={22} />
          </button>
        )}
        <label htmlFor="mic-text" className="visually-hidden">
          Message to Notey
        </label>
        <textarea
          ref={textRef}
          id="mic-text"
          className="clay-pressed"
          placeholder="Type instead…"
          rows={1}
          value={text}
          autoComplete="off"
          onChange={(e) => onTextChange(e.target.value)}
          onFocus={() => setTyping(true)}
          onBlur={() => setTyping(false)}
        />
        <button
          type="submit"
          className={`composer-send ${text.trim() ? 'composer-send-ready' : 'clay-sm'}`}
          aria-label="Send"
          disabled={!text.trim() || busy}
          // Keep the keyboard open when tapping send.
          onPointerDown={(e) => e.preventDefault()}
        >
          <Icon name="send" size={22} strokeWidth={2.8} />
        </button>
      </form>
    </div>
  )
}
