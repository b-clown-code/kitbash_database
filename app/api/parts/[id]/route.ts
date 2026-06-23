import { NextRequest } from 'next/server';
import * as partService from '@/services/partService';
import { supabase } from '@/lib/supabaseClient';
import { enforceRateLimit, isValidUuid, secureJson } from '@/lib/requestSecurity';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const limited = enforceRateLimit(request, 'api:parts:id:get', 120, 60_000);
    if (limited) {
      return limited;
    }

    if (!isValidUuid(params.id)) {
      return secureJson({ error: 'Invalid part id' }, { status: 400 });
    }

    const part = await partService.getPartById(params.id);
    if (!part) {
      return secureJson({ error: 'Part not found' }, { status: 404 });
    }

    const [{ data: usedByRows, error: usedByError }, { data: outgoingRows, error: outgoingError }, { data: incomingRows, error: incomingError }] = await Promise.all([
      supabase
        .from('figure_parts')
        .select('slot_label, is_primary, notes, figures(id, name, year, line_id, lines(name))')
        .eq('part_definition_id', params.id),
      supabase
        .from('part_compatibility')
        .select('id, compatibility_level, notes, modification_type, confidence, submitted_by, source_part_definition_id, target_part_definition_id, target:part_definitions!target_part_definition_id(id, name, slug, part_type)')
        .eq('source_part_definition_id', params.id),
      supabase
        .from('part_compatibility')
        .select('id, compatibility_level, notes, modification_type, confidence, submitted_by, source_part_definition_id, target_part_definition_id, source:part_definitions!source_part_definition_id(id, name, slug, part_type)')
        .eq('target_part_definition_id', params.id),
    ]);

    if (usedByError || outgoingError || incomingError) {
      console.error('Error fetching part graph data:', {
        usedByError,
        outgoingError,
        incomingError,
      });
      return secureJson({ error: 'Failed to fetch part details' }, { status: 500 });
    }

    return secureJson({
      part,
      usedByFigures: usedByRows || [],
      compatibleWith: outgoingRows || [],
      usedAsTargetBy: incomingRows || [],
    });
  } catch (error) {
    console.error('Error in GET /api/parts/[id]:', error);
    return secureJson({ error: 'Failed to fetch part details' }, { status: 500 });
  }
}
