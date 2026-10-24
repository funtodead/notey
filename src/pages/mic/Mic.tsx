import { useEffect, useRef, useState } from 'react'

import type { MicSession } from '../../hooks/useMicSession'
import type { EntityRef } from '../../types/models'
import { EditFiled } from '../../components/items/EditFiled'
import { Composer } from './Composer'
import { MessageList } from './MessageList'
import { MicError } from './MicError'
import { MicHeader } from './MicHeader'
import { MicIntro } from './MicIntro'
import { Recording } from './Recording'
import { Thinking } from './Thinking'
import './Mic.css'

interface MicProps {
  session: MicSession
  onClose: () => void
}

export default function Mic({ session, onClose }: MicProps) {
  const [text, setText] = useState('')
  const [editing, setEditing] = useState<{ messageId: string; ref: EntityRef } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { messages, phase, error } = session

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, phase])

  const send = () => {
    if (!text.trim()) return
    session.send(text.trim())
    setText('')
  }

  return (
    <div className="mic">
      <MicHeader session={session} onClose={onClose} />

      <section ref={scrollRef} className="mic-conversation" aria-label="Conversation">
        {messages.length === 0 && phase === 'idle' && <MicIntro onPick={setText} />}
        <MessageList
          session={session}
          onEdit={(messageId, ref) => setEditing({ messageId, ref })}
          onDone={onClose}
        />
        {phase === 'recording' && <Recording levels={session.levels} seconds={session.seconds} />}
        {phase === 'thinking' && <Thinking />}
        {phase === 'error' && error && <MicError kind={error} session={session} onClose={onClose} />}
      </section>

      <Composer session={session} text={text} onTextChange={setText} onSend={send} />

      <EditFiled
        entity={editing?.ref ?? null}
        onClose={() => setEditing(null)}
        onSave={(draft) => editing && session.saveEdit(editing.messageId, editing.ref, draft)}
        onRemove={() => editing && session.removeFiled(editing.messageId, editing.ref)}
      />
    </div>
  )
}
