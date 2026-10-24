import type { Removal } from '../lib/deleting'
import type { FiledSummary } from '../lib/filing'
import type { EntityRef } from './models'

export type MicMessage =
  | { id: string; role: 'user'; text: string; createdAt: string; kept: boolean }
  | {
      id: string
      role: 'ai'
      /** What was filed. */
      refs: EntityRef[]
      /** What was deleted, as it looked before. */
      removed: FiledSummary[]
      /** How to bring the deleted things back on Undo all. */
      restore: Removal['restore']
      createdAt: string
    }

export type MicError = 'offline' | 'nokey' | 'badkey' | 'nomic' | 'failed'

export type MicPhase = 'idle' | 'recording' | 'thinking' | 'filed' | 'error'
