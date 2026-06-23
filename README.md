# Kitbash Database

A community-driven knowledge graph of action figure parts, molds, and customizations. Not a catalog—a living, collaborative resource for figure enthusiasts.

## Overview

**Phase 1-3 Implementation**: Foundation + Graph Features + Matching System

```
Frontend (Next.js) → Services Layer → Supabase (Graph + Metadata) → Cloudflare R2 (Images)
```

### Key Architecture Principles

- ✅ **No direct DB access in UI** — all queries go through `/services`
- ✅ **Images are external** — only URLs stored in database
- ✅ **Claims-based system** — user submissions don't overwrite truth
- ✅ **Mobile-ready** — service layer designed for future app reuse
- ✅ **Fuzzy matching** — search with aliases and intelligent normalization

---

## Quick Start

### 1. Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier works)
- Cloudflare account (for R2 storage)

### 2. Clone & Install

```bash
cd c:\projects\kitbash_database
npm install
```

### 3. Environment Setup

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

NEXT_PUBLIC_R2_BUCKET_NAME=kitbash-media
NEXT_PUBLIC_R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_CDN_URL=https://cdn.example.com

NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 4. Set Up Supabase

1. Create a new Supabase project
2. Go to **SQL Editor** and run the schema from [`lib/schema.sql`](lib/schema.sql)
3. This creates all tables, indexes, and triggers

```bash
# Option: Use Supabase CLI
supabase db pull  # If you've set up CLI
supabase db push  # To sync local schema
```

### 5. Run Development Server

```bash
npm run dev
```

Navigate to `http://localhost:3000`

---

## Project Structure

```
kitbash-database/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   ├── figures/route.ts
│   │   ├── search/route.ts
│   │   └── upload/route.ts
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── globals.css
│
├── services/                     # Service layer (NO DB in components)
│   ├── figureService.ts          # Figure CRUD
│   ├── partService.ts            # Part CRUD
│   ├── moldService.ts            # Mold CRUD + matching
│   ├── kitbashService.ts         # Kitbash CRUD
│   └── searchService.ts          # Phase 3: Fuzzy search, aliases, duplicates
│
├── lib/                          # Utilities & types
│   ├── supabaseClient.ts         # Supabase config
│   ├── types.ts                  # TypeScript interfaces
│   ├── r2.ts                     # Cloudflare R2 utilities
│   ├── database.types.ts         # Auto-generated from Supabase
│   └── schema.sql                # Database schema
│
├── package.json
├── tsconfig.json
├── next.config.js
└── .env.local.example
```

---

## Data Model (Phase 1)

### **Figures**
Core action figures from lines like Marvel Legends, Black Series, etc.

```sql
figures {
  id: UUID
  name: string
  line: string
  year: integer (optional)
  metadata: JSON
}
```

### **Parts**
Individual components (head, torso, arms, legs, accessories)

```sql
parts {
  id: UUID
  type: enum (head|torso|arms|legs|accessory)
  source_figure_id: UUID (optional)
  name: string
  metadata: JSON
}
```

### **Molds**
Body types/templates (e.g., "Vulcan buck", "ML Bucky buck")

```sql
molds {
  id: UUID
  name: string
  aliases: string[]
  confidence_score: decimal (0-1)
  metadata: JSON
}
```

### **Kitbashes**
User-created custom figures

```sql
kitbashes {
  id: UUID
  name: string
  parts: JSON array [{ part_id, position, notes }]
  image_url: string (Cloudflare R2 URL)
  thumbnail_url: string
  creator: string (optional)
  tags: string[]
}
```

### **Claims** (Critical for Phase 1-2)
Every user submission is a claim, not absolute truth

```sql
claims {
  id: UUID
  entity_type: enum (figure|part|mold|kitbash)
  entity_id: UUID
  claim_type: string (e.g., "uses_mold", "compatible_with")
  data: JSON
  confidence: decimal (0-1)
}
```

### **Aliases** (Phase 3)
For fuzzy matching and normalization

```sql
aliases {
  id: UUID
  entity_type: enum (figure|part|mold)
  entity_id: UUID
  alias: string
}
```

### **Part Compatibility** (Phase 2)
Defines how parts fit together with confidence levels

```sql
part_compatibility {
  id: UUID
  source_part_id: UUID
  target_part_id: UUID
  compatibility_level: enum (green|yellow|red)
  notes: string (optional)
  modification_type: string (optional - "shave ball joint", "sand socket", etc.)
  confidence: decimal (0-1) - how confident the compatibility is
  submitted_by: string (optional)
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

**Compatibility Levels:**
- **Green** (🟢) — Direct swap with no modification needed
- **Yellow** (🟡) — Swap with minor modification (sanding, nail polish on joints, etc.)
- **Red** (🔴) — Not compatible or requires extreme modification

---

## API Reference

### Search Endpoints

**Global Search**
```bash
GET /api/search?q=Vulcan&method=global
```

**Fuzzy Search**
```bash
GET /api/search?q=valcan&method=fuzzy&type=mold
```

**Alias Search**
```bash
GET /api/search?q=ML Vulcan&method=alias
```

### Entity Endpoints

**Figures**
```bash
GET /api/figures                    # All figures
GET /api/figures?line=Marvel        # By line
GET /api/figures/[id]              # Single figure
POST /api/figures                  # Create
```

**Kitbashes**
```bash
GET /api/kitbashes?page=1&pageSize=20
GET /api/kitbashes/[id]
POST /api/kitbashes
```

---

## Service Layer Usage

All data access goes through services. **Never query Supabase directly from components.**

### Example: Creating a Kitbash

```typescript
// ✅ DO THIS (in a server action or API route)
import * as kitbashService from '@/services/kitbashService';

const kb = await kitbashService.createKitbash({
  name: 'Custom Wolverine',
  parts: [
    { part_id: 'part-123', position: 'head' },
    { part_id: 'part-456', position: 'torso' }
  ],
  tags: ['custom', 'wolverine'],
  creator: 'user123'
});

// ❌ DON'T DO THIS (direct DB in component)
// const { data } = await supabase.from('kitbashes').insert(...)
```

---

## Phase 1-3 Roadmap

### Phase 1: Foundation ✅
- [x] Schema & database
- [x] Service layer
- [x] Basic CRUD operations
- [x] Image upload to R2

### Phase 2: Graph Features (In Progress)
- [ ] "Uses this part" relationships
- [ ] Kitbash viewer UI
- [ ] Tagging system (UI)
- [ ] Browse by figure line

### Phase 3: Matching System ✅
- [x] Fuzzy search (`searchService.ts`)
- [x] Alias registration
- [x] Duplicate detection
- [x] Levenshtein matching
- [ ] UI for duplicate suggestions

---

## Key Features Implemented

### Search (`services/searchService.ts`)

1. **Global Search** — across all entity types
2. **Fuzzy Search** — intelligent matching via Fuse.js
3. **Alias Search** — lookup alternative names
4. **Duplicate Detection** — find potential merge candidates

```typescript
import * as searchService from '@/services/searchService';

// Fuzzy search for molds
const results = await searchService.fuzzySearch('valcan', 'mold');

// Find duplicate figures
const duplicates = await searchService.findDuplicateFigures();

// Register an alias
await searchService.registerAlias('mold', 'mold-123', 'Vulcan Buck');
```

### Image Handling (`lib/r2.ts`)

```typescript
import { uploadToR2, generateCdnUrl } from '@/lib/r2';

const result = await uploadToR2({
  file: imageFile,
  prefix: 'kitbashes',
  type: 'image'
});

const cdnUrl = result.url; // https://cdn.site.com/uploads/...
```

---

## Development

### Type Generation

To regenerate types from Supabase:

```bash
npm run supabase:generate-types
```

This updates `lib/database.types.ts` automatically.

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npm run type-check
```

---

## Future Phases (Post Phase 3)

### Phase 4: Community Layer
- User submissions and claims
- Correction workflow
- Confidence scoring

### Phase 5: Discovery Features
- "What can I build with these parts?"
- "Figures using this mold"
- Kitbash recommendations

### Mobile App
Because of the service layer architecture, a React Native app would:
- Reuse all services (figureService, kitbashService, etc.)
- Only change the UI layer
- Use same Supabase backend

---

## Troubleshooting

### "Supabase credentials missing"
Check that `.env.local` has valid `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### "Schema not found"
Run `lib/schema.sql` in your Supabase SQL editor.

### "Images not uploading"
Ensure R2 credentials are correct and bucket exists.

### Tests failing
Run `npm install` to ensure all dependencies are present.

---

## Contributing

1. Keep DB access in services only
2. Use TypeScript for all new code
3. Add types to `lib/types.ts`
4. Run `npm run type-check` before committing

---

## License

Open source for community use.

---

**Next Step**: Start building Phase 2 features or test the API with sample data!
