/**
 * Result Card Component
 * Displays search results
 */

import Link from 'next/link';
import type { SearchResult } from '@/lib/types';

interface ResultCardProps {
  result: SearchResult;
  onClick?: () => void;
}

const typeColors: Record<string, string> = {
  line: 'bg-slate-100 text-slate-800',
  figure: 'bg-blue-100 text-blue-800',
  part: 'bg-green-100 text-green-800',
  mold: 'bg-purple-100 text-purple-800',
  kitbash: 'bg-orange-100 text-orange-800',
};

const typeIcons: Record<string, string> = {
  line: '📚',
  figure: '🤖',
  part: '🔧',
  mold: '🎨',
  kitbash: '✨',
};

export default function ResultCard({ result, onClick }: ResultCardProps) {
  const color = typeColors[result.type] || 'bg-gray-100 text-gray-800';
  const icon = typeIcons[result.type] || '•';
  const score = Math.round(result.score * 100);

  const href =
    result.type === 'line'
      ? `/lines/${result.id}`
      : result.type === 'figure'
      ? `/figures/${result.id}`
      : result.type === 'kitbash'
        ? `/kitbashes/${result.id}`
        : result.type === 'mold'
          ? `/molds/${result.id}`
          : `/parts/${result.id}`;

  return (
    <Link href={href} onClick={onClick}>
      <div className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-400 transition cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${color}`}>
                {icon} {result.type.toUpperCase()}
              </span>
              {score > 0 && (
                <span className="text-xs text-gray-500">
                  {score}% match
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {result.name}
            </h3>
            {result.metadata && (
              <p className="text-sm text-gray-600 mt-1">
                {JSON.stringify(result.metadata).substring(0, 80)}...
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
