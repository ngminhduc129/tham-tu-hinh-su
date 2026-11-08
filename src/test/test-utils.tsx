import type { ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { vi } from 'vitest'
import { buildLookups } from '../domain/lookups'
import { createSession } from '../state/reducer'
import { fixtureCase } from '../domain/test-helpers'
import { GameContext, type GameContextValue } from '../ui/GameContext'
import type { CaseFile, GameSession } from '../domain/types'
import type { GameAction } from '../state/reducer'

export interface RenderContextOptions extends Omit<RenderOptions, 'wrapper'> {
  caseFile?: CaseFile
  session?: GameSession
  dispatch?: (action: GameAction) => void
  navigate?: (path: string) => void
  readOnly?: boolean
  storageIssue?: GameContextValue['storageIssue']
}

export function renderWithGameContext(
  ui: ReactElement,
  options: RenderContextOptions = {},
) {
  const caseFile = options.caseFile ?? fixtureCase()
  const lookups = buildLookups(caseFile)
  const session = options.session ?? createSession(caseFile)
  const dispatch = options.dispatch ?? vi.fn()
  const navigate = options.navigate ?? vi.fn()
  const readOnly = options.readOnly ?? session.status === 'submitted'
  const storageIssue = options.storageIssue ?? null
  const dismissStorageIssue = vi.fn()
  const restartCase = vi.fn()
  const toggleTheme = vi.fn()

  const contextValue: GameContextValue = {
    caseFile,
    lookups,
    session,
    dispatch,
    navigate,
    readOnly,
    appVersion: '0.1.0',
    storageIssue,
    dismissStorageIssue,
    restartCase,
    theme: 'light',
    toggleTheme,
  }

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>
  )

  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    contextValue,
    dispatch,
    navigate,
    restartCase,
  }
}

