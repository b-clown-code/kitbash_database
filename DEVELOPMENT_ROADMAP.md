# Development Roadmap

After setup is complete, here's how to build out Phase 2-3 features.

## What You Have Now (Phase 1 ✅)

- ✅ Database schema
- ✅ Service layer (CRUD for all entities)
- ✅ API routes (basic endpoints)
- ✅ Search system with fuzzy matching
- ✅ Type safety throughout

## Phase 2: Graph Features (Implement This Next)

### Task 1: Part Compatibility System ✅ (Backend Complete)
**Backend**: `services/partCompatibilityService.ts` - DONE
**Database**: `part_compatibility` table - DONE

The compatibility system is fully implemented with three categories:
- **Green (🟢)** — Direct swap, no modification
- **Yellow (🟡)** — Minor modification (shaving, sanding, nail polish)
- **Red (🔴)** — Not compatible or extreme modification needed

**Available functions:**
```typescript
import * as compatService from '@/services/partCompatibilityService';

// Check if two parts are compatible
const compat = await compatService.getCompatibility(sourcePart, targetPart);

// Get all compatible parts for a part
const fits = await compatService.getCompatibleParts(partId, 'green');

// Find best fitting parts (sorted by compatibility)
const best = await compatService.findBestFits(partId);

// Verify entire kitbash build
const check = await compatService.checkMultipleCompatibilities([part1, part2, part3]);

// Get compatibility stats
const stats = await compatService.getCompatibilityStats();
```

**UI to build (Phase 2):**
1. Compatibility matrix view - Show parts and their compatibility levels
2. Part detail page - Show what parts fit with this part
3. Kitbash validator - Check if all parts in a kitbash are compatible
4. Compatibility editor - Add/update compatibility relationships

### Task 2: Figure Browser Page
**File**: `app/browse/figures/page.tsx`

```typescript
'use client';
import { useEffect, useState } from 'react';
import * as figureService from '@/services/figureService';

export default function BrowseFigures() {
  const [figures, setFigures] = useState([]);
  const [line, setLine] = useState<string | null>(null);

  // TODO: Render figures in grid
  // TODO: Filter by line dropdown
  // TODO: Pagination
}
```

**What to do:**
1. Create page file
2. Add dropdown for figure lines (use `getAvailableLines()`)
3. Display figures in a grid using `ResultCard` component
4. Add pagination (use `getFiguresByLine()`)

### Task 2: Figure Detail Page
**File**: `app/figures/[id]/page.tsx`

```typescript
export default function FigureDetail({ params }) {
  // TODO: Get figure by ID
  // TODO: Show parts from this figure
  // TODO: Show kitbashes using this figure
}
```

### Task 3: Kitbash Browser Page
**File**: `app/browse/kitbashes/page.tsx`

Similar to figures, but use:
- `getKitbashesWithPagination()`
- Filter by tags
- Display with images

### Task 4: Kitbash Detail Page
**File**: `app/kitbashes/[id]/page.tsx`

Show:
- Kitbash image
- Parts list
- Creator info
- Tags

### Task 5: Kitbash Creator (Most Important for Phase 2!)
**File**: `app/create/page.tsx`

This is the core feature:

```typescript
'use client';
import { useState } from 'react';
import * as kitbashService from '@/services/kitbashService';
import { uploadToR2 } from '@/lib/r2';

export default function CreateKitbash() {
  const [name, setName] = useState('');
  const [parts, setParts] = useState([]);
  const [image, setImage] = useState<File | null>(null);

  const handleSubmit = async (e) => {
    // 1. Upload image to R2
    const imageUrl = await uploadToR2({ file: image });
    
    // 2. Create kitbash with URL
    const kb = await kitbashService.createKitbash({
      name,
      parts,
      image_url: imageUrl.url,
      tags: []
    });
    
    // 3. Redirect to detail page
  };

  return (
    // Form with:
    // - Name input
    // - Part selector (search parts, add to list)
    // - Image upload
    // - Tag input
    // - Submit button
  );
}
```

## Phase 3: Matching System (Already Implemented!)

The hard work is done in `services/searchService.ts`:

### Available Functions

```typescript
// Fuzzy search
const results = await searchService.fuzzySearch('valcan', 'mold');

// Find duplicate figures
const dupes = await searchService.findDuplicateFigures();

// Find duplicate molds
const moldDupes = await searchService.findDuplicateMolds();

// Register alias for fuzzy matching
await searchService.registerAlias('mold', 'mold-id', 'Vulcan');
```

### Build UI for This

**File**: `app/admin/duplicates/page.tsx`

```typescript
export default function DuplicatesPage() {
  const [duplicates, setDuplicates] = useState([]);

  useEffect(() => {
    searchService.findDuplicateFigures().then(setDuplicates);
  }, []);

  // Show potential duplicates
  // Let user click "Merge" or "Confirm Similar"
  // Store result in claims table
}
```

## Implementation Order (Recommended)

1. ✅ **Phase 1** — Already done!
2. 📍 **Phase 2.1** — Figure browser page
3. 📍 **Phase 2.2** — Kitbash creator form
4. 📍 **Phase 2.3** — Detail pages for figures/kitbashes
5. 📍 **Phase 3.1** — Duplicate detection UI
6. 📍 **Phase 3.2** — Alias registration UI

## Common Patterns to Use

### Pattern 1: Data Fetching in Server Components

```typescript
import * as figureService from '@/services/figureService';

export default async function Page() {
  const figures = await figureService.getFigures();
  return <div>{/* render figures */}</div>;
}
```

### Pattern 2: Form Submission in Client Components

```typescript
'use client';
import { useState } from 'react';

export default function Form() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ /* data */ })
      });
      const data = await response.json();
      // Handle success
    } finally {
      setLoading(false);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Pattern 3: Search Results List

```typescript
import ResultCard from '@/components/ResultCard';

export default function SearchResults({ results }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {results.map(result => (
        <ResultCard key={`${result.type}-${result.id}`} result={result} />
      ))}
    </div>
  );
}
```

## Adding New Features

### To add a new API endpoint:

1. Create `app/api/endpoint/route.ts`
2. Export `GET`, `POST`, etc. handlers
3. Call service functions inside
4. Return JSON response

### To add a new service function:

1. Edit `services/entityService.ts`
2. Add function that queries Supabase
3. Export it
4. Use in API routes or server components

### To add a new component:

1. Create `components/ComponentName.tsx`
2. Make it `'use client'` if it needs state/events
3. Import and use in pages

## Testing Your Implementation

```bash
# Type check (catches errors)
npm run type-check

# Lint (code style)
npm run lint

# Manual testing
npm run dev
# Then visit pages in browser
```

## Resources Inside Project

- **`lib/types.ts`** — All TypeScript types (add new ones here)
- **`lib/utils.ts`** — Helper functions (add utilities here)
- **`services/`** — Database logic (add queries here)
- **`components/`** — Reusable UI (add components here)

---

**Start with Phase 2.1 (Figure browser)** — it's the easiest and will teach you the patterns!
