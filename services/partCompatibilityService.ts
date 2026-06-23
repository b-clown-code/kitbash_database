/**
 * Part Compatibility Service
 * Manages part-definition-to-part-definition compatibility relationships
 */

import { supabase } from '@/lib/supabaseClient';
import type { PartCompatibility, CompatibilityLevel } from '@/lib/types';

/**
 * Get compatibility between two specific part definitions
 */
export async function getCompatibility(
  sourcePart: string,
  targetPart: string
): Promise<PartCompatibility | null> {
  const { data, error } = await supabase
    .from('part_compatibility')
    .select('*')
    .eq('source_part_definition_id', sourcePart)
    .eq('target_part_definition_id', targetPart)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching compatibility:', error);
    throw error;
  }

  return data || null;
}

/**
 * Get all compatible part definitions for a source part definition
 */
export async function getCompatibleParts(
  partId: string,
  level?: CompatibilityLevel
): Promise<PartCompatibility[]> {
  let query = supabase
    .from('part_compatibility')
    .select('*')
    .eq('source_part_definition_id', partId);

  if (level) {
    query = query.eq('compatibility_level', level);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching compatible parts:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get all part definitions compatible with a target part definition (reverse lookup)
 */
export async function getPartsThatFitWith(
  partId: string,
  level?: CompatibilityLevel
): Promise<PartCompatibility[]> {
  let query = supabase
    .from('part_compatibility')
    .select('*')
    .eq('target_part_definition_id', partId);

  if (level) {
    query = query.eq('compatibility_level', level);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching parts that fit:', error);
    throw error;
  }

  return data || [];
}

export async function getCompatibilitiesByLevel(
  level: CompatibilityLevel
): Promise<PartCompatibility[]> {
  const { data, error } = await supabase
    .from('part_compatibility')
    .select('*')
    .eq('compatibility_level', level);

  if (error) {
    console.error('Error fetching compatibilities by level:', error);
    throw error;
  }

  return data || [];
}

export async function getDirectSwaps(): Promise<PartCompatibility[]> {
  return getCompatibilitiesByLevel('green');
}

export async function getMinorModSwaps(): Promise<PartCompatibility[]> {
  return getCompatibilitiesByLevel('yellow');
}

export async function getIncompatibilities(): Promise<PartCompatibility[]> {
  return getCompatibilitiesByLevel('red');
}

/**
 * Create a compatibility relationship
 */
export async function createCompatibility(compatibility: {
  source_part_definition_id?: string;
  target_part_definition_id?: string;
  source_part_id?: string;
  target_part_id?: string;
  compatibility_level: CompatibilityLevel;
  notes?: string;
  modification_type?: string;
  confidence?: number;
  submitted_by?: string;
}): Promise<PartCompatibility | null> {
  const sourceId = compatibility.source_part_definition_id || compatibility.source_part_id;
  const targetId = compatibility.target_part_definition_id || compatibility.target_part_id;

  if (!sourceId || !targetId) {
    throw new Error('source_part_definition_id and target_part_definition_id are required');
  }

  const payload = {
    source_part_definition_id: sourceId,
    target_part_definition_id: targetId,
    compatibility_level: compatibility.compatibility_level,
    notes: compatibility.notes,
    modification_type: compatibility.modification_type,
    confidence: compatibility.confidence,
    submitted_by: compatibility.submitted_by,
  };

  const { data, error } = await supabase
    .from('part_compatibility')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Error creating compatibility:', error);
    throw error;
  }

  return data || null;
}

export async function updateCompatibility(
  id: string,
  updates: Partial<PartCompatibility>
): Promise<PartCompatibility | null> {
  const payload: Record<string, any> = {
    source_part_definition_id: updates.source_part_definition_id,
    target_part_definition_id: updates.target_part_definition_id,
    compatibility_level: updates.compatibility_level,
    notes: updates.notes,
    modification_type: updates.modification_type,
    confidence: updates.confidence,
    submitted_by: updates.submitted_by,
  };

  const { data, error } = await supabase
    .from('part_compatibility')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating compatibility:', error);
    throw error;
  }

  return data || null;
}

export async function deleteCompatibility(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('part_compatibility')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting compatibility:', error);
    throw error;
  }

  return true;
}

export async function checkMultipleCompatibilities(
  partIds: string[]
): Promise<{
  compatible: PartCompatibility[];
  minorMods: PartCompatibility[];
  incompatible: PartCompatibility[];
  unknown: string[];
}> {
  const result = {
    compatible: [] as PartCompatibility[],
    minorMods: [] as PartCompatibility[],
    incompatible: [] as PartCompatibility[],
    unknown: [] as string[],
  };

  for (let i = 0; i < partIds.length; i++) {
    let hasCompatibility = false;

    for (let j = i + 1; j < partIds.length; j++) {
      const compat = await getCompatibility(partIds[i], partIds[j]);

      if (compat) {
        hasCompatibility = true;
        if (compat.compatibility_level === 'green') {
          result.compatible.push(compat);
        } else if (compat.compatibility_level === 'yellow') {
          result.minorMods.push(compat);
        } else if (compat.compatibility_level === 'red') {
          result.incompatible.push(compat);
        }
      }
    }

    if (!hasCompatibility) {
      const hasAnyEntry =
        result.compatible.some(
          (c) => c.source_part_definition_id === partIds[i] || c.target_part_definition_id === partIds[i]
        ) ||
        result.minorMods.some(
          (c) => c.source_part_definition_id === partIds[i] || c.target_part_definition_id === partIds[i]
        ) ||
        result.incompatible.some(
          (c) => c.source_part_definition_id === partIds[i] || c.target_part_definition_id === partIds[i]
        );

      if (!hasAnyEntry) {
        result.unknown.push(partIds[i]);
      }
    }
  }

  return result;
}

export async function getCompatibilityStats(): Promise<{
  total: number;
  green: number;
  yellow: number;
  red: number;
  averageConfidence: number;
}> {
  const { data, error } = await supabase
    .from('part_compatibility')
    .select('compatibility_level, confidence');

  if (error) {
    console.error('Error fetching compatibility stats:', error);
    throw error;
  }

  const stats = {
    total: data?.length || 0,
    green: 0,
    yellow: 0,
    red: 0,
    averageConfidence: 0,
  };

  let confidenceSum = 0;

  (data || []).forEach((item: any) => {
    if (item.compatibility_level === 'green') stats.green++;
    else if (item.compatibility_level === 'yellow') stats.yellow++;
    else if (item.compatibility_level === 'red') stats.red++;

    confidenceSum += item.confidence || 1;
  });

  stats.averageConfidence =
    stats.total > 0 ? Math.round((confidenceSum / stats.total) * 100) / 100 : 0;

  return stats;
}

export async function recordModification(
  compatibilityId: string,
  modificationType: string,
  notes?: string
): Promise<PartCompatibility | null> {
  return updateCompatibility(compatibilityId, {
    modification_type: modificationType,
    notes: notes || undefined,
    compatibility_level: 'yellow',
  });
}

export async function findBestFits(partId: string): Promise<PartCompatibility[]> {
  const compatibilities = await getCompatibleParts(partId);

  return compatibilities.sort((a, b) => {
    const levelOrder = { green: 0, yellow: 1, red: 2 };
    const levelDiff = levelOrder[a.compatibility_level] - levelOrder[b.compatibility_level];

    if (levelDiff !== 0) return levelDiff;

    return (b.confidence || 0) - (a.confidence || 0);
  });
}
