import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { calculateSimilarity } from '@/services/searchService';
import { enforceRateLimit, sanitizeText, secureJson } from '@/lib/requestSecurity';

type FigureCandidate = {
  id: string;
  name: string;
  line_name?: string;
  base_buck?: string;
  score: number;
};

function normalize(input: string): string {
  return input.toLowerCase().trim().replace(/\s+/g, ' ');
}

async function findFigureCandidates(figureName: string, lineName?: string): Promise<FigureCandidate[]> {
  const normalizedFigureName = normalize(figureName);
  const { data: figures, error } = await supabase
    .from('figures')
    .select('id, name, base_buck, lines(name)')
    .ilike('name', `%${figureName}%`)
    .limit(25);

  if (error) {
    console.error('Error searching figures for figure-info:', error);
    return [];
  }

  const aliasMatches = await supabase
    .from('aliases')
    .select('entity_id')
    .eq('entity_type', 'figure')
    .ilike('alias', `%${figureName}%`)
    .limit(25);

  const aliasIdSet = new Set<string>((aliasMatches.data || []).map((row: any) => row.entity_id));

  return (figures || [])
    .map((row: any) => {
      const nameScore = calculateSimilarity(normalizedFigureName, normalize(row.name || ''));
      const lineScore =
        lineName && row.lines?.name
          ? calculateSimilarity(normalize(lineName), normalize(row.lines.name))
          : 0;
      const exactNameBoost = normalize(row.name || '') === normalizedFigureName ? 0.15 : 0;
      const aliasBoost = aliasIdSet.has(row.id) ? 0.1 : 0;
      const score = Math.min(1, nameScore * 0.75 + lineScore * 0.15 + exactNameBoost + aliasBoost);

      return {
        id: row.id,
        name: row.name,
        line_name: row.lines?.name,
        base_buck: row.base_buck,
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

export async function POST(request: NextRequest) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  try {
    const limited = enforceRateLimit(request, 'api:contributions:figure-info:post', 30, 60_000);
    if (limited) {
      return limited;
    }

    let body: any;
    try {
      body = await request.json();
      console.log('[figure-info] Request body received:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error('[figure-info] JSON parse error:', parseError);
      return secureJson({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    // Validate and sanitize inputs
    console.log('[figure-info] Validating request payload...');
    const figureName = typeof body.figureName === 'string' ? sanitizeText(body.figureName, 120) : '';
    const lineName = typeof body.lineName === 'string' ? sanitizeText(body.lineName, 120) : '';
    const baseBuck = typeof body.baseBuck === 'string' ? sanitizeText(body.baseBuck, 120) : null;
    const imageUrl = typeof body.imageUrl === 'string' ? sanitizeText(body.imageUrl, 255) : '';
    const imageViewType = typeof body.imageViewType === 'string' && ['front', 'back', 'detail'].includes(body.imageViewType)
      ? body.imageViewType
      : null;
    const notes = typeof body.notes === 'string' ? sanitizeText(body.notes, 2000) : '';
    const year = Number.isInteger(body.year) ? body.year : null;
    const submittedBy =
      typeof body.submittedBy === 'string' && body.submittedBy.trim().length > 0
        ? sanitizeText(body.submittedBy, 120)
        : 'anonymous';

    console.log('[figure-info] Sanitized inputs:', {
      figureName,
      lineName,
      baseBuck,
      imageUrl: imageUrl ? `[URL of length ${imageUrl.length}]` : '',
      imageViewType,
      notes: notes ? `[${notes.length} chars]` : '',
      year,
      submittedBy,
    });

    if (!figureName) {
      console.warn('[figure-info] Validation failed: figureName is required');
      return secureJson({ error: 'figureName is required' }, { status: 400 });
    }

    if (year !== null && (year < 1900 || year > 2100)) {
      console.warn('[figure-info] Validation failed: Invalid year value', { year });
      return secureJson({ error: 'Invalid year value' }, { status: 400 });
    }

    console.log('[figure-info] Searching for figure candidates...');
    const candidates = await findFigureCandidates(figureName, lineName || undefined);
    const best = candidates[0] || null;

    console.log('[figure-info] Candidate search result:', {
      candidatesFound: candidates.length,
      bestMatch: best ? { id: best.id, name: best.name, score: best.score } : null,
    });

    const matchedFigureId = best && best.score >= 0.72 ? best.id : null;
    const matchConfidence = best ? Number(best.score.toFixed(2)) : 0.3;

    const proposedUpdates: Record<string, unknown> = {
      year,
      line_name: lineName || null,
    };
    if (baseBuck) {
      proposedUpdates.base_buck = baseBuck;
    }

    const needsBaseBuckCorrection =
      !!best?.base_buck && !!baseBuck && normalize(best.base_buck) !== normalize(baseBuck);

    const claimPayload = {
      entity_type: 'figure',
      entity_id: matchedFigureId || crypto.randomUUID(),
      claim_type: 'figure_info_submission',
      data: {
        submission: {
          figure_name: figureName,
          line_name: lineName || null,
          base_buck: baseBuck,
          year,
          image_url: imageUrl || null,
          image_view_type: imageViewType,
          notes: notes || null,
          submitted_by: submittedBy,
        },
        matching: {
          matched_figure_id: matchedFigureId,
          confidence: matchConfidence,
          top_candidates: candidates,
        },
        proposed_updates: proposedUpdates,
        moderation: {
          action_hint: matchedFigureId ? 'apply_updates_to_existing_figure' : 'create_new_figure_candidate',
          needs_base_buck_correction: needsBaseBuckCorrection,
        },
      },
      source: imageUrl || null,
      confidence: Math.max(0.2, Math.min(1, matchConfidence)),
    };

    console.log('[figure-info] Prepared claim payload:', JSON.stringify(claimPayload, null, 2));

    console.log('[figure-info] Inserting claim into Supabase...');
    const { data: claim, error: insertError, status: insertStatus } = await supabase
      .from('claims')
      .insert([claimPayload])
      .select('*')
      .single();

    console.log('[figure-info] Supabase insert response:', {
      status: insertStatus,
      hasError: !!insertError,
      hasData: !!claim,
      errorCode: insertError?.code,
      errorMessage: insertError?.message,
      errorDetails: insertError?.details,
      claimId: claim?.id,
    });

    if (insertError) {
      console.error('[figure-info] Supabase insert error - Full details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: (insertError as any).hint,
        statusCode: insertStatus,
      });

      // In development, return actual Supabase error; in production, return generic message
      const errorMessage = isDevelopment
        ? `Failed to submit figure info: ${insertError.message}${insertError.details ? ` (${insertError.details})` : ''}`
        : 'Failed to submit figure info. Ensure claims INSERT policy is enabled.';

      return secureJson({ error: errorMessage }, { status: 500 });
    }

    console.log('[figure-info] Claim inserted successfully:', {
      claimId: claim?.id,
      entityId: claim?.entity_id,
      claimType: claim?.claim_type,
    });

    return secureJson(
      {
        success: true,
        claim,
        matching: {
          matchedFigureId,
          confidence: matchConfidence,
          topCandidates: candidates,
          needsBaseBuckCorrection: needsBaseBuckCorrection,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[figure-info] Unexpected error in POST handler:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error,
    });

    const errorMessage = isDevelopment
      ? `Server error: ${error instanceof Error ? error.message : String(error)}`
      : 'Failed to process figure info upload';

    return secureJson({ error: errorMessage }, { status: 500 });
  }
}
