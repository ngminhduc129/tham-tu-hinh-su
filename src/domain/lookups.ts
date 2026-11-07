import type {
  AgeRule,
  AnswerField,
  CaseFile,
  Charge,
  ChargeElement,
  Circumstance,
  Conclusion,
  EvidenceLimitation,
  EvidenceRecord,
  Explanation,
  Fact,
  Hypothesis,
  Issue,
  LawBundle,
  LawProvision,
  ProceduralDefect,
  ProofRow,
} from './types'

export interface Lookups {
  evidence: Map<string, EvidenceRecord>
  facts: Map<string, Fact>
  defects: Map<string, ProceduralDefect>
  limitations: Map<string, EvidenceLimitation>
  hypotheses: Map<string, Hypothesis>
  proofRows: Map<string, ProofRow>
  elements: Map<string, ChargeElement>
  charges: Map<string, Charge>
  circumstances: Map<string, Circumstance>
  conclusions: Map<string, Conclusion>
  fields: Map<string, AnswerField>
  explanations: Map<string, Explanation>
  issues: Map<string, Issue>
  bundles: Map<string, LawBundle>
  provisions: Map<string, LawProvision>
  ageRules: Map<string, AgeRule>
  characters: Map<string, string>
}

export function buildLookups(caseFile: CaseFile): Lookups {
  const byId = <T extends { id: string }>(items: T[]): Map<string, T> =>
    new Map(items.map((item) => [item.id, item]))

  const provisions = new Map<string, LawProvision>()
  for (const bundle of caseFile.law_bundles) {
    for (const provision of bundle.provisions) {
      provisions.set(provision.id, provision)
    }
  }

  return {
    evidence: byId(caseFile.evidence),
    facts: byId(caseFile.facts),
    defects: byId(caseFile.procedural_defects),
    limitations: byId(caseFile.evidence_limitations),
    hypotheses: byId(caseFile.hypotheses),
    proofRows: byId(caseFile.proof_matrix),
    elements: byId(caseFile.charge_elements),
    charges: byId(caseFile.candidate_charges),
    circumstances: byId(caseFile.circumstances),
    conclusions: byId(caseFile.conclusions),
    fields: byId(caseFile.answer_fields),
    explanations: byId(caseFile.explanations),
    issues: byId(caseFile.issues ?? []),
    bundles: byId(caseFile.law_bundles),
    provisions,
    ageRules: byId(caseFile.age_rules),
    characters: new Map(caseFile.characters.map((item) => [item.id, item.display_name])),
  }
}

export function evidenceTitle(lookups: Lookups, id: string): string {
  return lookups.evidence.get(id)?.title ?? id
}

export function elementLabel(lookups: Lookups, id: string): string {
  return lookups.elements.get(id)?.label ?? id
}

export function chargeLabel(lookups: Lookups, id: string): string {
  return lookups.charges.get(id)?.display_label ?? id
}

export function conclusionLabel(lookups: Lookups, id: string): string {
  return lookups.conclusions.get(id)?.label ?? id
}

export function provisionCitation(lookups: Lookups, id: string): string {
  return lookups.provisions.get(id)?.citation ?? id
}

export function optionLabel(field: AnswerField | undefined, value: string): string {
  return field?.options.find((option) => option.id === value)?.label ?? value
}

export function answerLabel(
  lookups: Lookups,
  fieldId: string,
  values: string[],
): string {
  const field = lookups.fields.get(fieldId)
  if (values.length === 0) return 'Chưa trả lời'
  const labels = values.map((value) => {
    if (fieldId === 'hypothesis_support' || fieldId === 'hypothesis_challenge') {
      return evidenceTitle(lookups, value)
    }
    if (fieldId === 'selected_charge') return chargeLabel(lookups, value)
    if (fieldId === 'conclusion') return conclusionLabel(lookups, value)
    if (fieldId === 'legal_basis') return provisionCitation(lookups, value)
    return optionLabel(field, value)
  })
  return labels.join('; ')
}
