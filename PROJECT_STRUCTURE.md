# Project Structure & Guide

Welcome to your Kitbash Database project! Here's what you have and how to use it.

## 📁 File Organization

```
kitbash_database/
├── 📄 README.md                    ← START HERE! Full architecture & API docs
├── 📄 SETUP_CHECKLIST.md           ← Step-by-step setup verification
├── 📄 SUPABASE_SETUP.md            ← Detailed Supabase configuration
├── 📄 SAMPLE_DATA.sql              ← Test data to load into database
│
├── 📁 app/                         ← Next.js application
│   ├── 📁 api/                     ← API routes (backend)
│   │   ├── figures/route.ts        ← Figure CRUD
│   │   ├── search/route.ts         ← Search across entities
│   │   └── upload/route.ts         ← Image upload handler
│   ├── layout.tsx                  ← Root layout (header, nav)
│   ├── page.tsx                    ← Home page
│   └── globals.css                 ← Tailwind CSS setup
│
├── 📁 services/                    ← Business logic (NO DB in UI!)
│   ├── figureService.ts            ← Figure CRUD operations
│   ├── partService.ts              ← Part CRUD operations
│   ├── moldService.ts              ← Mold/body-type operations
│   ├── kitbashService.ts           ← Kitbash CRUD operations
│   └── searchService.ts            ← Phase 3: Search + fuzzy matching
│
├── 📁 components/                  ← Reusable React components
│   ├── SearchInput.tsx             ← Search field component
│   ├── ResultCard.tsx              ← Search result card
│   └── LoadingSpinner.tsx           ← Loading indicator
│
├── 📁 lib/                         ← Utilities & configuration
│   ├── supabaseClient.ts           ← Supabase connection
│   ├── types.ts                    ← TypeScript interfaces (core types)
│   ├── database.types.ts           ← Auto-generated Supabase types
│   ├── r2.ts                       ← Cloudflare R2 image utilities
│   ├── utils.ts                    ← Helper functions (debounce, etc.)
│   └── schema.sql                  ← Database schema (run in Supabase)
│
├── 📄 package.json                 ← Dependencies & scripts
├── 📄 tsconfig.json                ← TypeScript config
├── 📄 next.config.js               ← Next.js config
├── 📄 tailwind.config.js           ← Tailwind CSS config
├── 📄 postcss.config.js            ← PostCSS config
├── 📄 .env.local                   ← Local environment variables
└── 📄 .gitignore                   ← Git ignore rules
```

## 🚀 Quick Start (3 Minutes)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up Supabase** (follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md))
   - Create account & project
   - Copy credentials to `.env.local`
   - Run schema SQL

3. **Start dev server**
   ```bash
   npm run dev
   ```

4. **Open browser**
   ```
   http://localhost:3000
   ```

## 📚 Key Concepts

### The Architecture (Why it's organized this way)

```
UI Components
     ↓
API Routes (app/api/)
     ↓
Services (services/)  ← All business logic here!
     ↓
Supabase Database
```

**Why this matters:**
- Components never talk to database directly
- All database access goes through services
- Easy to reuse services in mobile app later
- Clear separation of concerns

### The Data Model

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| **figures** | Action figures (ML, Black Series, etc.) | name, line, year |
| **parts** | Individual components (heads, torsos, etc.) | type, source_figure_id, name |
| **molds** | Body types/templates | name, aliases, confidence_score |
| **kitbashes** | User-created customs | name, parts[], image_url, tags |
| **claims** | User submissions (not absolute truth) | entity_type, entity_id, data, confidence |
| **aliases** | Alternative names for search | entity_type, entity_id, alias |

## 💻 How to Use Each Part

### 1. Creating Data

**Via API (from frontend):**
```javascript
const response = await fetch('/api/figures', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Spider-Man',
    line: 'Marvel Legends',
    year: 2012
  })
});
```

**Via Service (in server actions):**
```typescript
import * as figureService from '@/services/figureService';

const figure = await figureService.createFigure({
  name: 'Spider-Man',
  line: 'Marvel Legends',
  year: 2012
});
```

### 2. Searching

**Global search (all entity types):**
```bash
GET /api/search?q=Vulcan&method=global
```

**Fuzzy search (intelligent matching):**
```bash
GET /api/search?q=valcan&method=fuzzy&type=mold
```

**Alias search (lookup alternative names):**
```bash
GET /api/search?q=ML Vulcan&method=alias
```

### 3. Building UI

**Example: List all figures**
```typescript
'use client';
import { useState, useEffect } from 'react';
import * as figureService from '@/services/figureService';

export default function FigureList() {
  const [figures, setFigures] = useState([]);

  useEffect(() => {
    figureService.getFigures().then(setFigures);
  }, []);

  return (
    <div>
      {figures.map(fig => (
        <div key={fig.id}>{fig.name}</div>
      ))}
    </div>
  );
}
```

### 4. Uploading Images

```typescript
import { uploadToR2 } from '@/lib/r2';

const result = await uploadToR2({
  file: imageFile,
  prefix: 'kitbashes',
  type: 'image'
});

const imageUrl = result.url;
```

## 🔧 Common Commands

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run type-check       # Check TypeScript errors
npm run lint             # Run ESLint
npm run supabase:generate-types  # Update database types
```

## 📖 Where to Find Things

| What I Want to Do | Where to Look |
|---|---|
| Add a new API endpoint | `app/api/` (create new route.ts) |
| Create UI component | `components/` (new .tsx file) |
| Add database query | `services/` (add to service file) |
| Add TypeScript type | `lib/types.ts` |
| Learn about search | `services/searchService.ts` |
| Set up database | `lib/schema.sql` |
| Configure environment | `.env.local` |

## 🎯 Current State (Phase 1-3)

### ✅ Implemented
- Database schema (all tables)
- Core services (CRUD for all entities)
- API routes (figures, search, upload)
- Fuzzy search & matching system
- Alias lookup
- Type definitions

### 🏗️ Next (Phase 2 UI)
- Browse figures by line
- Kitbash viewer
- Tagging UI
- Creator profiles

### 🚀 Future (Phase 4-5)
- User auth & claims
- Duplicate merge workflow
- Discovery features
- Mobile app (reuses services!)

## 🐛 Troubleshooting

**"Cannot find module"** → Run `npm install`

**"Supabase URL missing"** → Check `.env.local` has credentials

**"Schema not found"** → Run `lib/schema.sql` in Supabase

**"Search returns nothing"** → Load sample data via `SAMPLE_DATA.sql`

---

## 📝 Key Files to Understand

1. **README.md** — Full architecture overview
2. **services/searchService.ts** — How search works
3. **lib/schema.sql** — Database design
4. **app/layout.tsx** — App structure
5. **lib/types.ts** — Core data structures

---

**Ready to build?** Start with [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md) then read [README.md](README.md) for full context.
