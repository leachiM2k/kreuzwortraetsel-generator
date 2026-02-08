import { describe, it, expect, beforeEach } from 'vitest'
import { CrosswordLayoutService } from '../../services/CrosswordLayoutService'
import { WordEntry } from '../../models/WordEntry'
import { Direction } from '../../models/Direction'

describe('CrosswordLayoutService', () => {
  let service: CrosswordLayoutService

  beforeEach(() => {
    service = new CrosswordLayoutService()
  })

  describe('createPuzzle', () => {
    it('should create a puzzle with title', () => {
      const title = 'Test Puzzle'
      const entries: WordEntry[] = [
        { clue: 'Q1', answer: 'HOUSE' },
        { clue: 'Q2', answer: 'HORSE' },
        { clue: 'Q3', answer: 'STORE' },
      ]

      const puzzle = service.createPuzzle(title, entries)

      expect(puzzle.title).toBe(title)
    })

    it('should create a puzzle with grid', () => {
      const entries: WordEntry[] = [
        { clue: 'Q1', answer: 'HOUSE' },
        { clue: 'Q2', answer: 'HORSE' },
        { clue: 'Q3', answer: 'SHORE' },
      ]

      const puzzle = service.createPuzzle('Test', entries)

      expect(puzzle.grid).toBeDefined()
      expect(puzzle.grid.placedWords.length).toBeGreaterThanOrEqual(1)
    })

    it('should separate across and down clues', () => {
      const entries: WordEntry[] = [
        { clue: 'Horizontal word', answer: 'HOUSE' },
        { clue: 'Vertical word', answer: 'HORSE' },
        { clue: 'Another word', answer: 'SHORE' },
      ]

      const puzzle = service.createPuzzle('Test', entries)

      expect(puzzle.acrossClues).toBeDefined()
      expect(puzzle.downClues).toBeDefined()
      expect(Array.isArray(puzzle.acrossClues)).toBe(true)
      expect(Array.isArray(puzzle.downClues)).toBe(true)

      // Total clues should equal placed words
      const totalClues = puzzle.acrossClues.length + puzzle.downClues.length
      expect(totalClues).toBe(puzzle.grid.placedWords.length)
    })

    it('should include clues for placed words', () => {
      const entries: WordEntry[] = [
        { clue: 'Word 1', answer: 'HOUSE' },
        { clue: 'Word 2', answer: 'HORSE' },
        { clue: 'Word 3', answer: 'SHORE' },
      ]

      const puzzle = service.createPuzzle('Test', entries)
      const allClues = [...puzzle.acrossClues, ...puzzle.downClues]

      expect(allClues.length).toBeGreaterThanOrEqual(1)

      // Check that each placed word has a clue
      puzzle.grid.placedWords.forEach(word => {
        const hasClue = allClues.some(c => c.number === word.number && c.direction === word.direction)
        expect(hasClue).toBe(true)
      })
    })

    it('should assign correct directions to clues', () => {
      const entries: WordEntry[] = [
        { clue: 'Q1', answer: 'HOUSE' },
        { clue: 'Q2', answer: 'HORSE' },
        { clue: 'Q3', answer: 'STORE' },
      ]

      const puzzle = service.createPuzzle('Test', entries)

      puzzle.acrossClues.forEach((clue) => {
        expect(clue.direction).toBe(Direction.HORIZONTAL)
      })

      puzzle.downClues.forEach((clue) => {
        expect(clue.direction).toBe(Direction.VERTICAL)
      })
    })

    it('should have numbered clues', () => {
      const entries: WordEntry[] = [
        { clue: 'Q1', answer: 'HOUSE' },
        { clue: 'Q2', answer: 'HORSE' },
        { clue: 'Q3', answer: 'SHORE' },
      ]

      const puzzle = service.createPuzzle('Test', entries)
      const allClues = [...puzzle.acrossClues, ...puzzle.downClues]

      allClues.forEach((clue) => {
        expect(clue.number).toBeGreaterThan(0)
        expect(typeof clue.number).toBe('number')
      })
    })
  })

  describe('getSampleEntries', () => {
    it('should return an array of sample entries', () => {
      const samples = service.getSampleEntries()

      expect(Array.isArray(samples)).toBe(true)
      expect(samples.length).toBeGreaterThan(0)
    })

    it('should have clues and answers', () => {
      const samples = service.getSampleEntries()

      samples.forEach((entry) => {
        expect(entry.clue).toBeDefined()
        expect(entry.answer).toBeDefined()
        expect(typeof entry.clue).toBe('string')
        expect(typeof entry.answer).toBe('string')
        expect(entry.clue.length).toBeGreaterThan(0)
        expect(entry.answer.length).toBeGreaterThan(0)
      })
    })

    it('should have at least 3 samples', () => {
      const samples = service.getSampleEntries()
      expect(samples.length).toBeGreaterThanOrEqual(3)
    })
  })
})
