import { createContext, useEffect, useReducer, type Dispatch, type ReactNode } from 'react'

import { loadData, saveData } from '../lib/storage'
import type { StoreData } from '../types/models'
import { initialData, storeReducer, type StoreAction } from './storeReducer'

export const StoreContext = createContext<{ state: StoreData; dispatch: Dispatch<StoreAction> } | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(storeReducer, null, () => loadData() ?? initialData)

  useEffect(() => saveData(state), [state])

  return <StoreContext value={{ state, dispatch }}>{children}</StoreContext>
}
