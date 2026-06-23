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
    const limited = enforceRateLimit(request, 'api:compatibility:quick-add', 30, 60_000);
    if (limited) {
      return limited;
    }

    const body = await request.json();
    const figure1Id = typeof body.figure1Id === 'string' ? body.figure1Id : '';
    const figure2Id = typeof body.figure2Id === 'string' ? body.figure2Id : '';
    const part1Id = typeof body.part1Id === 'string' ? body.part1Id : '';
    const part2Id = typeof body.part2Id === 'string' ? body.part2Id : '';
    const level = typeof body.level === 'string' ? body.level : 'green';
    const notes = typeof body.notes === 'string' ? sanitizeText(body.notes, 500) : '';
    const submittedBy = typeof body.submittedBy === 'string' ? sanitizeText(body.submittedBy, 120) : 'anonymous';

    if (!isValidUuid(figure1Id) || !isValidUuid(figure2Id) || !isValidUuid(part1Id) || !isValidUuid(part2Id)) {
      return secureJson(
        { error: 'All IDs must be valid UUIDs' },
        { status: 400 }
      );
    }

    if (!['green', 'yellow', 'red'].includes(level)) {
      return secureJson(
        { error: 'Invalid compatibility level' },
        { status: 400 }
      );
    }

    const claimPayload = {
      entity_type: 'compatibility',
      entity_id: part1Id,
      claim_type: 'compatibility_from_figures',
      data: {
        source_part_definition_id: part1Id,
        target_part_definition_id: part2Id,
        source_figure_id: figure1Id,
        target_figure_id: figure2Id,
        compatibility_level: level,
        notes: `From figures: "${notes}"`,
        submitted_by: submittedBy,
        context: 'figure-pair-comparison',
      },
      source: 'ui-quick-add',
      confidence: 0.85,
    };

    const { data, error } = await supabase
      .from('claims')
      .insert([claimPayload])
      .select('*')
      .single();

    if (error) {
      console.error('Error creating quick-add claim:', error);
      return secureJson(
        { error: 'Failed to submit. Ensure latest RLS migration is applied.' },
        { status: 500 }
      );
    }

    return secureJson({ success: true, claim: data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/compatibility/quick-add:', error);
    return secureJson({ error: 'Failed to add compatibility' }, { status: 500 });
  }
}
