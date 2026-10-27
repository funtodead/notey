import { useEffect, useRef, useState } from 'react'

import { todayISO } from '../lib/dates'
import { loadMic, saveMic } from '../lib/storage'
import { existingContext, planChanges } from '../lib/changes'
import { emptiedLists, refile, toBundle, type Draft } from '../lib/filing'
import { fileText, GroqError, transcribe } from '../lib/groq'
import type { MicError, MicMessage, MicPhase } from '../types/mic'
import type { EntityRef } from '../types/models'
import { useRecorder } from './useRecorder'
import { useSettings } from './useSettings'
import { useStore } from './useStore'

/**
 * Everything behind the mic sheet: the conversation, recording, and filing what was said.
 * Lives in the mic button (not the sheet) so the conversation survives closing the sheet.
 */
export function useMicSession() {
  const { state, dispatch } = useStore()
  const { settings } = useSettings()
  const recorder = useRecorder()
  const [messages, setMessages] = useState<MicMessage[]>(loadMic)
  const [phase, setPhase] = useState<MicPhase>('idle')
  const [error, setError] = useState<MicError | null>(null)
  /** A recording that couldn't be transcribed yet (offline or no key). */
  const [keptAudio, setKeptAudio] = useState<Blob | null>(null)

  useEffect(() => saveMic(messages), [messages])

  // Async steps finish later; they must read the store as it is then, not as it was when they started.
  const latest = useRef({ state, settings })
  latest.current = { state, settings }

  const showError = (kind: MicError) => {
    setError(kind)
    setPhase('error')
  }

  const failWith = (e: unknown) => {
    if (e instanceof GroqError) showError(e.status === 401 ? 'badkey' : 'failed')
    else showError(e instanceof TypeError ? 'offline' : 'failed')
  }

  const setKept = (messageId: string, kept: boolean) =>
    setMessages((ms) => ms.map((m) => (m.id === messageId && m.role === 'user' ? { ...m, kept } : m)))

  const file = async (messageId: string, text: string) => {
    const { groqKey } = latest.current.settings
    if (!groqKey) {
      setKept(messageId, true)
      return showError('nokey')
    }
    setError(null)
    setPhase('thinking')
    try {
      const today = todayISO()
      const { categories, lists } = latest.current.state
      const existing = existingContext(latest.current.state, today)
      const { entries, deletions, updates } = await fileText(groqKey, text, {
        today,
        now: new Date().toTimeString().slice(0, 5),
        categories: categories.map(({ id, name }) => ({ id, name })),
        lists: lists.map((l) => l.name),
        existing: existing.lines,
      })
      const current = latest.current.state
      const plan = planChanges(deletions, updates, existing.refs, current, today)
      const { bundle, refs } = toBundle(entries, current, today)
      dispatch({ type: 'entities/remove', refs: plan.remove })
      dispatch({ type: 'entities/replace', bundle: plan.replace })
      dispatch({ type: 'entities/add', bundle })
      setKept(messageId, false)
      setMessages((ms) => [
        ...ms,
        {
          id: crypto.randomUUID(),
          role: 'ai',
          refs,
          changed: plan.changed,
          removed: plan.removed,
          restore: plan.restore,
          createdAt: new Date().toISOString(),
        },
      ])
      setPhase('filed')
    } catch (e) {
      setKept(messageId, true)
      failWith(e)
    }
  }

  const send = (text: string) => {
    const id = crypto.randomUUID()
    setMessages((ms) => [...ms, { id, role: 'user', text, createdAt: new Date().toISOString(), kept: false }])
    void file(id, text)
  }

  const transcribeAndFile = async (audio: Blob) => {
    const { groqKey } = latest.current.settings
    if (!groqKey) {
      setKeptAudio(audio)
      return showError('nokey')
    }
    setPhase('thinking')
    try {
      const text = await transcribe(groqKey, audio)
      setKeptAudio(null)
      if (text) send(text)
      else setPhase('idle')
    } catch (e) {
      setKeptAudio(audio)
      failWith(e)
    }
  }

  const startRecording = async () => {
    try {
      await recorder.start()
      setError(null)
      setPhase('recording')
    } catch {
      showError('nomic')
    }
  }

  const stopRecording = async () => transcribeAndFile(await recorder.stop())

  const keptMessage = messages.findLast((m) => m.role === 'user' && m.kept)
  const hasKept = !!keptAudio || !!keptMessage

  const retry = () => {
    if (keptAudio) void transcribeAndFile(keptAudio)
    else if (keptMessage?.role === 'user') void file(keptMessage.id, keptMessage.text)
  }

  // File kept messages by themselves once the phone is back online or a key is added.
  const retryLater = useRef(retry)
  retryLater.current = retry
  useEffect(() => {
    const onOnline = () => retryLater.current()
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [])
  const hadKey = useRef(!!settings.groqKey)
  useEffect(() => {
    if (settings.groqKey && !hadKey.current) retryLater.current()
    hadKey.current = !!settings.groqKey
  }, [settings.groqKey])

  const dismissError = () => {
    setError(null)
    setPhase('idle')
  }

  const replaceRef = (messageId: string, old: EntityRef, next: EntityRef | null) =>
    setMessages((ms) =>
      ms.map((m) =>
        m.id === messageId && m.role === 'ai'
          ? { ...m, refs: m.refs.flatMap((r) => (r.id === old.id && r.kind === old.kind ? (next ? [next] : []) : [r])) }
          : m,
      ),
    )

  const saveEdit = (messageId: string, ref: EntityRef, draft: Draft) => {
    const { bundle, ref: next } = refile(ref, draft, state)
    dispatch({ type: 'entities/remove', refs: [ref] })
    dispatch({ type: 'entities/add', bundle })
    replaceRef(messageId, ref, next)
  }

  const removeFiled = (messageId: string, ref: EntityRef) => {
    dispatch({ type: 'entities/remove', refs: [ref] })
    replaceRef(messageId, ref, null)
  }

  /** Takes back everything one message filed, changed or deleted, along with the message and what was said. */
  const undoAll = (messageId: string) => {
    const index = messages.findIndex((m) => m.id === messageId)
    const message = messages[index]
    if (message?.role !== 'ai') return
    const lists = emptiedLists(message.refs, state).map((l) => ({ kind: 'list' as const, id: l.id }))
    const { added, replaced } = message.restore
    dispatch({ type: 'entities/remove', refs: [...message.refs, ...lists] })
    dispatch({ type: 'entities/replace', bundle: replaced })
    dispatch({ type: 'entities/add', bundle: added })
    setMessages((ms) => ms.filter((_, i) => i !== index && i !== index - 1))
    setPhase('idle')
  }

  /** Empties the conversation; what was filed stays filed. */
  const clear = () => {
    setMessages([])
    setPhase('idle')
  }

  /** Called when the sheet opens: last time's result becomes part of the history. */
  const resume = () => {
    if (phase === 'filed') setPhase('idle')
  }

  /** Called when the sheet closes. */
  const pause = () => {
    if (phase === 'recording') {
      recorder.cancel()
      setPhase('idle')
    }
  }

  return {
    messages,
    phase,
    error,
    hasKept,
    levels: recorder.levels,
    seconds: recorder.seconds,
    send,
    startRecording,
    stopRecording,
    retry,
    dismissError,
    saveEdit,
    removeFiled,
    undoAll,
    clear,
    resume,
    pause,
  }
}

export type MicSession = ReturnType<typeof useMicSession>
