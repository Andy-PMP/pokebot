import { useEffect } from 'react'
import { displayName, FLAVORS, getBerry, getBerryNames, getFlavor, type Berry, type Flavor } from '../api/pokeapi'
import { ErrorNote, NameSearch, useLookup } from '../components/common'
import type { PocketsApi } from '../store/pockets'

const fetchFlavor = (name: string) => getFlavor(name as Flavor)

export function FlavorBars({ berry }: { berry: Berry }) {
  return (
    <dl className="flavor-bars">
      {FLAVORS.map((f) => (
        <div key={f} className={berry.flavors[f] ? '' : 'faded'}>
          <dt>{f}</dt>
          <dd>
            <span className={`bar flavor-${f}`} style={{ width: `${(berry.flavors[f] / 40) * 100}%` }} />
            <span className="num">{berry.flavors[f]}</span>
          </dd>
        </div>
      ))}
    </dl>
  )
}

export function Berries({ pockets, flavor, onFlavor }: {
  pockets: PocketsApi
  flavor: Flavor | null
  onFlavor: (f: Flavor | null) => void
}) {
  const [berry, lookupBerry] = useLookup(getBerry, 'berry')
  const [flavorInfo, lookupFlavor] = useLookup(fetchFlavor, 'flavor')
  const owned = new Set(pockets.berries.map((b) => b.name))

  useEffect(() => {
    if (flavor) lookupFlavor(flavor)
  }, [flavor, lookupFlavor])

  const addByName = async (name: string) => {
    const b = await getBerry(name).catch(() => undefined)
    if (b) pockets.addBerry(b)
  }

  return (
    <section>
      <p className="lede">Look up a berry, or pick a flavor to find the best berries for that contest.</p>

      <div className="card">
        <h3>Browse by flavor</h3>
        <div className="flavor-picker" role="group" aria-label="Flavor">
          {FLAVORS.map((f) => (
            <button
              key={f}
              className={`chip flavor-${f}${flavor === f ? ' active' : ''}`}
              aria-pressed={flavor === f}
              onClick={() => onFlavor(flavor === f ? null : f)}
            >
              {f}
            </button>
          ))}
        </div>
        <ErrorNote state={flavorInfo} />
        {flavor && flavorInfo.status === 'loading' && <p className="muted">Loading…</p>}
        {flavor && flavorInfo.status === 'done' && (
          <>
            <p>
              <strong>{displayName(flavor)}</strong> is best for <strong>{flavorInfo.data.contestType}</strong> contests.
            </p>
            <ul className="berry-list">
              {flavorInfo.data.berries.map((b) => (
                <li key={b.name} className={owned.has(b.name) ? 'owned' : ''}>
                  <span className="grow">{displayName(b.name)}</span>
                  <span className="potency">{b.potency}</span>
                  {owned.has(b.name)
                    ? <span className="tag">In pockets</span>
                    : <button className="ghost" onClick={() => addByName(b.name)}>+ Add</button>}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="card">
        <h3>Look up a berry</h3>
        <NameSearch
          label="Berry name"
          placeholder="e.g. oran"
          button="Look up"
          loadNames={getBerryNames}
          onSubmit={lookupBerry}
          busy={berry.status === 'loading'}
        />
        <ErrorNote state={berry} />
        {berry.status === 'done' && (
          <div className="berry-detail">
            <div className="row">
              <h2 className="grow">{displayName(berry.data.name)} Berry</h2>
              {owned.has(berry.data.name)
                ? <button className="ghost" onClick={() => pockets.removeBerry(berry.data.name)}>Remove from pockets</button>
                : <button onClick={() => pockets.addBerry(berry.data)}>Add to pockets</button>}
            </div>
            <p className="muted small">
              Firmness: {berry.data.firmness.replace('-', ' ')} · Natural Gift type: {berry.data.naturalGiftType}
            </p>
            <FlavorBars berry={berry.data} />
          </div>
        )}
      </div>
    </section>
  )
}
