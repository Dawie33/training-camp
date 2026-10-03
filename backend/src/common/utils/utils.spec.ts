import { slugify } from './utils'

describe('slugify', () => {
  it.each([
    ['Squat', 'squat'],
    ['Développé couché', 'developpe-couche'],
    ['Soulevé de terre', 'souleve-de-terre'],
    ['Élévations latérales', 'elevations-laterales'],
    ['  Air   Squat  ', 'air-squat'],
    ['Toes-to-Bar', 'toes-to-bar'],
  ])('« %s » → « %s »', (input, expected) => {
    expect(slugify(input)).toBe(expected)
  })

  it('ignore le contenu entre parenthèses', () => {
    expect(slugify('Fente bulgare (haltères)')).toBe('fente-bulgare')
  })
})
