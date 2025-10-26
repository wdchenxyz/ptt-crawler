# PTT Crawler

An ergonomic TypeScript wrapper around the public pages on [PTT](https://www.ptt.cc/). It scrapes board listings, individual articles, and rich media so you can build dashboards, archives, or notification bots without hand-rolling DOM parsing.

## Features
- Fetch paginated board listings with filters for keyword, author, date range, and minimum push count.
- Retrieve full article bodies together with structured push comments.
- Extract unique image URLs embedded anywhere within an article.
- Automatically bypasses PTT's `over18` gate and normalizes push counts (including `爆` and `X#` formats).
- Exposes strongly typed interfaces that make the results easy to consume in TypeScript projects.

## Installation

```bash
npm install
```

The crawler uses `axios` for HTTP requests and `cheerio` for parsing; both are installed as part of the project dependencies.

## Usage

```ts
import { PttCrawler, getImages } from 'ptt-crawler';

async function main() {
  const crawler = new PttCrawler('Gossiping');

  // Fetch the latest 2 pages and keep only popular posts about basketball
  const articles = await crawler.getArticles(2, {
    keyword: 'MLB',
    minPushCount: 20,
  });

  if (articles.length > 0) {
    const { link } = articles[0];

    const article = await crawler.getArticleContent(link);
    console.log(article.content);
    console.log(article.comments);

    const images = await getImages(link);
    console.log(images);
  }
}

main().catch(console.error);
```

> Note: The crawler sets the `over18=1` cookie on every request, so you do not have to manage the age gate yourself.

### API Overview

- `new PttCrawler(board: string)`
  Creates a crawler instance scoped to a specific board (e.g. `Gossiping`, `Beauty`, `Baseball`).

- `getArticles(pages = 1, filters?: FilterOptions): Promise<Article[]>`
  Scrapes the newest articles, traversing back `pages` worth of listings and optionally filtering the results. Supported filters:
  - `keyword`: substring match on the post title.
  - `author`: exact match on the author field.
  - `startDate` / `endDate`: inclusive bounds in `YYYY-MM-DD` format. Dates are adjusted across year boundaries based on the current date.
  - `minPushCount`: keep only posts that meet or exceed the normalized push score.

- `getArticleContent(articleURL: string): Promise<ArticleContent>`
  Downloads the article body, trims footer metadata, and returns structured push records (`{ tag, userId, text, timestamp }`).

- `getImages(articleURL: string): Promise<string[]>`
  Collects unique image links (`.jpg`, `.jpeg`, `.png`, `.gif`) from anchor tags, images, and inline URLs found before the article footer.

All methods return plain JavaScript objects with TypeScript types exported from `src/PttCrawler.ts`:

```ts
interface Article {
  title: string;
  author: string;
  date: string;      // PTT month/day format, e.g. "12/31"
  link: string;
  points: number;    // Normalized push score
}

interface ArticleContent {
  content: string;
  comments: ArticleComment[];
}
```

## Development

- `npm run build` – compile the TypeScript sources into `dist/`.
- `npm start` – run the example script at `dist/example/example.js` (build first).
- Update or extend the example in `src/example/example.ts` when adding new capabilities.
- Tests live under `src/__tests__/` (none yet); mock HTTP requests when you add coverage.
