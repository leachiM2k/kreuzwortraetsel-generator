import { describe, it, expect } from 'vitest'
import { WordPlacementService } from '../../services/WordPlacementService'
import { WordEntry } from '../../models/WordEntry'
import { Direction } from '../../models/Direction'

const BERUFE_ENTRIES: WordEntry[] = [
  { clue: 'Medizinischer Beruf, der kranke Menschen behandelt', answer: 'ARZT' },
  { clue: 'Beruf, der Wissen in der Schule vermittelt', answer: 'LEHRER' },
  { clue: 'Handwerksberuf, der Brot und Brötchen herstellt', answer: 'BAECKER' },
  { clue: 'Beruf, der für Recht und Ordnung sorgt', answer: 'POLIZIST' },
  { clue: 'Beruf, der Brände löscht und Menschen rettet', answer: 'FEUERWEHR' },
  { clue: 'Beruf, der für Zeitungen oder Medien berichtet', answer: 'JOURNALIST' },
  { clue: 'Technischer Beruf, der Maschinen repariert', answer: 'MECHANIKER' },
  { clue: 'Beruf, der elektrische Anlagen installiert', answer: 'ELEKTRIKER' },
  { clue: 'IT-Beruf, der Software entwickelt', answer: 'PROGRAMMIERER' },
  { clue: 'Beruf, der Gebäude entwirft und plant', answer: 'ARCHITEKT' },
  { clue: 'Beruf, der Medikamente verkauft und berät', answer: 'APOTHEKER' },
  { clue: 'Beruf, der Pflanzen pflegt und Gärten gestaltet', answer: 'GAERTNER' },
]

describe('WordPlacementService - Berufe puzzle', () => {
  it('should place at least 11 out of 12 berufe words', () => {
    const service = new WordPlacementService()
    const grid = service.generateLayout(BERUFE_ENTRIES)

    console.log(`\nPlaced ${grid.placedWords.length}/${BERUFE_ENTRIES.length} words:`)
    for (const word of grid.placedWords) {
      console.log(`  ${word.word} at (${word.row},${word.col}) ${word.direction}`)
    }
    console.log('\nGrid:')
    console.log(grid.toAscii())

    // The manual solution in should.txt places 11/12 words
    expect(grid.placedWords.length).toBeGreaterThanOrEqual(11)
  })

  it('should produce a valid grid where all words intersect', () => {
    const service = new WordPlacementService()
    const grid = service.generateLayout(BERUFE_ENTRIES)

    // Every word must intersect with at least one other word
    for (const word of grid.placedWords) {
      let hasIntersection = false

      for (let i = 0; i < word.word.length; i++) {
        const r = word.row + (word.direction === Direction.VERTICAL ? i : 0)
        const c = word.col + (word.direction === Direction.HORIZONTAL ? i : 0)

        for (const other of grid.placedWords) {
          if (other === word) continue

          for (let j = 0; j < other.word.length; j++) {
            const or2 = other.row + (other.direction === Direction.VERTICAL ? j : 0)
            const oc = other.col + (other.direction === Direction.HORIZONTAL ? j : 0)

            if (r === or2 && c === oc) {
              hasIntersection = true
              break
            }
          }
          if (hasIntersection) break
        }
        if (hasIntersection) break
      }

      expect(hasIntersection).toBe(true)
    }
  })

  it('should have no conflicting characters at intersections', () => {
    const service = new WordPlacementService()
    const grid = service.generateLayout(BERUFE_ENTRIES)

    // Build a cell map and check for conflicts
    const cellMap = new Map<string, string>()

    for (const word of grid.placedWords) {
      for (let i = 0; i < word.word.length; i++) {
        const r = word.row + (word.direction === Direction.VERTICAL ? i : 0)
        const c = word.col + (word.direction === Direction.HORIZONTAL ? i : 0)
        const key = `${r},${c}`
        const char = word.word.charAt(i)

        if (cellMap.has(key)) {
          expect(cellMap.get(key)).toBe(char)
        } else {
          cellMap.set(key, char)
        }
      }
    }
  })

  it('should assign sequential numbers to all words', () => {
    const service = new WordPlacementService()
    const grid = service.generateLayout(BERUFE_ENTRIES)

    for (const word of grid.placedWords) {
      expect(word.number).toBeGreaterThan(0)
    }

    // Numbers should be sequential
    const numbers = [...new Set(grid.placedWords.map(w => w.number))].sort((a, b) => a - b)
    for (let i = 0; i < numbers.length; i++) {
      expect(numbers[i]).toBe(i + 1)
    }
  })
})
