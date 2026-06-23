/**
 * Part Service
 * Handles part-definition and figure-part graph operations
 */

import { supabase } from '@/lib/supabaseClient';
import type { Part, PartType } from '@/lib/types';
import { slugify } from '@/lib/utils';

/**
 * Get all part definitions, optionally filtered by part type
 */
export async function getParts(type?: string): Promise<Part[]> {
  let query = supabase.from('part_definitions').select('*');

  if (type) {
    query = query.eq('part_type', type);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching parts:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get a single part definition by ID
 */
export async function getPartById(id: string): Promise<Part | null> {
  const { data, error } = await supabase
    .from('part_definitions')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching part:', error);
    throw error;
  }

  return data || null;
}

/**
 * Get part definitions used by a specific figure
 */
export async function getPartsByFigure(figureId: string): Promise<Part[]> {
  const { data, error } = await supabase
    .from('figure_parts')
    .select('part_definitions(*)')
    .eq('figure_id', figureId);

  if (error) {
    console.error('Error fetching parts by figure:', error);
    throw error;
  }

  return (
    data
      ?.map((row: any) => row.part_definitions)
      .filter(Boolean) || []
  );
}

/**
 * Search part definitions by name
 */
export async function searchParts(query: string, type?: string): Promise<Part[]> {
  let search = supabase
    .from('part_definitions')
    .select('*')
    .ilike('name', `%${query}%`);

  if (type) {
    search = search.eq('part_type', type);
  }

  const { data, error } = await search.limit(20);

  if (error) {
    console.error('Error searching parts:', error);
    throw error;
  }

  return data || [];
}

/**
 * Create a new part definition and optionally attach to a figure
 */
export async function createPart(part: {
  type: PartType;
  name: string;
  source_figure_id?: string;
  metadata?: Record<string, any>;
}): Promise<Part | null> {
  const baseSlug = slugify(part.name);
  const { data: existing } = await supabase
    .from('part_definitions')
    .select('slug')
    .ilike('slug', `${baseSlug}%`);

  const suffix = (existing?.length || 0) + 1;
  const slug = existing && existing.length > 0 ? `${baseSlug}-v${suffix}` : `${baseSlug}-v1`;

  const payload = {
    slug,
    name: part.name,
    part_type: part.type,
    metadata: part.metadata || {},
  };

  const { data, error } = await supabase
    .from('part_definitions')
    .insert([payload])
    .select('*')
    .single();

  if (error) {
    console.error('Error creating part:', error);
    throw error;
  }

  if (part.source_figure_id && data) {
    const { error: linkError } = await supabase
      .from('figure_parts')
      .insert([
        {
          figure_id: part.source_figure_id,
          part_definition_id: data.id,
          is_primary: true,
        },
      ]);

    if (linkError) {
      console.error('Error linking part to figure:', linkError);
      throw linkError;
    }
  }

  return data || null;
}

/**
 * Update part definition
 */
export async function updatePart(
  id: string,
  updates: Partial<Part>
): Promise<Part | null> {
  const payload: Record<string, any> = {
    slug: updates.slug,
    name: updates.name,
    part_type: updates.part_type,
    mold_family_id: updates.mold_family_id,
    description: updates.description,
    year_introduced: updates.year_introduced,
    pinless: updates.pinless,
    knee_type: updates.knee_type,
    metadata: updates.metadata,
  };

  const { data, error } = await supabase
    .from('part_definitions')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating part:', error);
    throw error;
  }

  return data || null;
}

/**
 * Get parts by type with pagination
 */
export async function getPartsByType(
  type: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{
  parts: Part[];
  total: number;
  pages: number;
}> {
  const start = (page - 1) * pageSize;

  const { data, error, count } = await supabase
    .from('part_definitions')
    .select('*', { count: 'exact' })
    .eq('part_type', type)
    .range(start, start + pageSize - 1);

  if (error) {
    console.error('Error fetching parts by type:', error);
    throw error;
  }

  return {
    parts: data || [],
    total: count || 0,
    pages: Math.ceil((count || 0) / pageSize),
  };
}

/**
 * Get available part types
 */
export async function getAvailablePartTypes(): Promise<string[]> {
  const { data, error } = await supabase
    .from('part_definitions')
    .select('part_type');

  if (error) {
    console.error('Error fetching part types:', error);
    throw error;
  }

  const set = new Set<string>((data || []).map((d: any) => d.part_type));
  return Array.from(set);
}
