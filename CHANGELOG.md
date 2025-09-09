# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-09-09

## [0.0.8] - 2025-09-08

## [0.0.7] - 2025-09-08

## [0.0.6] - 2025-09-08

## [0.0.5] - 2025-09-08

## [0.0.4] - 2025-09-08

## [0.0.3] - 2025-09-08

## [0.0.2] - 2025-09-08

## [0.0.1] - 2025-09-08

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

* * *

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
- **Types**: `QuiltedImage`, `Options`, `PackOptions` type exports.
- **Styles**: `dist/style.css` shipped; optional `injectDefaultCSS` fallback.
- **CDN usage** (example):
  ```html
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/quilted-gallery@0.0.0/dist/style.css">
  <script src="https://cdn.jsdelivr.net/npm/quilted-gallery@0.0.0/dist/index.global.js" defer></script>
  ```

[unreleased]: https://github.com/brauliodavid/quilted-gallery/compare/0.1.0...HEAD
[0.1.0]: https://github.com/brauliodavid/quilted-gallery/compare/0.0.8...0.1.0
[0.0.8]: https://github.com/brauliodavid/quilted-gallery/compare/0.0.7...0.0.8
[0.0.7]: https://github.com/brauliodavid/quilted-gallery/compare/0.0.6...0.0.7
[0.0.6]: https://github.com/brauliodavid/quilted-gallery/compare/0.0.5...0.0.6
[0.0.5]: https://github.com/brauliodavid/quilted-gallery/compare/0.0.4...0.0.5
[0.0.4]: https://github.com/brauliodavid/quilted-gallery/compare/0.0.3...0.0.4
[0.0.3]: https://github.com/brauliodavid/quilted-gallery/compare/0.0.2...0.0.3
[0.0.2]: https://github.com/brauliodavid/quilted-gallery/compare/0.0.1...0.0.2
[0.0.1]: https://github.com/brauliodavid/quilted-gallery/compare/e5362b2023d55d57721c4d7839668609c1928b9d...0.0.1
