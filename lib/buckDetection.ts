/**
 * Buck Detection Service
 * Analyzes figure parts to auto-detect and correct the dominant mold (buck)
 */

import { supabase } from './supabaseClient';

export interface BuckDetectionResult {
  figureId: string;
  figureName: string;
  detectedBuck: string | null;
  partCount: number;
  moldPercentages: Array<{ mold: string; count: number; percentage: number }>;
  changed: boolean;
}

const BUCK_THRESHOLD = 0.8; // 80% threshold - only assign buck if very confident
const MIN_BODY_PARTS = 2;  // Need at least 2 body parts to attempt detection
const BODY_PARTS = ['head', 'torso', 'arms', 'legs']; // Parts to count for buck detection

/**
 * Analyze a single figure and detect its buck
 */
export async function detectBuckForFigure(figureId: string): Promise<BuckDetectionResult> {
  // Get figure details
  const { data: figure, error: figError } = await supabase
    .from('figures')
    .select('id, name, base_buck')
    .eq('id', figureId)
    .single();

  if (figError || !figure) {
    throw new Error(`Figure not found: ${figureId}`);
  }

  // Get all body parts for this figure with their molds
  const { data: figureParts, error: partsError } = await supabase
    .from('figure_parts')
    .select(
      `
      id,
      part_definition_id,
      part_definitions!inner (
        id,
        part_type,
        mold_family_id,
        mold_families (
          id,
          name
        )
      )
    `
    )
    .eq('figure_id', figureId);

  if (partsError) {
    throw new Error(`Failed to fetch parts: ${partsError.message}`);
  }

  if (!figureParts || figureParts.length === 0) {
    return {
      figureId,
      figureName: figure.name,
      detectedBuck: null,
      partCount: 0,
      moldPercentages: [],
      changed: false,
    };
  }

  // Count molds (only body parts)
  const moldCounts: Record<string, { mold: string; count: number }> = {};
  let bodyPartCount = 0;

  for (const part of figureParts) {
    const partDef = (part as any).part_definitions;
    if (!partDef) continue;

    // Only count body parts
    if (BODY_PARTS.includes(partDef.part_type)) {
      bodyPartCount++;

      const mold = (partDef.mold_families as any);
      const moldName = mold?.name || (mold && Array.isArray(mold) ? mold[0]?.name : null);
      
      if (moldName) {
        if (!moldCounts[moldName]) {
          moldCounts[moldName] = { mold: moldName, count: 0 };
        }
        moldCounts[moldName].count++;
      }
    }
  }

  // Calculate percentages and sort
  const moldPercentages = Object.values(moldCounts)
    .map((item) => ({
      ...item,
      percentage: bodyPartCount > 0 ? item.count / bodyPartCount : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  // Determine if there's a dominant mold
  // Only assign if:
  // 1. At least MIN_BODY_PARTS are present (avoid false positives from single part)
  // 2. One mold represents ≥80% of body parts (high confidence)
  const detectedBuck =
    bodyPartCount >= MIN_BODY_PARTS &&
    moldPercentages.length > 0 &&
    moldPercentages[0].percentage >= BUCK_THRESHOLD
      ? moldPercentages[0].mold
      : null;

  // Check if this is a change
  const changed = detectedBuck !== figure.base_buck;

  return {
    figureId,
    figureName: figure.name,
    detectedBuck,
    partCount: bodyPartCount,
    moldPercentages,
    changed,
  };
}

/**
 * Run detection for all figures and update base_buck if changed
 */
export async function detectAndUpdateAllBucks(): Promise<BuckDetectionResult[]> {
  // Get all figures
  const { data: figures, error: figError } = await supabase
    .from('figures')
    .select('id, name');

  if (figError || !figures) {
    throw new Error('Failed to fetch figures');
  }

  const results: BuckDetectionResult[] = [];

  for (const figure of figures) {
    try {
      const result = await detectBuckForFigure(figure.id);

      // Update if changed
      if (result.changed) {
        const { error: updateError } = await supabase
          .from('figures')
          .update({ base_buck: result.detectedBuck })
          .eq('id', figure.id);

        if (updateError) {
          console.error(`Failed to update figure ${figure.id}: ${updateError.message}`);
        } else {
          console.log(
            `Updated ${figure.name}: base_buck=${result.detectedBuck || 'null'}`
          );
        }
      }

      results.push(result);
    } catch (error) {
      console.error(`Error detecting buck for figure ${figure.id}:`, error);
    }
  }

  return results;
}

/**
 * Get the display name for a part (mold name or figure name if unique)
 */
export function getPartDisplayName(
  part: any, // figure_parts row with joined part_definitions & mold_families
  figureName: string
): string {
  const partDef = part.part_definitions;
  if (!partDef) return 'Unknown';

  const partType = partDef.part_type || 'part';
  const moldName = partDef.mold_families?.name;

  // If has mold, show mold name; otherwise show figure name
  const prefix = moldName || figureName;
  return `${prefix} ${partType}`;
}
