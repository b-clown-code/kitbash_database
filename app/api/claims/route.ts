import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import {
  enforceRateLimit,
  isValidUuid,
  sanitizeText,
  secureJson,
} from '@/lib/requestSecurity';

type CompatibilityLevel = 'green' | 'yellow' | 'red';

function isCompatibilityLevel(level: string): level is CompatibilityLevel {
  return level === 'green' || level === 'yellow' || level === 'red';
}

export async function POST(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, 'api:claims:post', 20, 60_000);
    if (limited) {
      return limited;
    }

    const body = await request.json();

    const sourcePartId = typeof body.sourcePartId === 'string' ? body.sourcePartId : '';
    const targetPartId = typeof body.targetPartId === 'string' ? body.targetPartId : '';
    const sourceFigureId = typeof body.sourceFigureId === 'string' ? body.sourceFigureId : null;
    const targetFigureId = typeof body.targetFigureId === 'string' ? body.targetFigureId : null;
    const compatibilityLevel = typeof body.compatibilityLevel === 'string' ? body.compatibilityLevel : '';
    const notes = typeof body.notes === 'string' ? sanitizeText(body.notes, 2000) : '';
    const submittedBy = typeof body.submittedBy === 'string' ? sanitizeText(body.submittedBy, 120) : 'anonymous';
    const source = typeof body.source === 'string' ? sanitizeText(body.source, 255) : null;

    if (!isValidUuid(sourcePartId) || !isValidUuid(targetPartId)) {
      return secureJson(
        { error: 'sourcePartId and targetPartId must be valid UUIDs' },
        { status: 400 }
      );
    }

    if (sourceFigureId && !isValidUuid(sourceFigureId)) {
      return secureJson({ error: 'Invalid sourceFigureId' }, { status: 400 });
    }

    if (targetFigureId && !isValidUuid(targetFigureId)) {
      return secureJson({ error: 'Invalid targetFigureId' }, { status: 400 });
    }

    if (!isCompatibilityLevel(compatibilityLevel)) {
      return secureJson({ error: 'Invalid compatibilityLevel' }, { status: 400 });
    }

    if (sourcePartId === targetPartId) {
      return secureJson(
        { error: 'Source and target part cannot be the same' },
        { status: 400 }
      );
    }

    const claimPayload = {
      entity_type: 'compatibility',
      entity_id: sourcePartId,
      claim_type: 'compatibility_submission',
      data: {
        source_part_definition_id: sourcePartId,
        target_part_definition_id: targetPartId,
        source_figure_id: sourceFigureId,
        target_figure_id: targetFigureId,
        compatibility_level: compatibilityLevel,
        notes,
        submitted_by: submittedBy,
      },
      source,
      confidence: 0.8,
    };

    const { data, error } = await supabase
      .from('claims')
      .insert([claimPayload])
      .select('*')
      .single();

    if (error) {
      console.error('Error creating claim:', error);
      return secureJson(
        { error: 'Failed to submit claim. Ensure latest RLS migration is applied.' },
        { status: 500 }
      );
    }

    return secureJson({ success: true, claim: data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/claims:', error);
    return secureJson({ error: 'Failed to submit claim' }, { status: 500 });
  }
}
