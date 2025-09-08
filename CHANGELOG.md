# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- (placeholder)

### Changed
- (placeholder)

### Fixed
- (placeholder)

### Deprecated
- (placeholder)

### Removed
- (placeholder)

### Security
- (placeholder)

---

## [0.0.0] - 2025-09-08
### Added
- **Vanilla TypeScript gallery core**: `QuiltedGallery` class with grid layout and greedy packer.
- **Packing**: `packGreedy` (v1) with options:
  - `cols`, `rowHeight`, `gap`
  - `maxColsPerItem`, `maxRowsPerItem`, `lookahead`
  - `respectExplicitSpans`, `allowReorder`
  - `highlightProb`, `maxHighlightsPerRow`
  - `heroColsMax`, `heroRowsMax`
  - `minTotalHeroes`, `forceHeroOnFirstRow`
- **Click API**: `onItemClick` callback and bubbling `itemClick` `CustomEvent` with `{ item, index, event }`.
- **Build outputs**: ESM (`dist/index.mjs`), CJS (`dist/index.cjs`), IIFE global (`dist/index.global.js` as `window.QuiltedGallery`).
- **Types**: `QuiltedItem`, `Options`, `PackOptions` type exports.
- **Styles**: `dist/style.css` shipped; optional `injectDefaultCSS` fallback.
- **CDN usage** (example):
  ```html
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/quilted-gallery@0.1.0/dist/style.css">
  <script src="https://cdn.jsdelivr.net/npm/quilted-gallery@0.1.0/dist/index.global.js" defer></script>
