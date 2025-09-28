import axios from 'axios';
import { PttCrawler } from '../PttCrawler';
import { expect, expectDeepEqual, expectEqual, test } from './runner';

const BOARD = 'TestBoard';
const BASE_URL = 'https://www.ptt.cc';

const indexHTML = `
<div class="btn-group-paging">
  <a class="btn" href="/bbs/${BOARD}/index12345.html">‹ 上頁</a>
</div>
<div class="r-list-container">
  <div class="r-ent">
    <div class="title"><a href="/bbs/${BOARD}/M.1.html">First Article</a></div>
    <div class="meta">
      <div class="author">author1</div>
      <div class="date"> 9/10</div>
    </div>
    <div class="nrec"><span class="hl">5</span></div>
  </div>
  <div class="r-list-sep"></div>
</div>
`;

const olderPageHTML = `
<div class="r-list-container">
  <div class="r-ent">
    <div class="title"><a href="/bbs/${BOARD}/M.2.html">Second Article</a></div>
    <div class="meta">
      <div class="author">author2</div>
      <div class="date"> 9/09</div>
    </div>
    <div class="nrec"><span class="hl">3</span></div>
  </div>
  <div class="r-list-sep"></div>
</div>
`;

test('fetches multiple pages and merges results', async () => {
  const originalGet = axios.get.bind(axios);
  const requestedURLs: string[] = [];
  const responses: Record<string, string> = {
    [`${BASE_URL}/bbs/${BOARD}/index.html`]: indexHTML,
    [`${BASE_URL}/bbs/${BOARD}/index12345.html`]: olderPageHTML,
  };

  axios.get = (async (url: string) => {
    requestedURLs.push(url);
    const data = responses[url];
    if (!data) {
      throw new Error(`Unexpected URL: ${url}`);
    }
    return { data };
  }) as typeof axios.get;

  try {
    const crawler = new PttCrawler(BOARD);
    const articles = await crawler.getArticles(2);

    expectEqual(articles.length, 2);
    expectDeepEqual(
      articles.map((article) => article.title),
      ['First Article', 'Second Article'],
    );
    expect(requestedURLs.includes(`${BASE_URL}/bbs/${BOARD}/index.html`));
    expect(requestedURLs.includes(`${BASE_URL}/bbs/${BOARD}/index12345.html`));
  } finally {
    axios.get = originalGet;
  }
});
