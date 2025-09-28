# Refactoring & Performance Suggestions

## Concurrency
- **src/PttCrawler.ts:26**: Fetch pages concurrently instead of sequential `await` in the loop by collecting URLs and using `Promise.all` to reduce total crawl time when `pages > 1`.

## Code Clarity
- **src/PttCrawler.ts:53**: Remove the `async` modifier from `setLastPageNumber` because the body is synchronous; this prevents accidental fire-and-forget behaviour if future changes include awaits.

## Edge Cases
- **src/PttCrawler.ts:71**: Handle missing `.r-list-sep`; when `separatorIndex` is `-1`, fall back to the full `.r-ent` list to avoid dropping the last article.

## Date Handling
- **src/PttCrawler.ts:95**: Replace `new Date(article.date)` parsing with logic that normalizes PTT date strings (e.g., inject current year) so start/end filters behave predictably.

## Image Extraction
- **src/PttCrawler.ts:119**: Pull URLs from `href`/`src` attributes within `#main-content` instead of relying on text content to capture linked images reliably.

## Push Count Parsing
- **src/PttCrawler.ts:81**: Read the entire `.nrec` block to support values like `爆` or negative pushes, mapping them to numbers before applying `minPushCount` filters.
