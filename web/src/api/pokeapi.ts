import { isPokeType, type PokeType } from '../logic/matchups'

const BASE = 'https://pokeapi.co/api/v2'
const CACHE_PREFIX = 'pokeapi:v1:'

export const FLAVORS = ['spicy', 'dry', 'sweet', 'bitter', 'sour'] as const
export type Flavor = (typeof FLAVORS)[number]

export class NotFoundError extends Error {}

export interface Pokemon {
  name: string
  types: PokeType[]
  sprite: string | null
}

export interface Berry {
  name: string
  flavors: Record<Flavor, number>
  firmness: string
  naturalGiftType: string
}

export interface FlavorInfo {
  name: Flavor
  contestType: string
  berries: { name: string; potency: number }[]
}

/** Lowercases and hyphenates user input to match PokeAPI names ("Mr Mime" -> "mr-mime"). */
export function normalizeName(input: string): string {
  return input.trim().toLowerCase().replace(/\s+berry$/, '').replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export function displayName(name: string): string {
  return name.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

// PokeAPI asks clients to cache responses. Results are trimmed to what the app uses,
// kept in memory, and persisted to localStorage so repeat lookups never hit the network.
const memory = new Map<string, Promise<unknown>>()

function readStored<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : undefined
  } catch {
    return undefined
  }
}

function writeStored(key: string, value: unknown) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value))
  } catch {
    // Storage full or unavailable; the in-memory cache still works.
  }
}

function cached<T>(path: string, parse: (json: any) => T): Promise<T> {
  const hit = memory.get(path)
  if (hit) return hit as Promise<T>

  const stored = readStored<T>(path)
  const request = stored !== undefined
    ? Promise.resolve(stored)
    : fetch(`${BASE}/${path}`).then(async (res) => {
      if (res.status === 404) throw new NotFoundError(path)
      if (!res.ok) throw new Error(`PokeAPI error ${res.status}`)
      const value = parse(await res.json())
      writeStored(path, value)
      return value
    })

  memory.set(path, request)
  request.catch(() => memory.delete(path))
  return request
}

export function getPokemon(name: string): Promise<Pokemon> {
  return cached(`pokemon/${normalizeName(name)}`, (json) => ({
    name: json.name,
    types: json.types.map((t: any) => t.type.name).filter(isPokeType),
    sprite: json.sprites?.front_default ?? null,
  }))
}

export function getBerry(name: string): Promise<Berry> {
  return cached(`berry/${normalizeName(name)}`, (json) => {
    const flavors = Object.fromEntries(FLAVORS.map((f) => [f, 0])) as Record<Flavor, number>
    for (const f of json.flavors) flavors[f.flavor.name as Flavor] = f.potency
    return {
      name: json.name,
      flavors,
      firmness: json.firmness.name,
      naturalGiftType: json.natural_gift_type.name,
    }
  })
}

export function getFlavor(flavor: Flavor): Promise<FlavorInfo> {
  return cached(`berry-flavor/${flavor}`, (json) => ({
    name: flavor,
    contestType: json.contest_type.name,
    berries: json.berries
      .map((b: any) => ({ name: b.berry.name, potency: b.potency }))
      .sort((a: { potency: number }, b: { potency: number }) => b.potency - a.potency),
  }))
}

export function getPokemonNames(): Promise<string[]> {
  return cached('pokemon?limit=2000', (json) => json.results.map((r: any) => r.name))
}

export function getBerryNames(): Promise<string[]> {
  return cached('berry?limit=100', (json) => json.results.map((r: any) => r.name))
}
