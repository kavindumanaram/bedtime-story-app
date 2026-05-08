export interface CharacterIdentity {
  name: string
  visualDescription: string
  artStyle?: string
  anchorImageUrl?: string
}

type CharacterInput = {
  name: string
  gender?: string
  age?: string
  species?: string
  skinColor?: string
  hairColor?: string
  hairStyle?: string
  clothing?: string
  accessories?: string | null
}

/** Builds a dense identity string from character data for use in scene prompts. */
export function buildCharacterIdentityText(characters: CharacterInput[]): string {
  if (characters.length === 0) return ''
  return characters
    .map((c) => {
      const label =
        c.gender || c.age
          ? `${c.name} (${[c.age, c.gender].filter(Boolean).join(' ')})`
          : c.name
      const parts: string[] = [label]
      if (c.species) parts.push(c.species)
      if (c.skinColor) parts.push(`${c.skinColor} skin`)
      const hair = [c.hairStyle, c.hairColor].filter(Boolean).join(' ')
      if (hair) parts.push(`${hair} hair`)
      if (c.clothing) parts.push(c.clothing)
      if (c.accessories) parts.push(c.accessories)
      return parts.filter(Boolean).join(', ')
    })
    .join('. ')
}
