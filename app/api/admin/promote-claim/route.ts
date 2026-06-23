import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import {
  enforceRateLimit,
  isValidUuid,
  sanitizeText,
  secureJson,
} from '@/lib/requestSecurity';

export async function POST(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, 'api:admin:promote-claim', 10, 60_000);
    if (limited) {
      return limited;
    }

    const adminToken = process.env.ADMIN_API_TOKEN;
    if (!adminToken) {
      return secureJson(
        { error: 'Admin operations disabled' },
        { status: 503 }
      );
    }

    const providedToken = request.headers.get('x-admin-token');
    if (!providedToken || providedToken !== adminToken) {
      return secureJson({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const claimId = typeof body.claimId === 'string' ? body.claimId : '';
    const confidence = typeof body.confidence === 'number' ? Math.min(1, Math.max(0, body.confidence)) : 0.9;

    if (!isValidUuid(claimId)) {
      return secureJson({ error: 'Invalid claimId' }, { status: 400 });
    }

    const { data: claimRows, error: claimError } = await supabase
      .from('claims')
      .select('*')
      .eq('id', claimId)
      .single();

    if (claimError || !claimRows) {
      return secureJson({ error: 'Claim not found' }, { status: 404 });
    }

    const claim = claimRows as any;
    if (claim.entity_type !== 'compatibility') {
      return secureJson(
        { error: 'Only compatibility claims can be promoted' },
        { status: 400 }
      );
    }

    const claimData = claim.data || {};
    const sourcePartId = claimData.source_part_definition_id;
    const targetPartId = claimData.target_part_definition_id;
    const level = claimData.compatibility_level;
    const notes = claimData.notes;
    const submittedBy = claimData.submitted_by;
    const modType = claimData.modification_type;

    if (!sourcePartId || !targetPartId || !level) {
      return secureJson(
        { error: 'Claim missing required compatibility fields' },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from('part_compatibility')
      .select('id')
      .eq('source_part_definition_id', sourcePartId)
      .eq('target_part_definition_id', targetPartId)
      .single();

    if (existing) {
      return secureJson(
        { error: 'Compatibility edge already exists' },
        { status: 409 }
      );
    }

    const { data: compatData, error: compatError } = await supabase
      .from('part_compatibility')
      .insert([
        {
          source_part_definition_id: sourcePartId,
          target_part_definition_id: targetPartId,
          compatibility_level: level,
          notes,
          modification_type: modType,
          confidence,
          submitted_by: submittedBy,
        },
      ])
      .select('*')
      .single();

    if (compatError) {
      console.error('Error promoting claim:', compatError);
      return secureJson(
        { error: 'Failed to promote claim' },
        { status: 500 }
      );
    }

    return secureJson(
      { success: true, compatibility: compatData, claimId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/admin/promote-claim:', error);
    return secureJson({ error: 'Failed to promote claim' }, { status: 500 });
  }
}
