import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { displayName, NotFoundError } from '../api/pokeapi'
import { formatMultiplier, type PokeType } from '../logic/matchups'

export function TypeBadge({ type, multiplier }: { type: PokeType | string; multiplier?: number }) {
  return (
    <span className={`type-badge type-${type}`}>
      {type}
      {multiplier !== undefined && <span className="mult">{formatMultiplier(multiplier)}</span>}
    </span>
  )
}

export function TypeList({ types }: { types: readonly string[] }) {
  return <span className="type-list">{types.map((t) => <TypeBadge key={t} type={t} />)}</span>
}

export function Sprite({ src, name }: { src: string | null; name: string }) {
  return src
    ? <img className="sprite" src={src} alt={displayName(name)} width={72} height={72} loading="lazy" />
    : <span className="sprite sprite-missing" aria-hidden>?</span>
}

/** Text input with autocomplete suggestions loaded once from PokeAPI. */
export function NameSearch({ label, placeholder, button, loadNames, onSubmit, busy }: {
  label: string
  placeholder: string
  button: string
  loadNames: () => Promise<string[]>
  onSubmit: (name: string) => void
  busy?: boolean
}) {
  const listId = useId()
  const [value, setValue] = useState('')
  const [names, setNames] = useState<string[]>([])

  useEffect(() => {
    loadNames().then(setNames).catch(() => setNames([]))
  }, [loadNames])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (value.trim()) onSubmit(value)
  }

  return (
    <form className="search" onSubmit={submit}>
      <label className="visually-hidden" htmlFor={`${listId}-input`}>{label}</label>
      <input
        id={`${listId}-input`}
        list={listId}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
      />
      <datalist id={listId}>
        {names.map((n) => <option key={n} value={n} />)}
      </datalist>
      <button type="submit" disabled={busy || !value.trim()}>{busy ? 'Looking…' : button}</button>
    </form>
  )
}

export type Lookup<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'done'; data: T }

/** Runs an async lookup, ignoring stale responses, and turns failures into friendly messages. */
export function useLookup<T>(fetcher: (name: string) => Promise<T>, what: string) {
  const [state, setState] = useState<Lookup<T>>({ status: 'idle' })
  const latest = useRef(0)

  const run = useCallback(async (name: string): Promise<T | undefined> => {
    const id = ++latest.current
    setState({ status: 'loading' })
    try {
      const data = await fetcher(name)
      if (id === latest.current) setState({ status: 'done', data })
      return data
    } catch (err) {
      if (id !== latest.current) return undefined
      setState({
        status: 'error',
        message: err instanceof NotFoundError
          ? `Couldn't find a ${what} called “${name.trim()}”. Check the spelling and try again.`
          : `Couldn't reach PokéAPI. Check your connection and try again.`,
      })
      return undefined
    }
  }, [fetcher, what])

  return [state, run] as const
}

export function ErrorNote({ state }: { state: Lookup<unknown> }) {
  return state.status === 'error' ? <p className="error" role="alert">{state.message}</p> : null
}
