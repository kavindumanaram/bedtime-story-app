import type { StoryCharacter } from './openaiService.js'

export const LOCKED_ART_STYLE =
  "Pixar-style cinematic children's illustration, warm volumetric lighting, " +
  "storybook composition, highly detailed, consistent character design, " +
  "cinematic framing, medium shot, eye-level camera, no text, safe for children"

/**
 * Builds a scene image prompt from structured inputs.
 * The Action/Background/Composition suffix ensures each scene looks distinct
 * while the character lock keeps visual identity consistent across pages.
 */
export function buildScenePrompt(
  characterProfile: StoryCharacter[],
  nodeText: string,
  environmentStyle: string,
  choiceMade?: string,
): string {
  const charLock = characterProfile.length > 0
    ? characterProfile.map((c) => {
        let desc = `${c.name}: ${c.visualDescription}`
        if (c.clothing) desc += `, ${c.clothing}`
        return desc
      }).join('. ') + '.'
    : ''

  const action = nodeText.split(/[.!?]/)[0].trim().slice(0, 200)
  const choiceSuffix = choiceMade ? ` Choice reflected: ${choiceMade.slice(0, 100)}.` : ''

  return (
    `${charLock} Environment: ${environmentStyle}. ` +
    `Scene: ${action}.${choiceSuffix} ` +
    `Action: ${action}, Background: ${environmentStyle}, Composition: cinematic medium shot eye-level. ` +
    `${LOCKED_ART_STYLE}.`
  )
}
