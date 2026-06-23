# Supabase Setup Guide

This guide walks through setting up Supabase for the Kitbash Database project.

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Project name**: `kitbash-database` (or your preference)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
4. Click "Create new project" (takes ~2 minutes)

## Step 2: Get Your Credentials

Once created:

1. Go to **Settings** → **API**
2. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Paste into `.env.local`

## Step 3: Set Up Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `lib/schema.sql`
4. Paste into the editor
5. Click **Run**

This creates:
- `figures` table
- `parts` table
- `molds` table
- `kitbashes` table
- `claims` table
- `aliases` table
- All indexes and triggers

## Step 4: Verify Schema

In Supabase, go to **Table Editor** and confirm you see:
- figures
- parts
- molds
- kitbashes
- claims
- aliases

## Step 5: Optional - Load Sample Data

To test with sample data:

1. Go to **SQL Editor** → **New Query**
2. Copy contents of `SAMPLE_DATA.sql`
3. Paste and run

**Note**: Sample data has placeholder IDs. You'll need to:
- Insert your own data via API (`POST /api/figures`, etc.)
- Or manually update UUIDs in the sample SQL

## Step 6: Verify Connection

In your app, test the connection:

```bash
npm run dev
```

Navigate to `http://localhost:3000` and try the search feature. Check browser console for errors.

## Troubleshooting

### "Missing credentials"
- Confirm `.env.local` exists
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- No quotes needed in `.env.local`

### "Permission denied"
- Ensure you're using the `anon public` key (not service role)
- Check Supabase **Authentication** → **Policies** (Row Level Security)

### "Table not found"
- Verify schema SQL ran without errors
- Check **Table Editor** to confirm tables exist

## Row Level Security (RLS)

By default, Supabase has RLS enabled. For public read access:

1. Go to **Authentication** → **Policies**
2. For each table, create policy:
   - **Statement**: Allow public `SELECT`
   - **Using**: `true`
3. For inserts/updates, configure as needed for your auth model

## Next: Generate Types

Once schema is set up:

```bash
npm run supabase:generate-types
```

This updates `lib/database.types.ts` with your exact schema.

---

**You're ready!** The database is connected and your app can now read/write data.
