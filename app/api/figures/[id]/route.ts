/**
 * Figures API Routes for [id]
 * GET /api/figures/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import * as figureService from '@/services/figureService';
import { supabase } from '@/lib/supabaseClient';
import { enforceRateLimit, isValidUuid, secureJson } from '@/lib/requestSecurity';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const limited = enforceRateLimit(request, 'api:figures:id:get', 120, 60_000);
    if (limited) {
      return limited;
    }

    if (!isValidUuid(params.id)) {
      return secureJson({ error: 'Invalid figure id' }, { status: 400 });
    }

    const figure = await figureService.getFigureById(params.id);
    if (!figure) {
      return secureJson({ error: 'Figure not found' }, { status: 404 });
    }

    const { data: figurePartRows, error: partsError } = await supabase
      .from('figure_parts')
      .select('slot_label, is_primary, notes, part_definitions(*)')
      .eq('figure_id', params.id)
      .order('slot_label', { ascending: true });

    if (partsError) {
      console.error('Error fetching figure parts:', partsError);
      return secureJson({ error: 'Failed to fetch figure parts' }, { status: 500 });
    }

    const parts = (figurePartRows || [])
      .map((row: any) => ({
        ...(row.part_definitions || {}),
        slot_label: row.slot_label,
        is_primary: row.is_primary,
        notes: row.notes,
      }))
      .filter((p) => p.id);

    return secureJson({ figure, parts });
  } catch (error) {
    console.error('Error in GET /api/figures/[id]:', error);
    return secureJson(
      { error: 'Failed to fetch figure' },
      { status: 500 }
    );
  }
}
