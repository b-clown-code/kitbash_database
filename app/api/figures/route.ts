/**
 * Figures API Routes
 * GET /api/figures
 * POST /api/figures
 */

import { NextRequest, NextResponse } from 'next/server';
import * as figureService from '@/services/figureService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const line = searchParams.get('line');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // Get figures list
    if (line) {
      const result = await figureService.getFiguresByLine(line, page, pageSize);
      return NextResponse.json(result);
    }

    const figures = await figureService.getFigures();
    return NextResponse.json(figures);
  } catch (error) {
    console.error('Error in GET /api/figures:', error);
    return NextResponse.json(
      { error: 'Failed to fetch figures' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const figure = await figureService.createFigure(body);

    if (!figure) {
      return NextResponse.json(
        { error: 'Failed to create figure' },
        { status: 400 }
      );
    }

    return NextResponse.json(figure, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/figures:', error);
    return NextResponse.json(
      { error: 'Failed to create figure' },
      { status: 500 }
    );
  }
}
