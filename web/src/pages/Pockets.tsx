import { useRef, useState } from 'react'
import { displayName, getBerry, getBerryNames, getPokemon, getPokemonNames } from '../api/pokeapi'
import { ErrorNote, NameSearch, Sprite, TypeList, useLookup } from '../components/common'
import type { PocketsApi } from '../store/pockets'
import { FlavorBars } from './Berries'

export function Pockets({ pockets }: { pockets: PocketsApi }) {
  const [monLookup, lookupMon] = useLookup(getPokemon, 'Pokémon')
  const [berryLookup, lookupBerry] = useLookup(getBerry, 'berry')
  const [backupMsg, setBackupMsg] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const addMon = async (name: string) => {
    const mon = await lookupMon(name)
    if (mon) pockets.addMon(mon)
  }
  const addBerry = async (name: string) => {
    const berry = await lookupBerry(name)
    if (berry) pockets.addBerry(berry)
  }

  const download = () => {
    const url = URL.createObjectURL(new Blob([pockets.exportJson()], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'pokebot-pockets.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const upload = async (file: File | undefined) => {
    if (!file) return
    try {
      pockets.importJson(await file.text())
      setBackupMsg('Backup restored.')
    } catch (err) {
      setBackupMsg(err instanceof Error ? err.message : 'Could not read that file.')
    }
    if (fileInput.current) fileInput.current.value = ''
  }

  return (
    <section>
      <p className="lede">Your saved Pokémon and berries. They're stored in this browser only.</p>

      <div className="card">
        <h3>My team <span className="count">{pockets.mons.length}</span></h3>
        <NameSearch label="Add a Pokémon" placeholder="Add a Pokémon…" button="Add"
          loadNames={getPokemonNames} onSubmit={addMon} busy={monLookup.status === 'loading'} />
        <ErrorNote state={monLookup} />
        {pockets.mons.length === 0
          ? <p className="muted">No Pokémon saved yet.</p>
          : (
            <ul className="mon-grid">
              {pockets.mons.map((m) => (
                <li key={m.name}>
                  <Sprite src={m.sprite} name={m.name} />
                  <strong>{displayName(m.name)}</strong>
                  <TypeList types={m.types} />
                  <button className="ghost small" onClick={() => pockets.removeMon(m.name)}
                    aria-label={`Remove ${displayName(m.name)}`}>Remove</button>
                </li>
              ))}
            </ul>
          )}
      </div>

      <div className="card">
        <h3>My berries <span className="count">{pockets.berries.length}</span></h3>
        <NameSearch label="Add a berry" placeholder="Add a berry…" button="Add"
          loadNames={getBerryNames} onSubmit={addBerry} busy={berryLookup.status === 'loading'} />
        <ErrorNote state={berryLookup} />
        {pockets.berries.length === 0
          ? <p className="muted">No berries saved yet.</p>
          : (
            <ul className="berry-cards">
              {pockets.berries.map((b) => (
                <li key={b.name}>
                  <div className="row">
                    <strong className="grow">{displayName(b.name)}</strong>
                    <button className="ghost small" onClick={() => pockets.removeBerry(b.name)}
                      aria-label={`Remove ${displayName(b.name)}`}>Remove</button>
                  </div>
                  <FlavorBars berry={b} />
                </li>
              ))}
            </ul>
          )}
      </div>

      <div className="card">
        <h3>Backup</h3>
        <p className="muted small">Your lists live in this browser. Download a backup to move them to another device.</p>
        <div className="row">
          <button onClick={download}>Download backup</button>
          <button className="ghost" onClick={() => fileInput.current?.click()}>Restore from file</button>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden
            onChange={(e) => upload(e.target.files?.[0])} />
        </div>
        {backupMsg && <p className="small">{backupMsg}</p>}
      </div>
    </section>
  )
}
