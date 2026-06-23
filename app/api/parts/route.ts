import { NextRequest } from 'next/server';
import * as partService from '@/services/partService';
import {
  enforceRateLimit,
  isValidUuid,
  sanitizeText,
  secureJson,
} from '@/lib/requestSecurity';

export async function GET(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, 'api:parts:get', 120, 60_000);
    if (limited) {
      return limited;
    }

    const { searchParams } = new URL(request.url);
    const figureId = searchParams.get('figureId');
    const partType = searchParams.get('type');
    const queryRaw = searchParams.get('q');
    const query = queryRaw ? sanitizeText(queryRaw, 100) : '';

    if (figureId) {
      if (!isValidUuid(figureId)) {
        return secureJson({ error: 'Invalid figureId' }, { status: 400 });
      }

      const parts = await partService.getPartsByFigure(figureId);
      return secureJson(parts);
    }

    if (query.length >= 2) {
      const parts = await partService.searchParts(query, partType || undefined);
      return secureJson(parts);
    }

    const parts = await partService.getParts(partType || undefined);
    return secureJson(parts);
  } catch (error) {
    console.error('Error in GET /api/parts:', error);
    return secureJson({ error: 'Failed to fetch parts' }, { status: 500 });
  }
}
