import { useState } from 'react'
import type { Flavor } from './api/pokeapi'
import { Berries } from './pages/Berries'
import { Pockets } from './pages/Pockets'
import { Versus } from './pages/Versus'
import { usePockets } from './store/pockets'

const TABS = [
  { id: 'versus', label: 'Versus' },
  { id: 'berries', label: 'Berries' },
  { id: 'pockets', label: 'My pockets' },
] as const

type TabId = (typeof TABS)[number]['id']

function initialTab(): TabId {
  const hash = window.location.hash.slice(1)
  return TABS.some((t) => t.id === hash) ? (hash as TabId) : 'versus'
}

export default function App() {
  const pockets = usePockets()
  const [tab, setTab] = useState<TabId>(initialTab)
  const [flavor, setFlavor] = useState<Flavor | null>(null)

  const select = (id: TabId) => {
    setTab(id)
    history.replaceState(null, '', `#${id}`)
  }

  return (
    <div className="app">
      <header>
        <h1><img src="/favicon.svg" alt="" width={28} height={28} /> Pokebot</h1>
        <nav role="tablist" aria-label="Sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={tab === t.id ? 'active' : ''}
              onClick={() => select(t.id)}
            >
              {t.label}
              {t.id === 'pockets' && pockets.mons.length + pockets.berries.length > 0 && (
                <span className="count">{pockets.mons.length + pockets.berries.length}</span>
              )}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {tab === 'versus' && <Versus pockets={pockets} />}
        {tab === 'berries' && <Berries pockets={pockets} flavor={flavor} onFlavor={setFlavor} />}
        {tab === 'pockets' && <Pockets pockets={pockets} />}
      </main>

      <footer>
        Data from <a href="https://pokeapi.co" target="_blank" rel="noreferrer">PokéAPI</a>.
        Pokémon is © Nintendo / Game Freak; this is an unofficial fan tool.
      </footer>
    </div>
  )
}
