import type { Settings, StoreData } from '../types/models'

const DATA_KEY = 'notey:data'
const SETTINGS_KEY = 'notey:settings'

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

/** Asks the browser not to clear Notey's data when the phone runs low on space. */
export function requestPersistentStorage() {
  void navigator.storage?.persist()
}
