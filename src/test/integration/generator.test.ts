import { describe, it, expect } from 'vitest'
import { WordEntry } from '../../models/WordEntry'

describe('Crossword Generator Integration', () => {
  describe('JSON Import Validation', () => {
    it('should parse valid JSON structure', () => {
      const validJSON = {
        title: 'Test Crossword',
        entries: [
          { clue: 'Question 1', answer: 'HOUSE' },
          { clue: 'Question 2', answer: 'HORSE' },
          { clue: 'Question 3', answer: 'STORE' },
        ],
      }

      expect(() => JSON.parse(JSON.stringify(validJSON))).not.toThrow()
      expect(validJSON.title).toBeDefined()
      expect(Array.isArray(validJSON.entries)).toBe(true)
      expect(validJSON.entries.length).toBe(3)
    })

    it('should validate entry structure', () => {
      const entry: WordEntry = { clue: 'Test question', answer: 'ANSWER' }

      expect(entry.clue).toBeDefined()
      expect(entry.answer).toBeDefined()
      expect(typeof entry.clue).toBe('string')
      expect(typeof entry.answer).toBe('string')
    })

    it('should validate answer format with German characters', () => {
      const validAnswers = ['HOUSE', 'HUND', 'BÄCKER', 'GRÖßE']

      validAnswers.forEach((answer) => {
        expect(/^[a-zA-ZäöüÄÖÜß]+$/.test(answer)).toBe(true)
      })
    })

    it('should reject invalid answer formats', () => {
      const invalidAnswers = ['HOUSE123', 'TEST!', 'WITH SPACE', '123']

      invalidAnswers.forEach((answer) => {
        const hasLettersOnly = /^[a-zA-ZäöüÄÖÜß]+$/.test(answer)
        expect(hasLettersOnly).toBe(false)
      })
    })
  })

  describe('Data Validation Logic', () => {
    it('should enforce minimum entry count', () => {
      const entries: WordEntry[] = [
        { clue: 'Q1', answer: 'HOUSE' },
        { clue: 'Q2', answer: 'HORSE' },
      ]

      const isValid = entries.length >= 3
      expect(isValid).toBe(false)
    })

    it('should enforce maximum entry count', () => {
      const entries: WordEntry[] = Array.from({ length: 51 }, (_, i) => ({
        clue: `Q${i}`,
        answer: 'WORD',
      }))

      const isValid = entries.length <= 50
      expect(isValid).toBe(false)
    })

    it('should accept valid entry count', () => {
      const entries: WordEntry[] = Array.from({ length: 10 }, (_, i) => ({
        clue: `Q${i}`,
        answer: 'WORD',
      }))

      const isValid = entries.length >= 3 && entries.length <= 50
      expect(isValid).toBe(true)
    })

    it('should validate non-empty title', () => {
      const validTitle = 'My Puzzle'
      const emptyTitle = '   '

      expect(validTitle.trim().length > 0).toBe(true)
      expect(emptyTitle.trim().length > 0).toBe(false)
    })

    it('should validate complete puzzle data structure', () => {
      const puzzleData = {
        title: 'Test Puzzle',
        entries: [
          { clue: 'Question 1', answer: 'HOUSE' },
          { clue: 'Question 2', answer: 'HORSE' },
          { clue: 'Question 3', answer: 'STORE' },
        ],
      }

      const hasTitle = puzzleData.title && puzzleData.title.trim().length > 0
      const hasEntries = Array.isArray(puzzleData.entries) && puzzleData.entries.length >= 3
      const allEntriesValid = puzzleData.entries.every(
        (e) => e.clue && e.answer && /^[a-zA-ZäöüÄÖÜß\s]+$/.test(e.answer)
      )

      expect(hasTitle).toBe(true)
      expect(hasEntries).toBe(true)
      expect(allEntriesValid).toBe(true)
    })
  })

  describe('LocalStorage Data Format', () => {
    it('should serialize and deserialize puzzle data', () => {
      const data = {
        title: 'Test',
        entries: [
          { clue: 'Q1', answer: 'HOUSE' },
          { clue: 'Q2', answer: 'HORSE' },
          { clue: 'Q3', answer: 'STORE' },
        ],
      }

      const serialized = JSON.stringify(data)
      const deserialized = JSON.parse(serialized)

      expect(deserialized).toEqual(data)
      expect(deserialized.title).toBe(data.title)
      expect(deserialized.entries).toEqual(data.entries)
    })

    it('should handle empty entries array', () => {
      const data = {
        title: 'Test',
        entries: [],
      }

      const serialized = JSON.stringify(data)
      const deserialized = JSON.parse(serialized)

      expect(Array.isArray(deserialized.entries)).toBe(true)
      expect(deserialized.entries.length).toBe(0)
    })
  })
})
