import type { MicMessage } from '../types/mic'
import type { Settings, StoreData } from '../types/models'

const DATA_KEY = 'notey:data'
const SETTINGS_KEY = 'notey:settings'
const MIC_KEY = 'notey:mic'
const MIC_KEPT = 50

export function loadData(): StoreData | null {
  const raw = localStorage.getItem(DATA_KEY)
  return raw ? (JSON.parse(raw) as StoreData) : null
}

export function saveData(data: StoreData) {
  localStorage.setItem(DATA_KEY, JSON.stringify(data))
}

/** Kept apart from the data so a backup export never includes the API key. */
export function loadSettings(): Settings {
  const raw = localStorage.getItem(SETTINGS_KEY)
  return raw ? (JSON.parse(raw) as Settings) : { groqKey: '' }
}

export function saveSettings(settings: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

/** The mic conversation, so it's still there after the app restarts. */
export function loadMic(): MicMessage[] {
  const raw = localStorage.getItem(MIC_KEY)
  return raw ? (JSON.parse(raw) as MicMessage[]) : []
}

export function saveMic(messages: MicMessage[]) {
  // Undo all is only offered right after filing, so older messages don't need what it restores.
  const none = () => ({ items: [], notes: [], lists: [], listItems: [] })
  const kept = messages
    .slice(-MIC_KEPT)
    .map((m): MicMessage => (m.role === 'ai' ? { ...m, restore: { added: none(), replaced: none() } } : m))
  localStorage.setItem(MIC_KEY, JSON.stringify(kept))
}

/** Asks the browser not to clear Notey's data when the phone runs low on space. */
export function requestPersistentStorage() {
  void navigator.storage?.persist()
}
