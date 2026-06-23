# Quick Reference Card

Copy & paste these common operations.

## Fetch Data (Server Component)

```typescript
import * as figureService from '@/services/figureService';

// Get all figures
const figures = await figureService.getFigures();

// Get figures by line with pagination
const { figures, total, pages } = await figureService.getFiguresByLine(
  'Marvel Legends',
  1,
  20
);

// Search figures
const results = await figureService.searchFigures('Spider');

// Get single figure
const figure = await figureService.getFigureById('uuid-here');
```

## Search (Phase 3)

```typescript
import * as searchService from '@/services/searchService';

// Global search (all entity types)
const allResults = await searchService.globalSearch('Vulcan');

// Fuzzy search (intelligent matching)
const moldMatches = await searchService.fuzzySearch('valcan', 'mold');

// Search with aliases
const aliasResults = await searchService.searchWithAliases('ML Vulcan');

// Find duplicates
const figureDupes = await searchService.findDuplicateFigures();
const moldDupes = await searchService.findDuplicateMolds();

// Register an alias
await searchService.registerAlias('mold', 'mold-uuid', 'Vulcan');
```

## Create Data (Server Action or API)

```typescript
// Create figure
const newFigure = await figureService.createFigure({
  name: 'Spider-Man',
  line: 'Marvel Legends',
  year: 2012,
  metadata: { character: 'Spider-Man' }
});

// Create kitbash
const newKitbash = await kitbashService.createKitbash({
  name: 'Custom Spider-Man',
  parts: [
    { part_id: 'head-uuid', position: 'head' },
    { part_id: 'torso-uuid', position: 'torso' }
  ],
  image_url: 'https://cdn.example.com/image.jpg',
  tags: ['spider-man', 'custom'],
  creator: 'user123'
});

// Create mold
const newMold = await moldService.createMold({
  name: 'Vulcan Buck',
  aliases: ['Vulcan', 'Standard ML'],
  confidence_score: 0.95
});
```

## Update Data

```typescript
// Update figure
await figureService.updateFigure('figure-uuid', {
  year: 2013,
  metadata: { updated: true }
});

// Add tag to kitbash
await kitbashService.addKitbashTag('kitbash-uuid', 'custom-paint');

// Add alias to mold
await moldService.addMoldAlias('mold-uuid', 'New Alias Name');
```

## Upload Image

```typescript
import { uploadToR2 } from '@/lib/r2';

const result = await uploadToR2({
  file: imageFile, // File object from input
  prefix: 'kitbashes',
  type: 'image'
});

if (result.success) {
  const imageUrl = result.url;
  // Save to kitbash
} else {
  console.error(result.error);
}
```

## Fetch via API (Frontend)

```typescript
// Search
const response = await fetch(
  `/api/search?q=Vulcan&method=fuzzy&type=mold`
);
const data = await response.json();

// Get figures
const figResponse = await fetch('/api/figures?line=Marvel');
const figures = await figResponse.json();

// Create figure
const createResponse = await fetch('/api/figures', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'New Figure',
    line: 'Marvel Legends'
  })
});
```

## React Component Patterns

**Server Component (async):**
```typescript
import * as figureService from '@/services/figureService';

export default async function FigureList() {
  const figures = await figureService.getFigures();

  return (
    <div>
      {figures.map((fig) => (
        <div key={fig.id}>{fig.name}</div>
      ))}
    </div>
  );
}
```

**Client Component (with state):**
```typescript
'use client';
import { useState } from 'react';
import SearchInput from '@/components/SearchInput';

export default function SearchPage() {
  const [results, setResults] = useState([]);

  const handleSearch = async (query: string) => {
    const response = await fetch(
      `/api/search?q=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    setResults(data.results);
  };

  return (
    <div>
      <SearchInput onSearch={handleSearch} />
      {results.map((r) => (
        <ResultCard key={`${r.type}-${r.id}`} result={r} />
      ))}
    </div>
  );
}
```

## Common Utilities

```typescript
import {
  debounce,
  throttle,
  formatDate,
  slugify,
  isEmpty,
  deepClone
} from '@/lib/utils';

// Debounce search
const debouncedSearch = debounce((query: string) => {
  // perform search
}, 300);

// Format date
const formatted = formatDate(new Date());

// Convert to URL slug
const slug = slugify('My Awesome Kitbash');
```

## Part Compatibility (Phase 2) - NEW!

```typescript
import * as compatService from '@/services/partCompatibilityService';

// Check compatibility between two parts
const compat = await compatService.getCompatibility(part1Id, part2Id);

// Get all parts that fit with a specific part (green = direct swap)
const greenSwaps = await compatService.getCompatibleParts(partId, 'green');
const minorMods = await compatService.getCompatibleParts(partId, 'yellow');

// Find best fitting parts (sorted by compatibility level, then confidence)
const bestFits = await compatService.findBestFits(partId);

// Register a compatibility relationship
await compatService.createCompatibility({
  source_part_id: 'head-1',
  target_part_id: 'torso-1',
  compatibility_level: 'green', // 'green' | 'yellow' | 'red'
  notes: 'Both use standard ball joints',
  confidence: 0.95
});

// Update with modification info (for yellow level)
await compatService.recordModification(
  compatibilityId,
  'shave ball joint', // modification needed
  'Socket is slightly tight'
);

// Verify an entire kitbash build
const check = await compatService.checkMultipleCompatibilities([part1, part2, part3]);
// Returns: { compatible, minorMods, incompatible, unknown }

// Get compatibility statistics
const stats = await compatService.getCompatibilityStats();
// Returns: { total, green, yellow, red, averageConfidence }
```

**Compatibility Levels:**
- 🟢 **Green** — Direct swap, no modification
- 🟡 **Yellow** — Minor modification needed (shave, sand, nail polish)
- 🔴 **Red** — Not compatible or extreme modification needed

## Commands

```bash
npm run dev              # Start development server
npm run type-check       # Find TypeScript errors
npm run lint             # Find code style issues
npm run build            # Build for production
npm run supabase:generate-types  # Update types from schema
```

---

**Save this for quick lookups while coding!**
