/**
 * API Route: Nightly Graph Integrity Sweep
 * POST /api/admin/nightly-graph-sweep
 *
 * Comprehensive validation and reconciliation of the entire relational graph:
 * - Figures, parts, relationships
 * - Compatibility graph
 * - Kitbashes, aliases
 *
 * Requires ADMIN_API_TOKEN for security
 * Called nightly by GitHub Actions
 */

import { NextRequest, NextResponse } from 'next/server';
import { runGraphIntegritySweep } from '@/lib/graphIntegritySweep';
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

    // Run comprehensive graph integrity sweep
    const report = await runGraphIntegritySweep();

    return secureJson(
      {
        success: true,
        message: `Graph integrity sweep complete. ${report.totalIssuesFound} issues found, ${report.totalFixesApplied} fixes applied.`,
        report,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Graph integrity sweep error:', error);
    return secureJson(
      {
        error: error instanceof Error ? error.message : 'Sweep failed',
      },
      { status: 500 }
    );
  }
}
