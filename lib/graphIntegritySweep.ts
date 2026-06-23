/**
 * Graph Integrity Sweep Service
 * Validates and reconciles the entire relational graph:
 * - Figures, parts, relationships
 * - Compatibility graph
 * - Kitbashes, aliases
 */

import { supabase } from './supabaseClient';

export interface GraphSweepReport {
  timestamp: string;
  totalIssuesFound: number;
  totalFixesApplied: number;
  pipeline: {
    figureReconciliation: ReconciliationResult;
    partReconciliation: ReconciliationResult;
    figurePartValidation: ValidationResult;
    compatibilityValidation: ValidationResult;
    kitbashValidation: ValidationResult;
    aliasEnrichment: AliasEnrichmentResult;
  };
  orphanParts: Array<{ id: string; name: string; slug: string; reason: string }>;
  conflicts: string[];
  suggestedConfidenceUpdates: Array<{
    entityType: string;
    entityId: string;
    entityName: string;
    currentConfidence: number;
    suggestedConfidence: number;
    reason: string;
  }>;
}

interface ReconciliationResult {
  checked: number;
  issuesFound: number;
  fixesApplied: number;
  details: string[];
}

interface ValidationResult {
  checked: number;
  issuesFound: number;
  fixesApplied: number;
  conflicts: string[];
}

interface AliasEnrichmentResult {
  checked: number;
  suggestionsGenerated: number;
  aliasesAdded: number;
  details: string[];
}

/**
 * Step 1: Figure Reconciliation
 */
async function figureReconciliation(): Promise<ReconciliationResult> {
  const result: ReconciliationResult = {
    checked: 0,
    issuesFound: 0,
    fixesApplied: 0,
    details: [],
  };

  const { data: figures, error } = await supabase
    .from('figures')
    .select('id, name, line_id, lines(id, name)');

  if (error) throw new Error(`Failed to fetch figures: ${error.message}`);
  result.checked = (figures || []).length;

  // Check for duplicates
  const seen = new Map<string, any>();
  for (const fig of figures || []) {
    const key = `${fig.name}|${fig.line_id}`;
    if (seen.has(key)) {
      result.issuesFound++;
      result.details.push(
        `Duplicate figure: "${fig.name}" in line "${(fig as any).lines?.name}" (IDs: ${seen.get(key).id}, ${fig.id})`
      );
    } else {
      seen.set(key, fig);
    }
  }

  // Check for orphan figures
  for (const fig of figures || []) {
    if (!fig.line_id) {
      result.issuesFound++;
      result.details.push(`Orphan figure: "${fig.name}" has no line assignment`);
    }
  }

  return result;
}

/**
 * Step 2: Part Reconciliation
 */
async function partReconciliation(): Promise<ReconciliationResult> {
  const result: ReconciliationResult = {
    checked: 0,
    issuesFound: 0,
    fixesApplied: 0,
    details: [],
  };

  const { data: parts, error } = await supabase
    .from('part_definitions')
    .select(`
      id,
      slug,
      name,
      part_type,
      mold_family_id,
      mold_families(id, name),
      figure_parts(id),
      kitbash_parts(id)
    `);

  if (error) throw new Error(`Failed to fetch parts: ${error.message}`);
  result.checked = (parts || []).length;

  // Check for orphan parts
  for (const part of parts || []) {
    const figureCount = ((part as any).figure_parts || []).length;
    const kitbashCount = ((part as any).kitbash_parts || []).length;

    if (figureCount === 0 && kitbashCount === 0) {
      result.issuesFound++;
      result.details.push(
        `Orphan part: "${part.name}" (${part.slug}) is not used by any figure or kitbash`
      );
    }
  }

  return result;
}

/**
 * Step 3: Figure-Part Validation
 */
async function figurePartValidation(): Promise<ValidationResult> {
  const result: ValidationResult = {
    checked: 0,
    issuesFound: 0,
    fixesApplied: 0,
    conflicts: [],
  };

  const REQUIRED_SLOTS = ['head', 'torso', 'arms', 'legs'];

  const { data: figures, error } = await supabase
    .from('figures')
    .select(`
      id,
      name,
      figure_parts (
        id,
        part_definition_id,
        slot_label,
        part_definitions (id, part_type)
      )
    `);

  if (error) throw new Error(`Failed to fetch figure parts: ${error.message}`);
  result.checked = (figures || []).length;

  for (const fig of figures || []) {
    const parts = (fig as any).figure_parts || [];
    const bodyPartTypes = new Set<string>();

    for (const fp of parts) {
      const partType = (fp as any).part_definitions?.part_type;
      if (partType) bodyPartTypes.add(partType);
    }

    for (const slot of REQUIRED_SLOTS) {
      if (!bodyPartTypes.has(slot)) {
        result.issuesFound++;
        result.conflicts.push(
          `Missing required body part: figure "${fig.name}" has no ${slot}`
        );
      }
    }
  }

  return result;
}

/**
 * Step 4: Compatibility Graph Validation
 */
async function compatibilityValidation(): Promise<ValidationResult> {
  const result: ValidationResult = {
    checked: 0,
    issuesFound: 0,
    fixesApplied: 0,
    conflicts: [],
  };

  const { data: edges, error } = await supabase
    .from('part_compatibility')
    .select(`
      id,
      source_part_definition_id,
      target_part_definition_id,
      compatibility_level,
      confidence,
      part_definitions_source: source_part_definition_id (id, name),
      part_definitions_target: target_part_definition_id (id, name)
    `);

  if (error) throw new Error(`Failed to fetch compatibility edges: ${error.message}`);
  result.checked = (edges || []).length;

  const edgeMap = new Map<string, any>();

  for (const edge of edges || []) {
    const key = `${edge.source_part_definition_id}|${edge.target_part_definition_id}`;
    edgeMap.set(key, edge);
  }

  // Check for symmetry violations
  for (const edge of edges || []) {
    const reverseKey = `${edge.target_part_definition_id}|${edge.source_part_definition_id}`;
    const reverseEdge = edgeMap.get(reverseKey);

    if (!reverseEdge) {
      result.issuesFound++;
      result.conflicts.push(
        `Asymmetric compatibility: ${(edge as any).part_definitions_source?.name} → ${(edge as any).part_definitions_target?.name} has no reverse edge`
      );
    } else if (reverseEdge.compatibility_level !== edge.compatibility_level) {
      result.issuesFound++;
      result.conflicts.push(
        `Conflicting compatibility levels: ${(edge as any).part_definitions_source?.name} ↔ ${(edge as any).part_definitions_target?.name}`
      );
    }
  }

  return result;
}

/**
 * Step 5: Kitbash Validation
 */
async function kitbashValidation(): Promise<ValidationResult> {
  const result: ValidationResult = {
    checked: 0,
    issuesFound: 0,
    fixesApplied: 0,
    conflicts: [],
  };

  const { data: kitbashes, error } = await supabase
    .from('kitbashes')
    .select(`
      id,
      name,
      kitbash_parts (
        id,
        part_definition_id,
        part_definitions (id, name)
      )
    `);

  if (error) throw new Error(`Failed to fetch kitbashes: ${error.message}`);
  result.checked = (kitbashes || []).length;

  for (const kb of kitbashes || []) {
    const parts = (kb as any).kitbash_parts || [];
    for (const kp of parts) {
      if (!kp.part_definition_id || !(kp as any).part_definitions) {
        result.issuesFound++;
        result.conflicts.push(
          `Invalid part reference in kitbash "${kb.name}": part no longer exists`
        );
      }
    }
  }

  return result;
}

/**
 * Step 6: Alias Enrichment
 */
async function aliasEnrichment(): Promise<AliasEnrichmentResult> {
  const result: AliasEnrichmentResult = {
    checked: 0,
    suggestionsGenerated: 0,
    aliasesAdded: 0,
    details: [],
  };

  const { data: moldFamilies, error } = await supabase
    .from('mold_families')
    .select(`
      id,
      name,
      aliases,
      mold_family_usage (
        part_definition_count,
        figure_count
      )
    `);

  if (error) throw new Error(`Failed to fetch mold families: ${error.message}`);
  result.checked = (moldFamilies || []).length;

  for (const mf of moldFamilies || []) {
    const existingAliases = mf.aliases || [];
    const suggestions: string[] = [];

    // Buck pattern
    if (mf.name.includes('Buck')) {
      const baseNameWithoutBuck = mf.name.replace(/\s*Buck\s*$/, '').trim();
      if (baseNameWithoutBuck && !existingAliases.includes(baseNameWithoutBuck)) {
        suggestions.push(baseNameWithoutBuck);
      }
    }

    // Abbreviations
    const words = mf.name.split(/\s+/);
    if (words.length > 1) {
      const abbrev = words.map((w: string) => w[0]).join('').toUpperCase();
      if (abbrev.length > 1 && !existingAliases.includes(abbrev)) {
        suggestions.push(abbrev);
      }
    }

    if (suggestions.length > 0) {
      result.suggestionsGenerated += suggestions.length;
      result.details.push(
        `Suggested aliases for "${mf.name}": ${suggestions.join(', ')}`
      );
    }
  }

  return result;
}

/**
 * Identify orphan parts
 */
async function identifyOrphanParts(): Promise<
  Array<{ id: string; name: string; slug: string; reason: string }>
> {
  const { data: parts, error } = await supabase
    .from('part_definitions')
    .select(`
      id,
      name,
      slug,
      figure_parts(id),
      kitbash_parts(id)
    `);

  if (error) throw new Error(`Failed to identify orphans: ${error.message}`);

  const orphans: Array<{
    id: string;
    name: string;
    slug: string;
    reason: string;
  }> = [];

  for (const part of parts || []) {
    const figureCount = ((part as any).figure_parts || []).length;
    const kitbashCount = ((part as any).kitbash_parts || []).length;

    if (figureCount === 0 && kitbashCount === 0) {
      orphans.push({
        id: part.id,
        name: part.name,
        slug: part.slug,
        reason: 'Not used by any figure or kitbash',
      });
    }
  }

  return orphans;
}

/**
 * Suggest confidence score updates
 */
async function suggestConfidenceUpdates(): Promise<
  Array<{
    entityType: string;
    entityId: string;
    entityName: string;
    currentConfidence: number;
    suggestedConfidence: number;
    reason: string;
  }>
> {
  const suggestions: Array<{
    entityType: string;
    entityId: string;
    entityName: string;
    currentConfidence: number;
    suggestedConfidence: number;
    reason: string;
  }> = [];

  const { data: moldFamilies, error } = await supabase
    .from('mold_family_usage')
    .select('*');

  if (error) throw new Error(`Failed to fetch mold family usage: ${error.message}`);

  for (const mf of moldFamilies || []) {
    if ((mf as any).figure_count > 10 && (mf as any).confidence_score < 0.95) {
      suggestions.push({
        entityType: 'mold_family',
        entityId: (mf as any).id,
        entityName: (mf as any).name,
        currentConfidence: (mf as any).confidence_score || 1.0,
        suggestedConfidence: 0.95,
        reason: `High usage in ${(mf as any).figure_count} figures`,
      });
    }

    if ((mf as any).part_definition_count === 1 && (mf as any).figure_count < 2) {
      suggestions.push({
        entityType: 'mold_family',
        entityId: (mf as any).id,
        entityName: (mf as any).name,
        currentConfidence: (mf as any).confidence_score || 1.0,
        suggestedConfidence: 0.7,
        reason: `Low usage (${(mf as any).figure_count} figures)`,
      });
    }
  }

  return suggestions;
}

/**
 * Run the complete nightly graph integrity sweep
 */
export async function runGraphIntegritySweep(): Promise<GraphSweepReport> {
  const [
    figureRecon,
    partRecon,
    figPartVal,
    compatVal,
    kitbashVal,
    aliasEnrich,
    orphans,
    confidenceUpdates,
  ] = await Promise.all([
    figureReconciliation(),
    partReconciliation(),
    figurePartValidation(),
    compatibilityValidation(),
    kitbashValidation(),
    aliasEnrichment(),
    identifyOrphanParts(),
    suggestConfidenceUpdates(),
  ]);

  const totalIssuesFound =
    figureRecon.issuesFound +
    partRecon.issuesFound +
    figPartVal.issuesFound +
    compatVal.issuesFound +
    kitbashVal.issuesFound;

  const totalFixesApplied =
    figureRecon.fixesApplied +
    partRecon.fixesApplied +
    figPartVal.fixesApplied +
    compatVal.fixesApplied +
    kitbashVal.fixesApplied;

  const allConflicts = [
    ...figureRecon.details,
    ...partRecon.details,
    ...figPartVal.conflicts,
    ...compatVal.conflicts,
    ...kitbashVal.conflicts,
  ];

  return {
    timestamp: new Date().toISOString(),
    totalIssuesFound,
    totalFixesApplied,
    pipeline: {
      figureReconciliation: figureRecon,
      partReconciliation: partRecon,
      figurePartValidation: figPartVal,
      compatibilityValidation: compatVal,
      kitbashValidation: kitbashVal,
      aliasEnrichment: aliasEnrich,
    },
    orphanParts: orphans,
    conflicts: allConflicts,
    suggestedConfidenceUpdates: confidenceUpdates,
  };
}