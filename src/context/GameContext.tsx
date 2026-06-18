'use client'

import { createContext, useContext, useReducer } from 'react'
import { gameReducer } from '@/lib/reducer'
import type { GameEvent, GameMeta, GameState } from '@/lib/types'

type SyncStatus = 'synced' | 'syncing' | 'error'

type ClientAction =
  | { type: 'ADD_EVENT'; event: GameEvent }
  | { type: 'UNDO' }
  | { type: 'SET_SELECTED'; playerId: string | null }
  | { type: 'SET_SYNC'; status: SyncStatus }

interface ClientState {
  meta: GameMeta
  events: GameEvent[]
  derived: GameState
  selectedPlayerId: string | null
  syncStatus: SyncStatus
}

interface GameContextValue extends ClientState {
  dispatch: (action: ClientAction) => void
}

function clientReducer(state: ClientState, action: ClientAction): ClientState {
  switch (action.type) {
    case 'ADD_EVENT': {
      const events = [...state.events, action.event]
      return { ...state, events, derived: gameReducer(events), selectedPlayerId: null, syncStatus: 'syncing' }
    }
    case 'UNDO': {
      const events = state.events.slice(0, -1)
      return { ...state, events, derived: gameReducer(events), syncStatus: 'syncing' }
    }
    case 'SET_SELECTED':
      return { ...state, selectedPlayerId: action.playerId }
    case 'SET_SYNC':
      return { ...state, syncStatus: action.status }
  }
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({
  meta,
  initialEvents,
  children,
}: {
  meta: GameMeta
  initialEvents: GameEvent[]
  children: React.ReactNode
}) {
  const [state, dispatch] = useReducer(clientReducer, {
    meta,
    events: initialEvents,
    derived: gameReducer(initialEvents),
    selectedPlayerId: null,
    syncStatus: 'synced',
  })

  return (
    <GameContext.Provider value={{ ...state, dispatch }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
