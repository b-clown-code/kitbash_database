/**
 * Kitbash Service
 * Handles kitbash-related database operations using kitbash_parts graph links
 */

import { supabase } from '@/lib/supabaseClient';
import type { Kitbash, KitbashPart } from '@/lib/types';

type KitbashRow = {
  id: string;
  name: string;
  description: string | null;
  creator: string | null;
  tags: string[];
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

async function hydrateKitbashParts(kitbash: KitbashRow): Promise<Kitbash> {
  const { data: partRows, error: partError } = await supabase
    .from('kitbash_parts')
    .select('part_definition_id, position, notes')
    .eq('kitbash_id', kitbash.id)
    .order('created_at', { ascending: true });

  if (partError) {
    console.error('Error fetching kitbash parts:', partError);
    throw partError;
  }

  const parts: KitbashPart[] = (partRows || []).map((part: any) => ({
    part_definition_id: part.part_definition_id,
    position: part.position || undefined,
    notes: part.notes || undefined,
  }));

  return {
    id: kitbash.id,
    name: kitbash.name,
    description: kitbash.description || undefined,
    parts,
    creator: kitbash.creator || undefined,
    tags: kitbash.tags || [],
    metadata: kitbash.metadata || undefined,
    created_at: kitbash.created_at,
    updated_at: kitbash.updated_at,
  };
}

export async function getKitbashes(): Promise<Kitbash[]> {
  const { data, error } = await supabase.from('kitbashes').select('*');

  if (error) {
    console.error('Error fetching kitbashes:', error);
    throw error;
  }

  const hydrated = await Promise.all((data || []).map((kb: any) => hydrateKitbashParts(kb)));
  return hydrated;
}

export async function getKitbashById(id: string): Promise<Kitbash | null> {
  const { data, error } = await supabase
    .from('kitbashes')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching kitbash:', error);
    throw error;
  }

  if (!data) {
    return null;
  }

  return hydrateKitbashParts(data as KitbashRow);
}

export async function getKitbashesPaginated(
  page: number = 1,
  pageSize: number = 20
): Promise<{
  kitbashes: Kitbash[];
  total: number;
  pages: number;
}> {
  const start = (page - 1) * pageSize;

  const { data, error, count } = await supabase
    .from('kitbashes')
    .select('*', { count: 'exact' })
    .range(start, start + pageSize - 1);

  if (error) {
    console.error('Error fetching kitbashes:', error);
    throw error;
  }

  const kitbashes = await Promise.all((data || []).map((kb: any) => hydrateKitbashParts(kb)));

  return {
    kitbashes,
    total: count || 0,
    pages: Math.ceil((count || 0) / pageSize),
  };
}

export async function searchKitbashes(query: string): Promise<Kitbash[]> {
  const { data, error } = await supabase
    .from('kitbashes')
    .select('*')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{"${query}"}`)
    .limit(20);

  if (error) {
    console.error('Error searching kitbashes:', error);
    throw error;
  }

  const hydrated = await Promise.all((data || []).map((kb: any) => hydrateKitbashParts(kb)));
  return hydrated;
}

export async function getKitbashesByCreator(creator: string): Promise<Kitbash[]> {
  const { data, error } = await supabase
    .from('kitbashes')
    .select('*')
    .eq('creator', creator);

  if (error) {
    console.error('Error fetching kitbashes by creator:', error);
    throw error;
  }

  const hydrated = await Promise.all((data || []).map((kb: any) => hydrateKitbashParts(kb)));
  return hydrated;
}

export async function getKitbashesByTag(tag: string): Promise<Kitbash[]> {
  const { data, error } = await supabase
    .from('kitbashes')
    .select('*')
    .contains('tags', [tag]);

  if (error) {
    console.error('Error fetching kitbashes by tag:', error);
    throw error;
  }

  const hydrated = await Promise.all((data || []).map((kb: any) => hydrateKitbashParts(kb)));
  return hydrated;
}

export async function createKitbash(kitbash: {
  name: string;
  description?: string;
  parts: KitbashPart[];
  creator?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}): Promise<Kitbash | null> {
  const basePayload = {
    name: kitbash.name,
    description: kitbash.description || null,
    creator: kitbash.creator || null,
    tags: kitbash.tags || [],
    metadata: kitbash.metadata || {},
  };

  const { data, error } = await supabase
    .from('kitbashes')
    .insert([basePayload])
    .select('*')
    .single();

  if (error) {
    console.error('Error creating kitbash:', error);
    throw error;
  }

  const linkRows = (kitbash.parts || []).map((part) => ({
    kitbash_id: data.id,
    part_definition_id: part.part_definition_id || part.part_id,
    position: part.position || null,
    notes: part.notes || null,
    metadata: {},
  }));

  if (linkRows.length > 0) {
    const { error: linkError } = await supabase
      .from('kitbash_parts')
      .insert(linkRows);

    if (linkError) {
      console.error('Error linking kitbash parts:', linkError);
      throw linkError;
    }
  }

  return hydrateKitbashParts(data as KitbashRow);
}

export async function updateKitbash(
  id: string,
  updates: Partial<Kitbash>
): Promise<Kitbash | null> {
  const payload: Record<string, any> = {
    name: updates.name,
    description: updates.description,
    creator: updates.creator,
    tags: updates.tags,
    metadata: updates.metadata,
  };

  const { data, error } = await supabase
    .from('kitbashes')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating kitbash:', error);
    throw error;
  }

  if (updates.parts) {
    const { error: deleteError } = await supabase
      .from('kitbash_parts')
      .delete()
      .eq('kitbash_id', id);

    if (deleteError) {
      console.error('Error clearing existing kitbash parts:', deleteError);
      throw deleteError;
    }

    const insertRows = updates.parts.map((part) => ({
      kitbash_id: id,
      part_definition_id: part.part_definition_id || part.part_id,
      position: part.position || null,
      notes: part.notes || null,
      metadata: {},
    }));

    if (insertRows.length > 0) {
      const { error: insertError } = await supabase
        .from('kitbash_parts')
        .insert(insertRows);

      if (insertError) {
        console.error('Error inserting updated kitbash parts:', insertError);
        throw insertError;
      }
    }
  }

  return hydrateKitbashParts(data as KitbashRow);
}

export async function deleteKitbash(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('kitbashes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting kitbash:', error);
    throw error;
  }

  return true;
}

export async function addKitbashTag(kitbashId: string, tag: string): Promise<boolean> {
  const kitbash = await getKitbashById(kitbashId);
  if (!kitbash) {
    throw new Error('Kitbash not found');
  }

  const tags = kitbash.tags || [];
  if (!tags.includes(tag)) {
    tags.push(tag);
    await updateKitbash(kitbashId, { tags });
  }

  return true;
}

export async function getAllTags(): Promise<string[]> {
  const { data, error } = await supabase
    .from('kitbashes')
    .select('tags');

  if (error) {
    console.error('Error fetching tags:', error);
    throw error;
  }

  const allTags = new Set<string>();
  (data || []).forEach((row: any) => {
    if (row.tags && Array.isArray(row.tags)) {
      row.tags.forEach((tag: string) => allTags.add(tag));
    }
  });

  return Array.from(allTags).sort();
}

export async function getKitbashesByPart(partId: string): Promise<Kitbash[]> {
  const { data: links, error: linkError } = await supabase
    .from('kitbash_parts')
    .select('kitbash_id')
    .eq('part_definition_id', partId);

  if (linkError) {
    console.error('Error fetching kitbash links by part:', linkError);
    throw linkError;
  }

  const ids = Array.from(new Set((links || []).map((row: any) => row.kitbash_id)));
  if (ids.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('kitbashes')
    .select('*')
    .in('id', ids);

  if (error) {
    console.error('Error fetching kitbashes by part:', error);
    throw error;
  }

  const hydrated = await Promise.all((data || []).map((kb: any) => hydrateKitbashParts(kb)));
  return hydrated;
}
