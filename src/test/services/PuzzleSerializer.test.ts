import { describe, it, expect } from 'vitest'
import { serialize, deserialize } from '../../services/PuzzleSerializer'
import { CrosswordLayoutService } from '../../services/CrosswordLayoutService'
import { CrosswordGrid } from '../../models/CrosswordGrid'
import { CrosswordPuzzle } from '../../models/CrosswordPuzzle'
import { Direction } from '../../models/Direction'
import { PlacedWord } from '../../models/PlacedWord'

function createTestPuzzle(): CrosswordPuzzle {
  const service = new CrosswordLayoutService()
  return service.createPuzzle('Test Puzzle', [
    { clue: 'Q1', answer: 'HOUSE' },
    { clue: 'Q2', answer: 'HORSE' },
    { clue: 'Q3', answer: 'STORE' },
  ])
}

function createGermanPuzzle(): CrosswordPuzzle {
  const grid = new CrosswordGrid(10, 5)
  const words: PlacedWord[] = [
    { word: 'LÖWE', clue: 'König der Tiere', row: 0, col: 0, direction: Direction.HORIZONTAL, number: 1 },
    { word: 'ÖFFNE', clue: 'Mach die Tür auf', row: 0, col: 1, direction: Direction.VERTICAL, number: 2 },
    { word: 'STRAÜSS', clue: 'Großer Vogel', row: 2, col: 0, direction: Direction.HORIZONTAL, number: 3 },
  ]
  for (const w of words) {
    grid.addPlacedWord(w)
  }
  return {
    grid,
    title: 'Kreuzworträtsel Tiere',
    acrossClues: words.filter(w => w.direction === Direction.HORIZONTAL),
    downClues: words.filter(w => w.direction === Direction.VERTICAL),
  }
}

describe('PuzzleSerializer', () => {
  describe('roundtrip', () => {
    it('should serialize and deserialize a basic puzzle', () => {
      const puzzle = createTestPuzzle()

      const encoded = serialize(puzzle)
      const decoded = deserialize(encoded)

      expect(decoded.title).toBe(puzzle.title)
      expect(decoded.grid.width).toBe(puzzle.grid.width)
      expect(decoded.grid.height).toBe(puzzle.grid.height)
      expect(decoded.grid.placedWords.length).toBe(puzzle.grid.placedWords.length)
      expect(decoded.acrossClues.length).toBe(puzzle.acrossClues.length)
      expect(decoded.downClues.length).toBe(puzzle.downClues.length)
    })

    it('should preserve grid cell values after roundtrip', () => {
      const puzzle = createTestPuzzle()

      const decoded = deserialize(serialize(puzzle))

      for (let row = 0; row < puzzle.grid.height; row++) {
        for (let col = 0; col < puzzle.grid.width; col++) {
          expect(decoded.grid.getCell(row, col)).toBe(puzzle.grid.getCell(row, col))
        }
      }
    })

    it('should preserve placed word details after roundtrip', () => {
      const puzzle = createTestPuzzle()

      const decoded = deserialize(serialize(puzzle))

      for (let i = 0; i < puzzle.grid.placedWords.length; i++) {
        const original = puzzle.grid.placedWords[i]
        const restored = decoded.grid.placedWords[i]
        expect(restored.word).toBe(original.word)
        expect(restored.clue).toBe(original.clue)
        expect(restored.row).toBe(original.row)
        expect(restored.col).toBe(original.col)
        expect(restored.direction).toBe(original.direction)
        expect(restored.number).toBe(original.number)
      }
    })

    it('should handle German umlauts in title and clues', () => {
      const puzzle = createGermanPuzzle()

      const decoded = deserialize(serialize(puzzle))

      expect(decoded.title).toBe(puzzle.title)
      for (let i = 0; i < puzzle.grid.placedWords.length; i++) {
        expect(decoded.grid.placedWords[i].clue).toBe(puzzle.grid.placedWords[i].clue)
        expect(decoded.grid.placedWords[i].word).toBe(puzzle.grid.placedWords[i].word)
      }
    })

    it('should handle clues containing pipe characters', () => {
      const grid = new CrosswordGrid(5, 5)
      const words: PlacedWord[] = [
        { word: 'HELLO', clue: 'A greeting | salutation', row: 0, col: 0, direction: Direction.HORIZONTAL, number: 1 },
        { word: 'HELPS', clue: 'Assists', row: 0, col: 0, direction: Direction.VERTICAL, number: 1 },
        { word: 'OVALS', clue: 'Egg shapes | ellipses | round', row: 0, col: 4, direction: Direction.VERTICAL, number: 2 },
      ]
      for (const w of words) {
        grid.addPlacedWord(w)
      }
      const puzzle: CrosswordPuzzle = {
        grid,
        title: 'Pipe Test',
        acrossClues: words.filter(w => w.direction === Direction.HORIZONTAL),
        downClues: words.filter(w => w.direction === Direction.VERTICAL),
      }

      const decoded = deserialize(serialize(puzzle))

      expect(decoded.grid.placedWords[0].clue).toBe('A greeting | salutation')
      expect(decoded.grid.placedWords[2].clue).toBe('Egg shapes | ellipses | round')
    })
  })

  describe('backward compatibility', () => {
    it('should deserialize legacy base64 JSON format', () => {
      // Create a legacy-format hash (plain JSON base64)
      const grid = new CrosswordGrid(5, 3)
      const words: PlacedWord[] = [
        { word: 'HELLO', clue: 'A greeting', row: 0, col: 0, direction: Direction.HORIZONTAL, number: 1 },
        { word: 'HAS', clue: 'Possesses', row: 0, col: 0, direction: Direction.VERTICAL, number: 1 },
      ]
      for (const w of words) {
        grid.addPlacedWord(w)
      }
      const puzzle: CrosswordPuzzle = {
        grid,
        title: 'Legacy Test',
        acrossClues: words.filter(w => w.direction === Direction.HORIZONTAL),
        downClues: words.filter(w => w.direction === Direction.VERTICAL),
      }

      // Simulate old serialization: JSON.stringify + btoa
      const legacyHash = btoa(JSON.stringify(puzzle))

      const decoded = deserialize(legacyHash)

      expect(decoded.title).toBe('Legacy Test')
      expect(decoded.grid.width).toBe(5)
      expect(decoded.grid.height).toBe(3)
      expect(decoded.grid.placedWords.length).toBe(2)
      expect(decoded.grid.getCell(0, 0)).toBe('H')
      expect(decoded.grid.getCell(0, 4)).toBe('O')
    })
  })

  describe('compactness', () => {
    it('should produce shorter output than legacy JSON format', () => {
      const puzzle = createTestPuzzle()

      const legacyLength = btoa(JSON.stringify(puzzle)).length
      const compactLength = serialize(puzzle).length

      expect(compactLength).toBeLessThan(legacyLength)
    })

    it('should produce significantly shorter output for larger puzzles', () => {
      const service = new CrosswordLayoutService()
      const puzzle = service.createPuzzle('Großes Rätsel', [
        { clue: 'Frage eins', answer: 'APOTHEKER' },
        { clue: 'Frage zwei', answer: 'FEUERWEHR' },
        { clue: 'Frage drei', answer: 'POLIZIST' },
        { clue: 'Frage vier', answer: 'INGENIEUR' },
        { clue: 'Frage fünf', answer: 'ARCHITEKT' },
        { clue: 'Frage sechs', answer: 'MECHANIKER' },
      ])

      const legacyLength = btoa(JSON.stringify(puzzle)).length
      const compactLength = serialize(puzzle).length

      // Expect at least 50% reduction
      expect(compactLength).toBeLessThan(legacyLength * 0.5)
    })
  })

  describe('format detection', () => {
    it('should produce output starting with Z prefix', () => {
      const puzzle = createTestPuzzle()
      const encoded = serialize(puzzle)
      expect(encoded.startsWith('Z')).toBe(true)
    })

    it('should not contain standard base64 padding', () => {
      const puzzle = createTestPuzzle()
      const encoded = serialize(puzzle)
      expect(encoded).not.toContain('=')
    })
  })

  describe('grid reconstruction', () => {
    it('should return a CrosswordGrid instance with working methods', () => {
      const puzzle = createTestPuzzle()

      const decoded = deserialize(serialize(puzzle))

      // Verify getCell works (method from CrosswordGrid class)
      expect(typeof decoded.grid.getCell).toBe('function')
      expect(typeof decoded.grid.isInBounds).toBe('function')
      expect(typeof decoded.grid.isEmpty).toBe('function')
    })
  })
})
