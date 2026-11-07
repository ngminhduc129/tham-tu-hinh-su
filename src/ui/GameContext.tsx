import { createContext, useContext, type Dispatch } from 'react'
import type { CaseFile, GameSession } from '../domain/types'
import type { Lookups } from '../domain/lookups'
import type { GameAction } from '../state/reducer'

export interface StorageIssue {
  reason: string
  raw: string
  backupKey: string | null
}

export interface GameContextValue {
  caseFile: CaseFile
  lookups: Lookups
  session: GameSession
  dispatch: Dispatch<GameAction>
  navigate: (path: string) => void
  readOnly: boolean
  appVersion: string
  storageIssue: StorageIssue | null
  dismissStorageIssue: () => void
  restartCase: () => void
}

export const GameContext = createContext<GameContextValue | null>(null)

export function useGame(): GameContextValue {
  const value = useContext(GameContext)
  if (!value) {
    throw new Error('useGame phải nằm trong GameContext.Provider.')
  }
  return value
}
