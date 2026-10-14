// Type effectiveness chart (Gen 6+). Attacker -> defender -> multiplier.
// Pairs not listed are neutral (x1).

export const TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground',
  'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
] as const

export type PokeType = (typeof TYPES)[number]

const CHART: Record<PokeType, Partial<Record<PokeType, number>>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
}

export function isPokeType(t: string): t is PokeType {
  return (TYPES as readonly string[]).includes(t)
}

/** Damage multiplier of an attacking type against a (one or two type) defender. */
export function effectiveness(attack: PokeType, defenders: readonly PokeType[]): number {
  return defenders.reduce((mult, def) => mult * (CHART[attack][def] ?? 1), 1)
}

export interface TypeMultiplier {
  type: PokeType
  multiplier: number
}

/** Every attacking type's multiplier against the defender, strongest first. */
export function defensiveProfile(defenders: readonly PokeType[]): TypeMultiplier[] {
  return TYPES.map((type) => ({ type, multiplier: effectiveness(type, defenders) }))
    .sort((a, b) => b.multiplier - a.multiplier)
}

/** Defending types that take super-effective damage from any of the attacker's own (STAB) types. */
export function threatenedTypes(attackers: readonly PokeType[]): PokeType[] {
  return TYPES.filter((def) => attackers.some((atk) => effectiveness(atk, [def]) >= 2))
}

export type Verdict = 'great' | 'risky' | 'neutral' | 'avoid'

export interface MonMatchup {
  name: string
  /** Best multiplier this mon's own types deal to the opponent. */
  offense: number
  /** Worst multiplier the opponent's own types deal to this mon. */
  danger: number
  verdict: Verdict
}

/** Rates one of your Pokemon against an opponent, assuming both use same-type moves. */
export function rateMatchup(name: string, mine: readonly PokeType[], opponent: readonly PokeType[]): MonMatchup {
  const offense = Math.max(...mine.map((t) => effectiveness(t, opponent)))
  const danger = Math.max(...opponent.map((t) => effectiveness(t, mine)))
  let verdict: Verdict
  if (offense >= 2 && danger < 2) verdict = 'great'
  else if (offense >= 2) verdict = 'risky'
  else if (danger >= 2) verdict = 'avoid'
  else verdict = 'neutral'
  return { name, offense, danger, verdict }
}

const VERDICT_ORDER: Record<Verdict, number> = { great: 0, risky: 1, neutral: 2, avoid: 3 }

export function rankTeam(team: readonly { name: string; types: readonly PokeType[] }[], opponent: readonly PokeType[]): MonMatchup[] {
  return team
    .map((m) => rateMatchup(m.name, m.types, opponent))
    .sort((a, b) =>
      VERDICT_ORDER[a.verdict] - VERDICT_ORDER[b.verdict] || b.offense - a.offense || a.danger - b.danger)
}

export function formatMultiplier(m: number): string {
  if (m === 0) return '×0'
  if (m === 0.25) return '×¼'
  if (m === 0.5) return '×½'
  return `×${m}`
}
