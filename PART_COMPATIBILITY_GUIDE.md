# Part Compatibility System

A comprehensive system for tracking and managing how action figure parts fit together.

## Overview

The part compatibility system categorizes part-to-part relationships into three levels:

| Level | Color | Meaning | Examples |
|-------|-------|---------|----------|
| **Green** | 🟢 | Direct swap, no modification | Same ball joint type, same peg size |
| **Yellow** | 🟡 | Minor modification needed | Shave ball joint, add nail polish for grip, sand socket |
| **Red** | 🔴 | Not compatible or extreme mod | Different attachment systems, incompatible scales |

## Database Table

```sql
part_compatibility {
  id: UUID
  source_part_id: UUID (references parts.id)
  target_part_id: UUID (references parts.id)
  compatibility_level: 'green' | 'yellow' | 'red'
  notes: text (optional - why this compatibility exists)
  modification_type: string (optional - type of mod needed)
  confidence: decimal 0-1 (how confident this is correct)
  submitted_by: string (optional - who submitted this)
  created_at: timestamp
  updated_at: timestamp
}
```

## Service Functions

All functions available in `services/partCompatibilityService.ts`

### Check Compatibility

```typescript
// Check if two specific parts are compatible
const compat = await compatService.getCompatibility(sourcePart, targetPart);
// Returns: PartCompatibility | null
```

### Find Compatible Parts

```typescript
// Get all parts compatible with a source part
const all = await compatService.getCompatibleParts(partId);
const green = await compatService.getCompatibleParts(partId, 'green');
const yellow = await compatService.getCompatibleParts(partId, 'yellow');
const red = await compatService.getCompatibleParts(partId, 'red');

// Get parts that a target part fits with (reverse lookup)
const partsWithThis = await compatService.getPartsThatFitWith(partId);
```

### Find Best Fits

```typescript
// Get compatible parts sorted by compatibility level, then confidence
const bestFits = await compatService.findBestFits(partId);
// Returns: PartCompatibility[] sorted green→yellow→red, then by confidence desc
```

### Create Compatibility

```typescript
await compatService.createCompatibility({
  source_part_id: 'head-uuid',
  target_part_id: 'torso-uuid',
  compatibility_level: 'green',
  notes: 'Both use standard 16mm ball joint',
  confidence: 0.95
});
```

### Update Compatibility

```typescript
// Update an existing relationship
await compatService.updateCompatibility(compatId, {
  compatibility_level: 'yellow',
  modification_type: 'shave ball joint',
  notes: 'Socket is 0.5mm too tight'
});

// Or use the helper for modifications
await compatService.recordModification(
  compatId,
  'shave ball joint',
  'Socket is slightly tight'
);
```

### Validate a Kitbash

```typescript
// Check if all parts in a kitbash are compatible
const result = await compatService.checkMultipleCompatibilities([
  partId1,
  partId2,
  partId3
]);

// Returns: {
//   compatible: PartCompatibility[],    // green level
//   minorMods: PartCompatibility[],     // yellow level
//   incompatible: PartCompatibility[],  // red level
//   unknown: string[]                   // parts with no data
// }
```

### Get Statistics

```typescript
const stats = await compatService.getCompatibilityStats();
// Returns: {
//   total: number,
//   green: number,
//   yellow: number,
//   red: number,
//   averageConfidence: number (0-1)
// }
```

## Common Workflows

### Workflow 1: Building a Kitbash

```typescript
// Get the head you want
const headPart = await partService.getPartById('head-uuid');

// Find what torsos fit it (green level = easiest)
const fittingTorsos = await compatService.getCompatibleParts('head-uuid', 'green');

// Check the torso's compatible parts
const fittingArms = await compatService.getCompatibleParts(torsoUuid, 'green');

// Validate the whole build
const validation = await compatService.checkMultipleCompatibilities([
  headUuid,
  torsoUuid,
  armsUuid,
  legsUuid
]);

if (validation.incompatible.length > 0) {
  console.log('Warning: Some parts are incompatible');
}
```

### Workflow 2: Recording a Discovery

A user finds that two parts fit but need modification:

```typescript
// First, create the compatibility record
const compat = await compatService.createCompatibility({
  source_part_id: 'part-A',
  target_part_id: 'part-B',
  compatibility_level: 'yellow',
  notes: 'Ball joint fits but slightly loose',
  confidence: 0.85,
  submitted_by: 'user123'
});

// Later, add detailed modification info
await compatService.recordModification(
  compat.id,
  'nail polish on ball joint',
  'Added glossy nail polish for grip, works perfectly now'
);
```

### Workflow 3: Marking Incompatibility

```typescript
// Two parts simply don't work together
await compatService.createCompatibility({
  source_part_id: 'part-X',
  target_part_id: 'part-Y',
  compatibility_level: 'red',
  notes: 'Peg attachment vs ball joint, completely different systems',
  confidence: 1.0, // Very confident
  submitted_by: 'user456'
});
```

## UI Implementation Ideas (Phase 2)

### 1. Compatibility Matrix View

Show all parts from a figure line and their compatibility:

```
        Head-1  Head-2  Torso-1  Torso-2
Part1    🟢      🟡      🔴       🟢
Part2    🟢      🟢      🟢       🟡
Part3    🟡      🔴      🟢       🟢
```

Click a cell to see details: confidence, modifications needed, notes.

### 2. Part Detail Page

For a specific part, show:
- **Green section**: Parts that fit directly
- **Yellow section**: Parts that fit with minor mods
- **Red section**: Incompatible parts
- **Unknown section**: Parts with no data

### 3. Kitbash Validator

When creating a kitbash:
- User selects parts
- System shows compatibility warnings
- Green parts get 🟢, yellow get 🟡, red get 🔴
- Suggest modifications for yellow parts

### 4. Compatibility Editor

Admin/community feature:
- Search for two parts
- Set compatibility level
- Add modification type and notes
- Confidence slider

## Modification Types Reference

Common modifications found in the hobby:

| Type | Description |
|------|-------------|
| `shave ball joint` | Shave down a ball joint slightly to fit tighter sockets |
| `sand socket` | Sand out the inside of a socket for looser fit |
| `nail polish on ball joint` | Add nail polish for grip on loose sockets |
| `heat and reshape` | Heat plastic and reshape attachment point |
| `dremel modification` | Use rotary tool to modify attachment |
| `add silicone` | Add silicone or putty to tighten loose joint |
| `file attachment` | File down attachment point for better fit |
| `glue reinforcement` | Add glue/epoxy to strengthen joint |

## Confidence Scoring

The `confidence` field (0.0-1.0) indicates how sure we are:

- **1.0** — Absolutely certain (tested multiple times, official documentation)
- **0.9** — Very confident (tested several times, consistent results)
- **0.8** — Confident (tested a few times, mostly consistent)
- **0.7** — Somewhat confident (tested once or twice, seems to work)
- **0.6** — Not very confident (anecdotal reports, limited testing)
- **0.5** — Uncertain (conflicting reports)

Use `averageConfidence` from stats to know overall data quality.

## API Endpoints (Future)

Once you build Phase 2 UI, you might want:

```
GET /api/compatibility/:partId                    # Get compatible parts
GET /api/compatibility/:id/validate-kitbash       # Check kitbash
POST /api/compatibility                           # Create relationship
PUT /api/compatibility/:id                        # Update relationship
DELETE /api/compatibility/:id                     # Delete relationship
GET /api/compatibility/stats                      # Get statistics
```

## Example: Adding Compatibility Data

After running sample data, add real compatibility relationships:

```typescript
// In your code somewhere (admin function):
const figureService = require('@/services/figureService');
const partService = require('@/services/partService');
const compatService = require('@/services/partCompatibilityService');

// Get parts from figures
const spiderHeads = await partService.searchParts('Spider-Man', 'head');
const vulcanTorsos = await partService.searchParts('Vulcan', 'torso');

// Record that they fit
for (const head of spiderHeads) {
  for (const torso of vulcanTorsos) {
    await compatService.createCompatibility({
      source_part_id: head.id,
      target_part_id: torso.id,
      compatibility_level: 'green',
      notes: 'Standard ball joint compatibility',
      confidence: 0.95,
      submitted_by: 'admin'
    });
  }
}
```

## Future Enhancements

Phase 3+ ideas:
- **Visual compatibility guide** — Photos showing how to do modifications
- **Parts by brand** — Sort compatibility by manufacturer
- **Bi-directional matching** — Automatically assume reverse compatibility
- **Transitive compatibility** — If A fits B and B fits C, suggest A/C
- **Scaling information** — Track part scales and proportions
- **Community voting** — Upvote/downvote compatibility claims
- **Modification tutorials** — Link to YouTube videos for common mods
- **3D model validation** — Use 3D models to predict compatibility

---

**Ready to use!** Check [DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md) for UI implementation tasks.
