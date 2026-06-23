/**
 * API Route: Detect and update base_buck for all figures
 * POST /api/admin/detect-bucks
 * 
 * Requires ADMIN_API_TOKEN for security
 * Called nightly by GitHub Actions
 */

import { NextRequest, NextResponse } from 'next/server';
import { detectAndUpdateAllBucks } from '@/lib/buckDetection';
import { secureJson } from '@/lib/requestSecurity';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify admin token
    const adminToken = process.env.ADMIN_API_TOKEN;
    if (!adminToken) {
      return secureJson({ error: 'Admin token not configured' }, { status: 503 });
    }

    const providedToken = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!providedToken || providedToken !== adminToken) {
      return secureJson({ error: 'Unauthorized' }, { status: 401 });
    }

    // Run detection
    const results = await detectAndUpdateAllBucks();

    const changedCount = results.filter((r) => r.changed).length;

    return secureJson(
      {
        success: true,
        message: `Buck detection complete. ${changedCount}/${results.length} figures updated.`,
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Buck detection error:', error);
    return secureJson(
      {
        error: error instanceof Error ? error.message : 'Detection failed',
      },
      { status: 500 }
    );
  }
}
