import { describe, it, expect, beforeEach } from 'vitest'
import { WordPlacementService } from '../../services/WordPlacementService'
import { WordEntry } from '../../models/WordEntry'
import { Direction } from '../../models/Direction'

describe('WordPlacementService', () => {
  let service: WordPlacementService

  beforeEach(() => {
    service = new WordPlacementService()
  })

  describe('generateLayout', () => {
    it('should throw error when unable to place enough words', () => {
      // Use words with no common letters to force failure
      const entries: WordEntry[] = [
        { clue: 'Q1', answer: 'ABC' },
        { clue: 'Q2', answer: 'XYZ' },
      ]

      expect(() => service.generateLayout(entries)).toThrow(
        'Could not place enough words'
      )
    })

    it('should handle many words', () => {
      // Test with many words that have common letters
      const entries: WordEntry[] = Array.from({ length: 20 }, (_, i) => ({
        clue: `Q${i}`,
        answer: 'HOUSE',
      }))

      const grid = service.generateLayout(entries)

      // Should place at least some words
      expect(grid.placedWords.length).toBeGreaterThanOrEqual(1)
    })

    it('should create a valid grid with words that have common letters', () => {
      // Use words that are guaranteed to intersect
      const entries: WordEntry[] = [
        { clue: 'Q1', answer: 'HOUSE' },
        { clue: 'Q2', answer: 'HORSE' },
        { clue: 'Q3', answer: 'STORE' },
      ]

      const grid = service.generateLayout(entries)

      expect(grid).toBeDefined()
      expect(grid.placedWords.length).toBeGreaterThanOrEqual(2)
      expect(grid.width).toBeGreaterThan(0)
      expect(grid.height).toBeGreaterThan(0)
    })

    it('should place words with intersections when possible', () => {
      const entries: WordEntry[] = [
        { clue: 'Q1', answer: 'HOUSE' },
        { clue: 'Q2', answer: 'HORSE' },
        { clue: 'Q3', answer: 'STORE' },
      ]

      const grid = service.generateLayout(entries)

      // Check that at least some words are placed
      expect(grid.placedWords.length).toBeGreaterThanOrEqual(2)

      // If multiple words are placed, check for intersections
      if (grid.placedWords.length >= 2) {
        let hasIntersection = false
        for (let i = 0; i < grid.placedWords.length; i++) {
          for (let j = i + 1; j < grid.placedWords.length; j++) {
            const word1 = grid.placedWords[i]
            const word2 = grid.placedWords[j]

            for (let k = 0; k < word1.word.length; k++) {
              const r1 = word1.row + (word1.direction === Direction.VERTICAL ? k : 0)
              const c1 = word1.col + (word1.direction === Direction.HORIZONTAL ? k : 0)

              for (let l = 0; l < word2.word.length; l++) {
                const r2 = word2.row + (word2.direction === Direction.VERTICAL ? l : 0)
                const c2 = word2.col + (word2.direction === Direction.HORIZONTAL ? l : 0)

                if (r1 === r2 && c1 === c2 && word1.word[k] === word2.word[l]) {
                  hasIntersection = true
                }
              }
            }
          }
        }

        expect(hasIntersection).toBe(true)
      }
    })

    it('should assign numbers to placed words', () => {
      const entries: WordEntry[] = [
        { clue: 'Q1', answer: 'HOUSE' },
        { clue: 'Q2', answer: 'HORSE' },
        { clue: 'Q3', answer: 'SHORE' },
      ]

      const grid = service.generateLayout(entries)

      expect(grid.placedWords.length).toBeGreaterThanOrEqual(2)

      // All placed words should have a number assigned
      grid.placedWords.forEach((word) => {
        expect(word.number).toBeGreaterThan(0)
        expect(typeof word.number).toBe('number')
      })
    })

    it('should place words in the grid', () => {
      const entries: WordEntry[] = [
        { clue: 'Q1', answer: 'LONG' },
        { clue: 'Q2', answer: 'SONG' },
        { clue: 'Q3', answer: 'GONG' },
      ]

      const grid = service.generateLayout(entries)

      // Should place at least some words
      expect(grid.placedWords.length).toBeGreaterThanOrEqual(2)

      // All placed words should have both horizontal and vertical orientations or at least one
      const hasWords = grid.placedWords.length > 0
      expect(hasWords).toBe(true)
    })

    it('should handle words with common letters', () => {
      const entries: WordEntry[] = [
        { clue: 'Q1', answer: 'APPLE' },
        { clue: 'Q2', answer: 'PLUM' },
        { clue: 'Q3', answer: 'LEMON' },
      ]

      const grid = service.generateLayout(entries)

      // Just verify that at least some words were placed
      expect(grid.placedWords.length).toBeGreaterThanOrEqual(1)
      expect(grid.width).toBeGreaterThan(0)
      expect(grid.height).toBeGreaterThan(0)
    })
  })
})
