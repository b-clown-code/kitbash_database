/**
 * Figures API Routes for [id]
 * GET /api/figures/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import * as figureService from '@/services/figureService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const figure = await figureService.getFigureById(params.id);
    if (!figure) {
      return NextResponse.json({ error: 'Figure not found' }, { status: 404 });
    }
    return NextResponse.json(figure);
  } catch (error) {
    console.error('Error in GET /api/figures/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch figure' },
      { status: 500 }
    );
  }
}
