import { describe, expect, it } from 'vitest'
import { defensiveProfile, effectiveness, rankTeam, rateMatchup, threatenedTypes } from './matchups'

describe('effectiveness', () => {
  it('handles single types', () => {
    expect(effectiveness('water', ['fire'])).toBe(2)
    expect(effectiveness('fire', ['water'])).toBe(0.5)
    expect(effectiveness('normal', ['fire'])).toBe(1)
  })

  it('handles immunities', () => {
    expect(effectiveness('ground', ['flying'])).toBe(0)
    expect(effectiveness('normal', ['ghost'])).toBe(0)
    expect(effectiveness('dragon', ['fairy'])).toBe(0)
  })

  it('multiplies across dual types', () => {
    // Gyarados: water/flying
    expect(effectiveness('electric', ['water', 'flying'])).toBe(4)
    expect(effectiveness('ground', ['water', 'flying'])).toBe(0)
    expect(effectiveness('rock', ['water', 'flying'])).toBe(2)
    expect(effectiveness('fire', ['water', 'flying'])).toBe(0.5)
    // Charizard: fire/flying
    expect(effectiveness('rock', ['fire', 'flying'])).toBe(4)
    expect(effectiveness('grass', ['fire', 'flying'])).toBe(0.25)
  })
})

describe('defensiveProfile', () => {
  it('lists every type, strongest first', () => {
    const profile = defensiveProfile(['water', 'flying'])
    expect(profile).toHaveLength(18)
    expect(profile[0]).toEqual({ type: 'electric', multiplier: 4 })
    expect(profile.at(-1)).toEqual({ type: 'ground', multiplier: 0 })
  })
})

describe('threatenedTypes', () => {
  it('collects types hit super-effectively by any STAB type', () => {
    expect(threatenedTypes(['water', 'flying']).sort()).toEqual(
      ['bug', 'fighting', 'fire', 'grass', 'ground', 'rock'].sort())
  })
})

describe('rateMatchup', () => {
  it('recommends Pikachu against Gyarados', () => {
    expect(rateMatchup('pikachu', ['electric'], ['water', 'flying'])).toMatchObject({ offense: 4, verdict: 'great' })
  })

  it('rates each verdict', () => {
    // Golem (rock/ground) vs Charizard (fire/flying): rock hits x4, Charizard's STAB only x½
    expect(rateMatchup('golem', ['rock', 'ground'], ['fire', 'flying']).verdict).toBe('great')
    // Lapras (water/ice) vs Venusaur (grass/poison): ice hits x2, but grass hits Lapras x2 too
    expect(rateMatchup('lapras', ['water', 'ice'], ['grass', 'poison']).verdict).toBe('risky')
    // Garchomp (dragon/ground) vs Salamence (dragon/flying): dragon hits x2 both ways
    expect(rateMatchup('garchomp', ['dragon', 'ground'], ['dragon', 'flying']).verdict).toBe('risky')
    // Gyarados vs an electric type: no advantage, takes x4
    expect(rateMatchup('gyarados', ['water', 'flying'], ['electric']).verdict).toBe('avoid')
    // Weavile (dark/ice) vs Lucario (fighting/steel): both STABs resisted, fighting hits x4
    expect(rateMatchup('weavile', ['dark', 'ice'], ['fighting', 'steel'])).toMatchObject({ danger: 4, verdict: 'avoid' })
    // Snorlax vs Gyarados: nothing special either way
    expect(rateMatchup('snorlax', ['normal'], ['water', 'flying']).verdict).toBe('neutral')
  })
})

describe('rankTeam', () => {
  it('sorts best picks first', () => {
    const ranked = rankTeam([
      { name: 'charizard', types: ['fire', 'flying'] },
      { name: 'snorlax', types: ['normal'] },
      { name: 'onix', types: ['rock', 'ground'] },
      { name: 'pikachu', types: ['electric'] },
    ], ['water', 'flying'])
    // Onix hits x2 with rock but takes x4 from water: risky, still above neutral
    expect(ranked.map((m) => [m.name, m.verdict])).toEqual([
      ['pikachu', 'great'], ['onix', 'risky'], ['snorlax', 'neutral'], ['charizard', 'avoid']])
  })
})
