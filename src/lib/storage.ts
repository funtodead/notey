import type { StoreData } from '../types/models'

const KEY = 'notey:data'

export function loadData(): StoreData | null {
  const raw = localStorage.getItem(KEY)
  return raw ? (JSON.parse(raw) as StoreData) : null
}

export function saveData(data: StoreData) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

/** Asks the browser not to clear Notey's data when the phone runs low on space. */
export function requestPersistentStorage() {
  void navigator.storage?.persist()
}
