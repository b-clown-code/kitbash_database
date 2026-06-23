/**
 * Mold Service
 * Handles all mold-family-related database operations
 */

import { supabase } from '@/lib/supabaseClient';
import type { Mold } from '@/lib/types';

/**
 * Get all mold families
 */
export async function getMolds(): Promise<Mold[]> {
  const { data, error } = await supabase.from('mold_families').select('*');

  if (error) {
    console.error('Error fetching mold families:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get a single mold family by ID
 */
export async function getMoldById(id: string): Promise<Mold | null> {
  const { data, error } = await supabase
    .from('mold_families')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching mold family:', error);
    throw error;
  }

  return data || null;
}

/**
 * Get mold family by name
 */
export async function getMoldByName(name: string): Promise<Mold | null> {
  const { data, error } = await supabase
    .from('mold_families')
    .select('*')
    .eq('name', name)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching mold family by name:', error);
    throw error;
  }

  return data || null;
}

/**
 * Search mold families by name or aliases
 */
export async function searchMolds(query: string): Promise<Mold[]> {
  const { data, error } = await supabase
    .from('mold_families')
    .select('*')
    .or(`name.ilike.%${query}%,aliases.cs.{"${query}"}`)
    .limit(20);

  if (error) {
    console.error('Error searching mold families:', error);
    throw error;
  }

  return data || [];
}

/**
 * Create a new mold family
 */
export async function createMold(mold: {
  name: string;
  aliases?: string[];
  confidence_score?: number;
  description?: string;
  metadata?: Record<string, any>;
}): Promise<Mold | null> {
  const { data, error } = await supabase
    .from('mold_families')
    .insert([mold])
    .select()
    .single();

  if (error) {
    console.error('Error creating mold family:', error);
    throw error;
  }

  return data || null;
}

/**
 * Update mold family
 */
export async function updateMold(
  id: string,
  updates: Partial<Mold>
): Promise<Mold | null> {
  const { data, error } = await supabase
    .from('mold_families')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating mold family:', error);
    throw error;
  }

  return data || null;
}

/**
 * Add alias to mold family
 */
export async function addMoldAlias(moldId: string, alias: string): Promise<boolean> {
  const mold = await getMoldById(moldId);
  if (!mold) {
    throw new Error('Mold family not found');
  }

  const aliases = mold.aliases || [];
  if (!aliases.includes(alias)) {
    aliases.push(alias);
    await updateMold(moldId, { aliases });
  }

  return true;
}

/**
 * Get mold families sorted by usage (from materialized view)
 */
export async function getMoldsByUsage(limit: number = 50): Promise<any[]> {
  const { data, error } = await supabase
    .from('mold_family_usage')
    .select('*')
    .order('kitbash_usage_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching mold families by usage:', error);
    throw error;
  }

  return data || [];
}

/**
 * Search for potential mold-family matches using Levenshtein distance
 */
export async function findMoldMatches(
  query: string,
  threshold: number = 0.7
): Promise<Mold[]> {
  const exact = await getMoldByName(query);
  if (exact) {
    return [exact];
  }

  const allMolds = await getMolds();
  const matches: Mold[] = [];

  for (const mold of allMolds) {
    const mainSimilarity = calculateSimilarity(query, mold.name);
    if (mainSimilarity >= threshold) {
      matches.push(mold);
      continue;
    }

    for (const alias of mold.aliases || []) {
      const aliasSimilarity = calculateSimilarity(query, alias);
      if (aliasSimilarity >= threshold) {
        matches.push(mold);
        break;
      }
    }
  }

  return matches.sort((a, b) => {
    const aSim = Math.max(
      calculateSimilarity(query, a.name),
      ...(a.aliases || []).map((alias) => calculateSimilarity(query, alias))
    );
    const bSim = Math.max(
      calculateSimilarity(query, b.name),
      ...(b.aliases || []).map((alias) => calculateSimilarity(query, alias))
    );
    return bSim - aSim;
  });
}

function calculateSimilarity(a: string, b: string): number {
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;

  if (longer.length === 0) return 1.0;

  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function getEditDistance(a: string, b: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= a.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= b.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (a.charAt(i - 1) !== b.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[b.length] = lastValue;
  }
  return costs[b.length];
}
