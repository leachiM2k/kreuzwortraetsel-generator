# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a client-only crossword puzzle generator built with TypeScript and Vite. It was ported from a Java/Spring Boot application and runs entirely in the browser with no backend required.

## Development Commands

```bash
# Start development server (runs on localhost:3000)
npm run dev

# Type check and build for production
npm run build

# Preview production build locally
npm run preview
```

## Architecture

### Two-Page Application Structure

The application consists of two separate pages with distinct entry points:

1. **Generator Page** (`index.html` + `src/main.ts`)
   - User inputs title and question/answer pairs
   - Generates preview of crossword layout
   - Exports to PDF
   - Serializes puzzle to base64 and passes to play page via URL hash
   - **LocalStorage**: Automatically saves user inputs (title and entries) to localStorage with key `crossword-generator-data`, restoring them on page reload

2. **Play Page** (`play.html` + `src/play.ts`)
   - Loads puzzle from URL hash (base64-encoded JSON)
   - Interactive game with keyboard navigation
   - Check/reveal/clear functionality
   - Falls back to generator page if no valid puzzle data

### Core Algorithm (WordPlacementService)

The crossword layout algorithm is the heart of the application:

1. **Word Sorting**: Sorts words by length (longest first) to maximize placement success
2. **Initial Placement**: Places first word horizontally in center of grid
3. **Iterative Placement**: For each subsequent word:
   - Finds all possible intersection points with already-placed words
   - Intersection requires matching characters
   - Validates placement (no conflicts, no adjacent parallel words)
   - Scores placements by number of intersections
   - Tries top 10 scoring options
4. **Grid Optimization**: Trims empty space around placed words
5. **Numbering**: Assigns numbers to words by position (top-to-bottom, left-to-right)

**Key constraint**: Words must intersect; isolated words are not allowed. Minimum 3 words required.

### Service Layer

- **WordPlacementService**: Core algorithm for placing words on grid
- **CrosswordLayoutService**: Orchestrates puzzle creation, separates across/down clues
- **PDFGeneratorService**: Uses jsPDF to generate downloadable PDFs

### Data Models

- **Direction**: Enum (HORIZONTAL, VERTICAL)
- **WordEntry**: Question/answer pair (user input)
- **PlacedWord**: Word with position, direction, and number in grid
- **CrosswordGrid**: 2D grid with placed words and helper methods
- **CrosswordPuzzle**: Complete puzzle with grid, title, and separated clues

### Data Flow

```
User Input → WordEntry[] → WordPlacementService.generateLayout() → CrosswordGrid
                                                                        ↓
                              CrosswordLayoutService.createPuzzle() → CrosswordPuzzle
                                                                        ↓
                                            ┌──────────────────────────┼──────────────────────┐
                                            ↓                          ↓                      ↓
                                    PDF Export              Preview Display      Serialize to URL hash
                                                                                           ↓
                                                                                    Play Page
```

## Important Implementation Details

### German Language Support

All validation and text processing supports German umlauts (ä, ö, ü, ß). The regex for answer validation is:

```typescript
/^[a-zA-ZäöüÄÖÜß\s]+$/
```

### Grid Coordinate System

- Grid uses `[row][col]` indexing (row-major order)
- Coordinates are zero-based
- `PlacedWord.row` and `PlacedWord.col` indicate the **starting position** of the word

### Puzzle Serialization

When passing puzzle data to the play page:

1. Puzzle is serialized to JSON
2. Encoded with `btoa()` (base64)
3. Appended to URL as hash fragment: `/play.html#<base64>`
4. Play page decodes with `atob()` and reconstructs model instances

**Critical**: The `CrosswordGrid` class instance must be reconstructed on the play page (not just parsed as plain object).

### LocalStorage Implementation

The generator page automatically persists user inputs:
- **Storage Key**: `crossword-generator-data`
- **Saved Data**: `{ title: string, entries: Array<{ clue: string, answer: string }> }`
- **Auto-save Triggers**: Input changes, entry add/remove, sample load
- **Auto-restore**: On page load, if saved data exists

### Validation Rules

- **Title**: Must not be empty
- **Entries**: Minimum 3, maximum 50
- **Answers**: Only letters (A-Z and German umlauts) allowed
- **Grid Size**: Max 50×50 (defined by `MAX_GRID_SIZE` constant)

## Multi-Page Vite Configuration

The Vite build is configured to handle multiple HTML entry points:

```typescript
// vite.config.ts
export default defineConfig({
  server: { port: 3000 },
})
```

Vite automatically detects `index.html` and `play.html` as separate entry points and builds them independently.

## Styling

- Pure CSS (no frameworks)
- Responsive design
- Two separate CSS files: `style.css` (generator) and `play.css` (game)
- Grid layout uses CSS Grid with dynamic column counts

## TypeScript Configuration

- Target: ES2020
- Strict mode enabled
- Module resolution: bundler mode (Vite-optimized)
- No emit (Vite handles bundling)
