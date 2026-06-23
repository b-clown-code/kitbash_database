/**
 * Figure Rendering Pipeline
 * Transforms raw Supabase data → normalized → deduplicated → grouped → view model
 *
 * Ensures clean UI output from messy, duplicated multi-source database joins.
 */

export type PartType = 'head' | 'torso' | 'arms' | 'legs' | 'accessory';

/**
 * Canonical part schema
 */
export interface Part {
  id: string;
  type: PartType;
  name: string;
  displayName: string;
  moldName?: string;
  slot_label?: string;
  is_primary?: boolean;
  notes?: string;
  raw?: any;
}

/**
 * Grouped parts structure
 */
export interface GroupedParts {
  head: Part[];
  torso: Part[];
  arms: Part[];
  legs: Part[];
  accessory: Part[];
}

/**
 * UI-ready view model
 */
export interface FigureViewModel {
  title: string;
  baseBuck: string;
  parts: GroupedParts;
  summary: {
    totalParts: number;
    bodyPartsCovered: PartType[];
  };
}

/**
 * Step 1: Normalize part type to canonical schema
 * Handles inconsistent naming patterns from database
 */
function normalizePartType(rawType: string | null | undefined): PartType {
  if (!rawType) return 'accessory';

  const type = rawType.toLowerCase().trim();

  // Map common variations to canonical types
  const typeMap: Record<string, PartType> = {
    head: 'head',
    torso: 'torso',
    torso_lower: 'torso',
    torso_upper: 'torso',
    body: 'torso',
    arms: 'arms',
    arm: 'arms',
    legs: 'legs',
    leg: 'legs',
    accessory: 'accessory',
    attachment: 'accessory',
    weapon: 'accessory',
  };

  return typeMap[type] || 'accessory';
}

/**
 * Step 2: Standardize part names
 * Remove duplicative or redundant text
 */
function standardizeName(name: string): string {
  if (!name) return '';

  // Remove common suffixes
  let normalized = name
    .toLowerCase()
    .trim()
    // Remove trailing type descriptors that are redundant with type field
    .replace(/\s+(torso|head|arms?|legs?|body|upper|lower)\s*$/i, '')
    // Remove common generic suffixes
    .replace(/\s+(part|piece|component)\s*$/i, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();

  return normalized;
}

/**
 * Step 1: Normalize - Convert raw API parts to canonical schema
 */
export function normalize(rawParts: any[]): Part[] {
  if (!Array.isArray(rawParts)) return [];

  return rawParts
    .filter((part) => part && part.id) // Remove null/undefined entries
    .map((part) => {
      const type = normalizePartType(part.part_type);
      const name = standardizeName(part.displayName || part.name || '');

      return {
        id: part.id,
        type,
        name,
        displayName: part.displayName || part.name || '',
        moldName: part.moldName,
        slot_label: part.slot_label,
        is_primary: part.is_primary ?? false,
        notes: part.notes,
        raw: part,
      };
    });
}

/**
 * Step 2: Dedupe - Remove duplicates based on type:name key
 * Keep first occurrence, discard subsequent duplicates
 */
export function dedupe(parts: Part[]): Part[] {
  const seen = new Set<string>();
  const result: Part[] = [];

  for (const part of parts) {
    const key = `${part.type}:${part.name}`;

    if (!seen.has(key)) {
      seen.add(key);
      result.push(part);
    }
  }

  return result;
}

/**
 * Step 3: Group - Organize parts by type for structured display
 */
export function groupParts(parts: Part[]): GroupedParts {
  const grouped: GroupedParts = {
    head: [],
    torso: [],
    arms: [],
    legs: [],
    accessory: [],
  };

  for (const part of parts) {
    grouped[part.type].push(part);
  }

  return grouped;
}

/**
 * Step 4: Build view model - Create clean UI-ready object
 */
export function buildFigureViewModel(
  figure: any,
  parts: Part[]
): FigureViewModel {
  const grouped = groupParts(parts);

  // Calculate which body parts are present
  const bodyPartsCovered: PartType[] = [];
  if (grouped.head.length > 0) bodyPartsCovered.push('head');
  if (grouped.torso.length > 0) bodyPartsCovered.push('torso');
  if (grouped.arms.length > 0) bodyPartsCovered.push('arms');
  if (grouped.legs.length > 0) bodyPartsCovered.push('legs');

  return {
    title: figure?.name || 'Unknown Figure',
    baseBuck: figure?.base_buck || 'unique',
    parts: grouped,
    summary: {
      totalParts: parts.length,
      bodyPartsCovered,
    },
  };
}

/**
 * Master pipeline function
 * raw → normalize → dedupe → group → view model
 */
export function transformFigureData(
  figure: any,
  rawParts: any[]
): FigureViewModel {
  const normalized = normalize(rawParts);
  const deduplicated = dedupe(normalized);
  const viewModel = buildFigureViewModel(figure, deduplicated);

  return viewModel;
}
