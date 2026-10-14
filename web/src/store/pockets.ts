import { useCallback, useEffect, useState } from 'react'
import type { Berry, Pokemon } from '../api/pokeapi'

const STORAGE_KEY = 'pokebot:pockets'

export interface Pockets {
  mons: Pokemon[]
  berries: Berry[]
}

const EMPTY: Pockets = { mons: [], berries: [] }

function isPockets(value: unknown): value is Pockets {
  const v = value as Pockets
  return !!v && Array.isArray(v.mons) && Array.isArray(v.berries)
}

function load(): Pockets {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    return isPockets(parsed) ? parsed : EMPTY
  } catch {
    return EMPTY
  }
}

/** The user's saved Pokemon and berries, persisted in this browser. */
export function usePockets() {
  const [pockets, setPockets] = useState<Pockets>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pockets))
    } catch {
      // Private mode or storage blocked: lists still work for this session.
    }
  }, [pockets])

  const addMon = useCallback((mon: Pokemon) => setPockets((p) =>
    p.mons.some((m) => m.name === mon.name) ? p : { ...p, mons: [...p.mons, mon] }), [])
  const removeMon = useCallback((name: string) => setPockets((p) =>
    ({ ...p, mons: p.mons.filter((m) => m.name !== name) })), [])
  const addBerry = useCallback((berry: Berry) => setPockets((p) =>
    p.berries.some((b) => b.name === berry.name) ? p : { ...p, berries: [...p.berries, berry] }), [])
  const removeBerry = useCallback((name: string) => setPockets((p) =>
    ({ ...p, berries: p.berries.filter((b) => b.name !== name) })), [])

  const exportJson = useCallback(() => JSON.stringify(pockets, null, 2), [pockets])
  const importJson = useCallback((text: string) => {
    const parsed = JSON.parse(text)
    if (!isPockets(parsed)) throw new Error('That file is not a Pokebot backup.')
    setPockets(parsed)
  }, [])

  return { ...pockets, addMon, removeMon, addBerry, removeBerry, exportJson, importJson }
}

export type PocketsApi = ReturnType<typeof usePockets>
