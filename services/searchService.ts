/**
 * Search and Matching Service
 * Phase 3: Matching system with fuzzy search, aliases, and duplicate detection
 */

import Fuse from 'fuse.js';
import { supabase } from '@/lib/supabaseClient';
import type { SearchResult, MatchResult } from '@/lib/types';
import * as figureService from './figureService';
import * as partService from './partService';
import * as moldService from './moldService';
import * as kitbashService from './kitbashService';

/**
 * Global search across all entities
 */
export async function globalSearch(query: string): Promise<SearchResult[]> {
  const [linesResult, figures, parts, molds, kitbashes] = await Promise.all([
    supabase.from('lines').select('*').ilike('name', `%${query}%`).limit(20),
    figureService.searchFigures(query),
    partService.searchParts(query),
    moldService.searchMolds(query),
    kitbashService.searchKitbashes(query),
  ]);

  const lines = linesResult.data || [];

  const results: SearchResult[] = [];

  lines.forEach((line: any) => {
    results.push({
      type: 'line',
      id: line.id,
      name: line.name,
      score: calculateRelevance(query, line.name),
      metadata: line.metadata,
    });
  });

  figures.forEach((fig) => {
    results.push({
      type: 'figure',
      id: fig.id,
      name: fig.name,
      score: calculateRelevance(query, fig.name),
      metadata: fig.metadata,
    });
  });

  parts.forEach((part) => {
    results.push({
      type: 'part',
      id: part.id,
      name: part.name,
      score: calculateRelevance(query, part.name),
      metadata: part.metadata,
    });
  });

  molds.forEach((mold) => {
    results.push({
      type: 'mold',
      id: mold.id,
      name: mold.name,
      score: calculateRelevance(query, mold.name),
      metadata: mold.metadata,
    });
  });

  kitbashes.forEach((kb) => {
    results.push({
      type: 'kitbash',
      id: kb.id,
      name: kb.name,
      score: calculateRelevance(query, kb.name),
      metadata: kb.metadata,
    });
  });

  // Sort by relevance score and return top results
  return results.sort((a, b) => b.score - a.score).slice(0, 50);
}

/**
 * Search with aliases (Phase 3)
 * Looks up aliases table for alternative names
 */
export async function searchWithAliases(query: string, entityType?: string): Promise<SearchResult[]> {
  const { data: aliases, error } = await supabase
    .from('aliases')
    .select('entity_type, entity_id')
    .ilike('alias', `%${query}%`);

  if (error) {
    console.error('Error searching aliases:', error);
    return globalSearch(query);
  }

  // Get entities by ID
  const entityIds = new Map<string, Set<string>>();
  aliases?.forEach((alias: any) => {
    if (!entityIds.has(alias.entity_type)) {
      entityIds.set(alias.entity_type, new Set());
    }
    entityIds.get(alias.entity_type)!.add(alias.entity_id);
  });

  const results: SearchResult[] = [];

  // Fetch entities by type
  for (const [type, ids] of entityIds.entries()) {
    if (!entityType || entityType === type) {
      const idArray = Array.from(ids);

      if (type === 'figure') {
        for (const id of idArray) {
          const fig = await figureService.getFigureById(id);
          if (fig) {
            results.push({
              type: 'figure',
              id: fig.id,
              name: fig.name,
              score: 0.9,
              metadata: fig.metadata,
            });
          }
        }
      } else if (type === 'part' || type === 'part_definition') {
        for (const id of idArray) {
          const part = await partService.getPartById(id);
          if (part) {
            results.push({
              type: 'part',
              id: part.id,
              name: part.name,
              score: 0.9,
              metadata: part.metadata,
            });
          }
        }
      } else if (type === 'mold' || type === 'mold_family') {
        for (const id of idArray) {
          const mold = await moldService.getMoldById(id);
          if (mold) {
            results.push({
              type: 'mold',
              id: mold.id,
              name: mold.name,
              score: 0.9,
              metadata: mold.metadata,
            });
          }
        }
      }
    }
  }

  // If we found alias matches, return them; otherwise do global search
  return results.length > 0 ? results : globalSearch(query);
}

/**
 * Fuzzy matching using Fuse.js (Phase 3)
 * More intelligent matching than string similarity
 */
export async function fuzzySearch(
  query: string,
  entityType?: 'line' | 'figure' | 'part' | 'mold' | 'kitbash'
): Promise<SearchResult[]> {
  let searchData: any[] = [];

  if (!entityType || entityType === 'line') {
    const { data: lines } = await supabase.from('lines').select('*');
    searchData = searchData.concat(
      (lines || []).map((l: any) => ({
        type: 'line',
        id: l.id,
        name: l.name,
        searchText: `${l.name} ${l.publisher || ''}`,
        metadata: l.metadata,
      }))
    );
  }

  if (!entityType || entityType === 'figure') {
    const figures = await figureService.getFigures();
    searchData = searchData.concat(
      figures.map((f) => ({
        type: 'figure',
        id: f.id,
        name: f.name,
        searchText: `${f.name} ${f.line_name || ''}`,
        metadata: f.metadata,
      }))
    );
  }

  if (!entityType || entityType === 'part') {
    const parts = await partService.getParts();
    searchData = searchData.concat(
      parts.map((p) => ({
        type: 'part',
        id: p.id,
        name: p.name,
        searchText: `${p.name} ${p.part_type}`,
        metadata: p.metadata,
      }))
    );
  }

  if (!entityType || entityType === 'mold') {
    const molds = await moldService.getMolds();
    searchData = searchData.concat(
      molds.map((m) => ({
        type: 'mold',
        id: m.id,
        name: m.name,
        searchText: `${m.name} ${m.aliases.join(' ')}`,
        metadata: m.metadata,
      }))
    );
  }

  if (!entityType || entityType === 'kitbash') {
    const kitbashes = await kitbashService.getKitbashes();
    searchData = searchData.concat(
      kitbashes.map((k) => ({
        type: 'kitbash',
        id: k.id,
        name: k.name,
        searchText: `${k.name} ${k.tags.join(' ')}`,
        metadata: k.metadata,
      }))
    );
  }

  const fuse = new Fuse(searchData, {
    keys: ['name', 'searchText'],
    threshold: 0.3,
    includeScore: true,
  });

  const fuseResults = fuse.search(query);

  return fuseResults.map((result) => ({
    type: result.item.type,
    id: result.item.id,
    name: result.item.name,
    score: result.score || 0,
    metadata: result.item.metadata,
  }));
}

/**
 * Find potential duplicate entities (Phase 3)
 * Uses name similarity to suggest merges
 */
export async function findDuplicateFigures(): Promise<MatchResult[]> {
  const figures = await figureService.getFigures();
  const matches: MatchResult[] = [];

  for (let i = 0; i < figures.length; i++) {
    for (let j = i + 1; j < figures.length; j++) {
      const similarity = calculateSimilarity(figures[i].name, figures[j].name);
      if (similarity > 0.8 && figures[i].line_id === figures[j].line_id) {
        matches.push({
          primary: figures[i],
          potentialMatches: [figures[j]],
          confidence: similarity,
        });
      }
    }
  }

  return matches;
}

/**
 * Find potential duplicate molds
 */
export async function findDuplicateMolds(): Promise<MatchResult[]> {
  const molds = await moldService.getMolds();
  const matches: MatchResult[] = [];

  for (let i = 0; i < molds.length; i++) {
    const potentialMatches: typeof molds = [];

    for (let j = i + 1; j < molds.length; j++) {
      const similarity = calculateSimilarity(molds[i].name, molds[j].name);
      if (similarity > 0.75) {
        potentialMatches.push(molds[j]);
      }
    }

    if (potentialMatches.length > 0) {
      matches.push({
        primary: molds[i],
        potentialMatches,
        confidence: calculateSimilarity(molds[i].name, potentialMatches[0].name),
      });
    }
  }

  return matches;
}

/**
 * Calculate relevance score for search (0-1)
 */
function calculateRelevance(query: string, target: string): number {
  const queryLower = query.toLowerCase();
  const targetLower = target.toLowerCase();

  // Exact match
  if (queryLower === targetLower) return 1.0;

  // Starts with
  if (targetLower.startsWith(queryLower)) return 0.9;

  // Contains
  if (targetLower.includes(queryLower)) return 0.7;

  // Similarity
  return calculateSimilarity(queryLower, targetLower);
}

/**
 * Calculate string similarity (0-1)
 */
export function calculateSimilarity(a: string, b: string): number {
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;

  if (longer.length === 0) return 1.0;

  const editDistance = getEditDistance(longer.toLowerCase(), shorter.toLowerCase());
  return (longer.length - editDistance) / longer.length;
}

/**
 * Get edit distance (Levenshtein)
 */
function getEditDistance(a: string, b: string): number {
  const costs = [];
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

/**
 * Register an alias for an entity (Phase 3)
 */
export async function registerAlias(
  entityType: 'line' | 'figure' | 'part_definition' | 'mold_family' | 'part' | 'mold',
  entityId: string,
  alias: string
): Promise<boolean> {
  const normalizedType =
    entityType === 'part' ? 'part_definition' : entityType === 'mold' ? 'mold_family' : entityType;

  const { error } = await supabase.from('aliases').insert([
    {
      entity_type: normalizedType,
      entity_id: entityId,
      alias,
    },
  ]);

  if (error && error.code !== '23505') {
    // 23505 = unique constraint violation (already exists)
    console.error('Error registering alias:', error);
    throw error;
  }

  return true;
}
