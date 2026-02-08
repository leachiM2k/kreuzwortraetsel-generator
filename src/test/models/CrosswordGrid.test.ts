import { describe, it, expect, beforeEach } from 'vitest'
import { CrosswordGrid } from '../../models/CrosswordGrid'
import { Direction } from '../../models/Direction'
import { PlacedWord } from '../../models/PlacedWord'

describe('CrosswordGrid', () => {
  let grid: CrosswordGrid

  beforeEach(() => {
    grid = new CrosswordGrid(10, 10)
  })

  describe('constructor', () => {
    it('should create a grid with specified dimensions', () => {
      expect(grid.width).toBe(10)
      expect(grid.height).toBe(10)
    })

    it('should initialize empty grid', () => {
      for (let row = 0; row < grid.height; row++) {
        for (let col = 0; col < grid.width; col++) {
          expect(grid.getCell(row, col)).toBe(' ')
        }
      }
    })

    it('should have empty placedWords array', () => {
      expect(grid.placedWords).toEqual([])
    })
  })

  describe('isInBounds', () => {
    it('should return true for valid coordinates', () => {
      expect(grid.isInBounds(0, 0)).toBe(true)
      expect(grid.isInBounds(5, 5)).toBe(true)
      expect(grid.isInBounds(9, 9)).toBe(true)
    })

    it('should return false for out of bounds coordinates', () => {
      expect(grid.isInBounds(-1, 0)).toBe(false)
      expect(grid.isInBounds(0, -1)).toBe(false)
      expect(grid.isInBounds(10, 0)).toBe(false)
      expect(grid.isInBounds(0, 10)).toBe(false)
      expect(grid.isInBounds(100, 100)).toBe(false)
    })
  })

  describe('getCell', () => {
    it('should return space for empty cell', () => {
      expect(grid.getCell(0, 0)).toBe(' ')
      expect(grid.getCell(5, 5)).toBe(' ')
    })

    it('should return space for out of bounds', () => {
      expect(grid.getCell(-1, 0)).toBe(' ')
      expect(grid.getCell(0, -1)).toBe(' ')
      expect(grid.getCell(100, 0)).toBe(' ')
      expect(grid.getCell(0, 100)).toBe(' ')
    })

    it('should return cell value after setCell', () => {
      grid.setCell(0, 0, 'A')
      expect(grid.getCell(0, 0)).toBe('A')
    })
  })

  describe('setCell', () => {
    it('should set a cell value', () => {
      grid.setCell(0, 0, 'A')
      expect(grid.getCell(0, 0)).toBe('A')
    })

    it('should not set cell for out of bounds', () => {
      // Should not throw errors
      grid.setCell(-1, 0, 'A')
      grid.setCell(0, -1, 'A')
      grid.setCell(100, 0, 'A')
      grid.setCell(0, 100, 'A')

      // Verify grid is still empty
      expect(grid.getCell(0, 0)).toBe(' ')
    })

    it('should overwrite existing value', () => {
      grid.setCell(0, 0, 'A')
      grid.setCell(0, 0, 'B')
      expect(grid.getCell(0, 0)).toBe('B')
    })
  })

  describe('isEmpty', () => {
    it('should return true for empty cell', () => {
      expect(grid.isEmpty(0, 0)).toBe(true)
    })

    it('should return false for filled cell', () => {
      grid.setCell(0, 0, 'A')
      expect(grid.isEmpty(0, 0)).toBe(false)
    })

    it('should return true for out of bounds', () => {
      expect(grid.isEmpty(-1, 0)).toBe(true)
      expect(grid.isEmpty(100, 100)).toBe(true)
    })
  })

  describe('addPlacedWord', () => {
    it('should add horizontal word to grid', () => {
      const word: PlacedWord = {
        word: 'CAT',
        row: 0,
        col: 0,
        direction: Direction.HORIZONTAL,
        clue: 'A feline',
        number: 1
      }
      grid.addPlacedWord(word)

      expect(grid.placedWords.length).toBe(1)
      expect(grid.placedWords[0]).toBe(word)
      expect(grid.getCell(0, 0)).toBe('C')
      expect(grid.getCell(0, 1)).toBe('A')
      expect(grid.getCell(0, 2)).toBe('T')
    })

    it('should add vertical word to grid', () => {
      const word: PlacedWord = {
        word: 'DOG',
        row: 0,
        col: 0,
        direction: Direction.VERTICAL,
        clue: 'A canine',
        number: 1
      }
      grid.addPlacedWord(word)

      expect(grid.placedWords.length).toBe(1)
      expect(grid.getCell(0, 0)).toBe('D')
      expect(grid.getCell(1, 0)).toBe('O')
      expect(grid.getCell(2, 0)).toBe('G')
    })

    it('should handle multiple placed words', () => {
      const word1: PlacedWord = {
        word: 'CAT',
        row: 0,
        col: 0,
        direction: Direction.HORIZONTAL,
        clue: 'Test 1',
        number: 1
      }
      const word2: PlacedWord = {
        word: 'DOG',
        row: 2,
        col: 0,
        direction: Direction.HORIZONTAL,
        clue: 'Test 2',
        number: 2
      }

      grid.addPlacedWord(word1)
      grid.addPlacedWord(word2)

      expect(grid.placedWords.length).toBe(2)
      expect(grid.getCell(0, 0)).toBe('C')
      expect(grid.getCell(2, 0)).toBe('D')
    })

    it('should overwrite cells with intersecting words', () => {
      const word1: PlacedWord = {
        word: 'CAT',
        row: 0,
        col: 0,
        direction: Direction.HORIZONTAL,
        clue: 'Test 1',
        number: 1
      }
      const word2: PlacedWord = {
        word: 'ACE',
        row: 0,
        col: 1,
        direction: Direction.VERTICAL,
        clue: 'Test 2',
        number: 2
      }

      grid.addPlacedWord(word1)
      grid.addPlacedWord(word2)

      // The 'A' at position (0,1) should be shared
      expect(grid.getCell(0, 1)).toBe('A')
      expect(grid.getCell(1, 1)).toBe('C')
      expect(grid.getCell(2, 1)).toBe('E')
    })
  })

  describe('toAscii', () => {
    it('should render empty grid', () => {
      const smallGrid = new CrosswordGrid(3, 2)
      const ascii = smallGrid.toAscii()

      // Empty cells should be rendered as dots
      expect(ascii).toContain('.')
      expect(ascii.split('\n').length).toBe(3) // 2 rows + final newline
    })

    it('should render grid with words', () => {
      const smallGrid = new CrosswordGrid(3, 3)
      const word: PlacedWord = {
        word: 'CAT',
        row: 0,
        col: 0,
        direction: Direction.HORIZONTAL,
        clue: 'Test',
        number: 1
      }
      smallGrid.addPlacedWord(word)

      const ascii = smallGrid.toAscii()

      expect(ascii).toContain('C')
      expect(ascii).toContain('A')
      expect(ascii).toContain('T')
      expect(ascii).toContain('.')
    })
  })

  describe('setGrid', () => {
    it('should replace the entire grid', () => {
      const newGrid = [
        ['A', 'B', 'C'],
        ['D', 'E', 'F'],
      ]

      const smallGrid = new CrosswordGrid(3, 2)
      smallGrid.setGrid(newGrid)

      expect(smallGrid.getCell(0, 0)).toBe('A')
      expect(smallGrid.getCell(0, 1)).toBe('B')
      expect(smallGrid.getCell(0, 2)).toBe('C')
      expect(smallGrid.getCell(1, 0)).toBe('D')
      expect(smallGrid.getCell(1, 1)).toBe('E')
      expect(smallGrid.getCell(1, 2)).toBe('F')
    })
  })
})
