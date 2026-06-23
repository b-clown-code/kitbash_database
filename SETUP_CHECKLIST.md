# Setup Checklist

Complete this checklist to get the project running:

## Pre-Setup
- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm or yarn installed (`npm --version`)
- [ ] Supabase account created
- [ ] Cloudflare account created (optional for local dev)

## 1. Local Setup
- [ ] Clone/extract to `c:\projects\kitbash_database`
- [ ] Run `npm install`
- [ ] Verify no installation errors

## 2. Supabase Configuration
- [ ] Create Supabase project
- [ ] Copy credentials to `.env.local`:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md) to create schema
- [ ] Run sample data SQL (optional, for testing)

## 3. Environment File
- [ ] Rename `.env.local.example` to `.env.local`
- [ ] Fill in ALL environment variables
- [ ] For local dev, you can use:
  ```
  R2_CDN_URL=http://localhost:3000
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  ```

## 4. First Run
- [ ] Run `npm run dev`
- [ ] Open `http://localhost:3000` in browser
- [ ] Verify no console errors
- [ ] Try searching for a test query

## 5. Test Create Operations (Optional)
- [ ] Create a figure via API:
  ```bash
  curl -X POST http://localhost:3000/api/figures \
    -H "Content-Type: application/json" \
    -d '{"name":"Test Figure","line":"Test Line","year":2024}'
  ```
- [ ] Verify it appears in Supabase Table Editor

## 6. Development Ready
- [ ] Run `npm run type-check` (should have 0 errors)
- [ ] Run `npm run lint` (should have 0 errors)
- [ ] Start building Phase 2 features!

## Common Issues

### "Supabase credentials missing"
→ Check `.env.local` has the right variables (no `NEXT_PUBLIC_` prefix in the key itself)

### Build errors after setup
→ Run `npm install` again, then `npm run type-check` to find issues

### Search isn't working
→ Make sure sample data is loaded and Supabase schema is complete

### Images won't upload
→ For local dev, just use placeholder URLs. R2 setup is optional for Phase 1-3.

---

## Next Steps After Setup

1. **Test the services**: Open `http://localhost:3000` and use the search
2. **Build UI for Phase 2**: Create components in `components/`
3. **Add more API routes**: Follow the pattern in `app/api/`
4. **Read the README**: Full architecture and API reference

---

✅ **Once this checklist is complete, you have a working kitbash database!**
