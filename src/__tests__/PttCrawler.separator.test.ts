import axios from 'axios';
import { PttCrawler } from '../PttCrawler';
import { expectDeepEqual, expectEqual, test } from './runner';

const BOARD = 'TestBoard';

const pageHTML = `
<div class="r-list-container">
  <div class="r-ent">
    <div class="title"><a href="/bbs/${BOARD}/M.10.html">First Without Separator</a></div>
    <div class="meta">
      <div class="author">authorA</div>
      <div class="date"> 9/07</div>
    </div>
    <div class="nrec"><span class="hl">7</span></div>
  </div>
  <div class="r-ent">
    <div class="title"><a href="/bbs/${BOARD}/M.11.html">Second Without Separator</a></div>
    <div class="meta">
      <div class="author">authorB</div>
      <div class="date"> 9/06</div>
    </div>
    <div class="nrec"><span class="hl">2</span></div>
  </div>
</div>
`;

test('keeps all entries when separator is missing', async () => {
  const originalGet = axios.get.bind(axios);
  axios.get = (async () => ({ data: pageHTML })) as typeof axios.get;

  try {
    const crawler = new PttCrawler(BOARD);
    const articles = await crawler.getArticles(1);

    expectEqual(articles.length, 2);
    expectDeepEqual(
      articles.map((article) => article.title),
      ['First Without Separator', 'Second Without Separator'],
    );
  } finally {
    axios.get = originalGet;
  }
});
