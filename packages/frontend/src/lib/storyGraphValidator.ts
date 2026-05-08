import type { BranchingStoryGraph } from "@bedtime/shared"

export type ValidationResult = { valid: true } | { valid: false; errors: string[] }

const ALLOWED_TRAITS = ["brave", "kind", "curious", "creative", "helpful"] as const

export function validateStoryGraph(graph: BranchingStoryGraph): ValidationResult {
  const errors: string[] = []

  if (graph.rootNode.type !== "root") errors.push("rootNode.type must be 'root'")
  if (graph.choices.length !== 2) errors.push("choices must have exactly 2 entries")
  if (graph.leafNodes.length !== 2) errors.push("leafNodes must have exactly 2 entries")

  graph.leafNodes.forEach((n, i) => {
    if (n.type !== "leaf") errors.push(`leafNode[${i}].type must be 'leaf'`)
  })

  const leafIds = new Set(graph.leafNodes.map(n => n.id))
  graph.choices.forEach((c, i) => {
    if (!leafIds.has(c.targetNodeId))
      errors.push(`choice[${i}].targetNodeId '${c.targetNodeId}' not found in leafNodes`)
    if (!ALLOWED_TRAITS.includes(c.trait as (typeof ALLOWED_TRAITS)[number]))
      errors.push(`choice[${i}].trait '${c.trait}' is not a valid trait`)
  })

  const allNodes = [graph.rootNode, ...graph.leafNodes]
  allNodes.forEach(node => {
    node.paragraphs.forEach((p, i) => {
      if (p.trim().length === 0) errors.push(`${node.id} paragraphs[${i}] is empty`)
    })
  })

  return errors.length === 0 ? { valid: true } : { valid: false, errors }
}
