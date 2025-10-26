# Fetching Full Article Content

`PttCrawler#getArticleContent` retrieves the body text and push comments for a single post. Use it after you have already discovered the article URL (for example via `getArticles`).

## Import

```ts
import { PttCrawler } from 'ptt-crawler';
```

## Method Signature

```ts
getArticleContent(articleURL: string): Promise<ArticleContent>
```

### Parameters

- `articleURL` (`string`): Absolute PTT article URL. The crawler automatically sends the `over18` cookie, so you do not need to add headers manually.

### Returns

A promise that resolves to an `ArticleContent` object:

- `content` (`string`): Main body text with metadata/footer lines removed. Line breaks are preserved with `\n`.
- `comments` (`ArticleComment[]`): Push comments in on-page order. Each comment includes:
  - `tag` (`string`): Push tag, e.g. `推`, `噓`, `→`.
  - `userId` (`string`): Commenting user ID.
  - `text` (`string`): Comment body with the leading `:` removed.
  - `timestamp` (`string`): Timestamp as rendered on the page.

## Usage Example

```ts
const crawler = new PttCrawler('Gossiping');
const article = await crawler.getArticles(1).then((articles) => articles[0]);

if (!article) {
  throw new Error('No article found');
}

const details = await crawler.getArticleContent(article.link);

console.log(details.content);
// => Full text of the post

console.log(details.comments);
/*
[
  { tag: '推', userId: 'user123', text: 'great post', timestamp: '09/10 08:15' },
  { tag: '噓', userId: 'critic', text: 'disagree', timestamp: '09/10 08:16' },
]
*/
```

## Notes

- The method stops reading content once it encounters standard PTT footer markers (`※`, `--`).
- Empty lines and metadata (`article-metaline`, push blocks) are excluded from `content`.
- Push comments are returned exactly as shown on the page; normalize or filter as needed in your application.
