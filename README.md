# Kreuzworträtsel Generator

Ein moderner, client-only Kreuzworträtsel-Generator mit TypeScript und Vite. Portiert von der Java/Spring Boot Version.

## ✨ Features

- 🧩 Intelligenter Layout-Algorithmus für optimale Wortplatzierung
- 🎨 Moderne, responsive Benutzeroberfläche
- 📄 PDF-Export mit professionellem Layout
- 🔒 100% Client-only - Daten bleiben auf deinem Gerät
- ⚡ Schnell und reaktionsschnell - keine Server-Latenz
- 🌐 Offline-fähig
- 🇩🇪 Unterstützung für deutsche Umlaute (ä, ö, ü, ß)

## 🚀 Schnellstart

### Voraussetzungen

- Node.js 18+ und npm

### Installation

```bash
# Dependencies installieren
npm install

# Development Server starten
npm run dev
```

Die Anwendung läuft dann auf **http://localhost:3000**

### Build für Production

```bash
# Production Build erstellen
npm run build

# Build lokal testen
npm run preview
```

## 📖 Nutzung

1. Öffne die Anwendung im Browser
2. Gib einen Titel für dein Kreuzworträtsel ein
3. Füge mindestens 3 Frage-Antwort-Paare hinzu
4. Klicke auf "Vorschau erstellen" um das Layout zu sehen
5. Klicke auf "PDF generieren" um das Kreuzworträtsel herunterzuladen

### Beispiel laden

Klicke auf "Beispiel laden" um ein vordefiniertes Kinder-Kreuzworträtsel zum Thema "Tiere" zu laden.

## 🏗️ Projektstruktur

```
src/
├── models/
│   ├── Direction.ts          # Enum für Wortrichtung
│   ├── WordEntry.ts          # Frage-Antwort-Paar
│   ├── PlacedWord.ts         # Platziertes Wort im Grid
│   ├── CrosswordGrid.ts      # Grid-Datenstruktur
│   └── CrosswordPuzzle.ts    # Komplettes Puzzle
├── services/
│   ├── WordPlacementService.ts    # Kern-Algorithmus
│   ├── CrosswordLayoutService.ts  # Layout-Orchestrierung
│   └── PDFGeneratorService.ts     # PDF-Generierung
├── main.ts                   # App-Logik und UI-Handler
└── style.css                 # Styling
```

## 🔧 Technologie-Stack

- **TypeScript** - Type-safe JavaScript
- **Vite** - Schneller Build-Tool und Dev-Server
- **jsPDF** - Client-seitige PDF-Generierung
- **Vanilla JavaScript** - Keine Framework-Abhängigkeiten

## 🎯 Algorithmus

Der Generator verwendet einen intelligenten Platzierungsalgorithmus:

1. **Sortierung**: Wörter werden nach Länge sortiert (längste zuerst)
2. **Initialisierung**: Das erste Wort wird horizontal in der Mitte platziert
3. **Iterative Platzierung**:
   - Für jedes weitere Wort werden alle möglichen Kreuzungspunkte gefunden
   - Kreuzungen basieren auf gemeinsamen Buchstaben
   - Konflikte werden geprüft (Überschneidungen, zu nahe Wörter)
   - Beste Position wird basierend auf Anzahl Kreuzungen gewählt
4. **Optimierung**: Grid wird auf minimale Größe zugeschnitten
5. **Nummerierung**: Wörter werden automatisch nummeriert (links nach rechts, oben nach unten)

## 📊 Validierungsregeln

- **Titel**: Nicht leer
- **Anzahl Einträge**: Minimum 3, Maximum 50
- **Antworten**: Nur Buchstaben (A-Z, Umlaute ä, ö, ü, ß erlaubt)
- **Fragen**: Nicht leer

## 🎨 Features der UI

- Responsive Design (Desktop & Mobile)
- Live-Vorschau des Kreuzworträtsels
- Drag-and-drop-freundliche Eingabefelder
- Automatische Grid-Visualisierung
- Getrennte Anzeige von Waagerecht/Senkrecht-Hinweisen

## 🚀 Deployment

Die Anwendung kann auf jedem statischen Hosting-Service deployed werden:

- **Vercel**: `vercel --prod`
- **Netlify**: Drag & Drop des `dist` Ordners
- **GitHub Pages**: Mit GitHub Actions
- **Cloudflare Pages**: Automatisches Deployment

## 🔄 Migration von Java

Diese TypeScript-Version ist eine vollständige Portierung der Java/Spring Boot Anwendung:

- ✅ Kompletter Algorithmus portiert (WordPlacementService)
- ✅ Alle Datenmodelle portiert
- ✅ PDF-Generierung mit jsPDF statt iText
- ✅ Moderne, verbesserte UI
- ✅ Client-only - kein Backend nötig

### Unterschiede zur Java-Version

- **Keine Server-Komponente**: Alles läuft im Browser
- **jsPDF statt iText**: Unterschiedliche PDF-Bibliothek
- **Moderne UI**: Komplett neu gestaltet mit modernem CSS
- **Keine Persistenz**: Kreuzworträtsel werden nicht gespeichert (könnte mit localStorage ergänzt werden)

## 🤝 Beitragen

Verbesserungsvorschläge und Pull Requests sind willkommen!

## 📄 Lizenz

MIT License
