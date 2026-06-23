/**
 * Search API Route
 * GET /api/search?q=query&type=figure|part|mold|kitbash
 */

import { NextRequest, NextResponse } from 'next/server';
import * as searchService from '@/services/searchService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const typeParam = searchParams.get('type');
    const type =
      typeParam === 'figure' ||
      typeParam === 'part' ||
      typeParam === 'mold' ||
      typeParam === 'kitbash' ||
      typeParam === 'line'
        ? typeParam
        : undefined;
    const method = searchParams.get('method') || 'global'; // global, fuzzy, alias

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Query too short' },
        { status: 400 }
      );
    }

    let results;

    switch (method) {
      case 'fuzzy':
        results = await searchService.fuzzySearch(query, type);
        break;
      case 'alias':
        results = await searchService.searchWithAliases(query, type);
        break;
      default:
        results = await searchService.globalSearch(query);
    }

    return NextResponse.json({
      query,
      method,
      resultCount: results.length,
      results,
    });
  } catch (error) {
    console.error('Error in GET /api/search:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
