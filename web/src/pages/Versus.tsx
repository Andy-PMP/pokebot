import { displayName, getPokemon, getPokemonNames } from '../api/pokeapi'
import { ErrorNote, NameSearch, Sprite, TypeBadge, TypeList, useLookup } from '../components/common'
import { defensiveProfile, formatMultiplier, rankTeam, threatenedTypes, type Verdict } from '../logic/matchups'
import type { PocketsApi } from '../store/pockets'

const VERDICT_LABEL: Record<Verdict, string> = {
  great: 'Send it out',
  risky: 'Hits hard, but weak to it',
  neutral: 'Even match',
  avoid: 'Keep it benched',
}

export function Versus({ pockets }: { pockets: PocketsApi }) {
  const [opponent, lookup] = useLookup(getPokemon, 'Pokémon')

  return (
    <section>
      <p className="lede">Who are you up against? Get the types that beat it and which of your Pokémon to send out.</p>
      <NameSearch
        label="Opponent Pokémon"
        placeholder="e.g. gyarados"
        button="Versus"
        loadNames={getPokemonNames}
        onSubmit={lookup}
        busy={opponent.status === 'loading'}
      />
      <ErrorNote state={opponent} />

      {opponent.status === 'done' && (() => {
        const opp = opponent.data
        const profile = defensiveProfile(opp.types)
        const strong = profile.filter((p) => p.multiplier > 1)
        const weak = profile.filter((p) => p.multiplier < 1)
        const threatened = threatenedTypes(opp.types)
        const team = rankTeam(pockets.mons, opp.types)

        return (
          <div className="results">
            <div className="card opponent">
              <Sprite src={opp.sprite} name={opp.name} />
              <div>
                <h2>{displayName(opp.name)}</h2>
                <TypeList types={opp.types} />
              </div>
            </div>

            <div className="grid-2">
              <div className="card">
                <h3>Hit it with</h3>
                <div className="badges">
                  {strong.length
                    ? strong.map((p) => <TypeBadge key={p.type} type={p.type} multiplier={p.multiplier} />)
                    : <span className="muted">No type is super effective.</span>}
                </div>
                <h3>Don't bother with</h3>
                <div className="badges">
                  {weak.length
                    ? weak.map((p) => <TypeBadge key={p.type} type={p.type} multiplier={p.multiplier} />)
                    : <span className="muted">Nothing resists it.</span>}
                </div>
              </div>

              <div className="card">
                <h3>Its attacks are strong against</h3>
                <div className="badges">
                  {threatened.map((t) => <TypeBadge key={t} type={t} />)}
                </div>
                <p className="muted small">Based on its own types (same-type attacks).</p>
              </div>
            </div>

            <div className="card">
              <h3>From your team</h3>
              {team.length === 0
                ? <p className="muted">Add Pokémon on the <strong>My pockets</strong> tab to get picks from your own team.</p>
                : (
                  <ul className="team-ranking">
                    {team.map((m) => {
                      const mon = pockets.mons.find((p) => p.name === m.name)!
                      return (
                        <li key={m.name} className={`verdict-${m.verdict}`}>
                          <Sprite src={mon.sprite} name={mon.name} />
                          <div className="grow">
                            <strong>{displayName(mon.name)}</strong> <TypeList types={mon.types} />
                            <div className="small muted">
                              Deals {formatMultiplier(m.offense)} · takes up to {formatMultiplier(m.danger)}
                            </div>
                          </div>
                          <span className="verdict">{VERDICT_LABEL[m.verdict]}</span>
                        </li>
                      )
                    })}
                  </ul>
                )}
            </div>
          </div>
        )
      })()}
    </section>
  )
}
