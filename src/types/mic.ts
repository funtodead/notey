import type { EntityRef } from './models'

export type MicMessage =
  | { id: string; role: 'user'; text: string; createdAt: string; kept: boolean }
  | { id: string; role: 'ai'; refs: EntityRef[]; createdAt: string }

export type MicError = 'offline' | 'nokey' | 'badkey' | 'nomic' | 'failed'

export type MicPhase = 'idle' | 'recording' | 'thinking' | 'filed' | 'error'
