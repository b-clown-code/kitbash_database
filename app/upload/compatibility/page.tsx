"use client";

import { FormEvent, useState } from 'react';

export default function UploadCompatibilityPage() {
  const [sourceFigureId, setSourceFigureId] = useState('');
  const [sourcePartId, setSourcePartId] = useState('');
  const [targetFigureId, setTargetFigureId] = useState('');
  const [targetPartId, setTargetPartId] = useState('');
  const [compatibilityLevel, setCompatibilityLevel] = useState<'green' | 'yellow' | 'red'>('green');
  const [notes, setNotes] = useState('');
  const [submittedBy, setSubmittedBy] = useState('');
  const [source, setSource] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!sourcePartId || !targetPartId) {
      setError('Source and target part IDs are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceFigureId: sourceFigureId || null,
          sourcePartId,
          targetFigureId: targetFigureId || null,
          targetPartId,
          compatibilityLevel,
          notes,
          submittedBy,
          source,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Submission failed');
        return;
      }

      setMessage('Compatibility claim submitted successfully.');
      setNotes('');
      setSource('');
    } catch {
      setError('Network error while submitting claim');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <section>
        <h2 className="text-3xl font-bold mb-2">Report Part Compatibility</h2>
        <p className="text-gray-600 space-y-2">
          <div>Tell us which parts fit together and how well.</div>
          <div className="text-sm">Example: "I swapped a Spider-Man ML20 head onto a Vulcan body and it fit perfectly."</div>
        </p>
      </section>

      <form onSubmit={onSubmit} className="space-y-6 p-6 bg-white border rounded-lg shadow-sm">
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
          <h3 className="font-semibold text-sm text-blue-900 mb-2">How to fill this out:</h3>
          <ul className="text-sm text-blue-900 space-y-1 list-disc list-inside">
            <li>Find part UUIDs by searching on the site (click a part to see its ID)</li>
            <li>Fill at least the two part fields (FROM and TO)</li>
            <li>Figures are optional—only add if you used this swap</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Part Swap Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sourcePartId" className="block text-sm font-medium mb-1">
                Part You're Swapping FROM <span className="text-red-600">*</span>
              </label>
              <input
                id="sourcePartId"
                required
                value={sourcePartId}
                onChange={(e) => setSourcePartId(e.target.value)}
                placeholder="e.g., Spider-Man ML20 head UUID"
                className="w-full px-3 py-2 border rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">The part you took OFF another figure</p>
            </div>

            <div>
              <label htmlFor="targetPartId" className="block text-sm font-medium mb-1">
                Part You're Swapping TO <span className="text-red-600">*</span>
              </label>
              <input
                id="targetPartId"
                required
                value={targetPartId}
                onChange={(e) => setTargetPartId(e.target.value)}
                placeholder="e.g., Vulcan body torso UUID"
                className="w-full px-3 py-2 border rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">The part you put it ON</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Where did this swap happen? (optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sourceFigureId" className="block text-sm font-medium mb-1">
                Original Figure ID
              </label>
              <input
                id="sourceFigureId"
                value={sourceFigureId}
                onChange={(e) => setSourceFigureId(e.target.value)}
                placeholder="UUID of the figure you took FROM"
                className="w-full px-3 py-2 border rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">The figure that originally had the swapped part</p>
            </div>

            <div>
              <label htmlFor="targetFigureId" className="block text-sm font-medium mb-1">
                Receiving Figure ID
              </label>
              <input
                id="targetFigureId"
                value={targetFigureId}
                onChange={(e) => setTargetFigureId(e.target.value)}
                placeholder="UUID of the figure you put it ON"
                className="w-full px-3 py-2 border rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">The figure that received the swapped part</p>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="compatibilityLevel" className="block text-sm font-medium mb-1">
            How well did it fit?
          </label>
          <select
            id="compatibilityLevel"
            value={compatibilityLevel}
            onChange={(e) => setCompatibilityLevel(e.target.value as 'green' | 'yellow' | 'red')}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="green">🟢 Green - Direct swap, no modifications needed</option>
            <option value="yellow">🟡 Yellow - Fit with minor modifications (paint, sanding, pegs, etc.)</option>
            <option value="red">🔴 Red - Incompatible, doesn't fit well</option>
          </select>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-1">
            What did you do to make it fit? (optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="How did you test this fit? Any modifications?"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="submittedBy" className="block text-sm font-medium mb-1">
              Your Name / Username (optional)
            </label>
            <input
              id="submittedBy"
              value={submittedBy}
              onChange={(e) => setSubmittedBy(e.target.value)}
              placeholder="anonymous"
              className="w-full px-3 py-2 border rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">So we can credit your discovery</p>
          </div>

          <div>
            <label htmlFor="source" className="block text-sm font-medium mb-1">
              Video / Photo Link (optional)
            </label>
            <input
              id="source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="YouTube, TikTok, or image URL"
              className="w-full px-3 py-2 border rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">Link to proof of the swap</p>
          </div>
        </div>

        {error ? <p className="text-red-700 text-sm">{error}</p> : null}
        {message ? <p className="text-green-700 text-sm">{message}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-60"
        >
          {submitting ? 'Submitting...' : 'Submit Compatibility Claim'}
        </button>
      </form>
    </div>
  );
}
