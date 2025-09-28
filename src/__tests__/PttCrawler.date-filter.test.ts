import axios from 'axios';
import { PttCrawler } from '../PttCrawler';
import { expectDeepEqual, test } from './runner';

class FixedDateCrawler extends PttCrawler {
  protected getCurrentDate(): Date {
    return new Date('2025-01-02T00:00:00Z');
  }
}

const BOARD = 'TestBoard';

const pageHTML = `
<div class="btn-group-paging">
  <a class="btn" href="/bbs/${BOARD}/index12345.html">‹ 上頁</a>
</div>
<div class="r-list-container">
  <div class="r-ent">
    <div class="title"><a href="/bbs/${BOARD}/M.20.html">Year End Post</a></div>
    <div class="meta">
      <div class="author">authorY</div>
      <div class="date"> 12/31</div>
    </div>
    <div class="nrec"><span class="hl">8</span></div>
  </div>
  <div class="r-ent">
    <div class="title"><a href="/bbs/${BOARD}/M.21.html">New Year Post</a></div>
    <div class="meta">
      <div class="author">authorN</div>
      <div class="date"> 1/01</div>
    </div>
    <div class="nrec"><span class="hl">6</span></div>
  </div>
  <div class="r-list-sep"></div>
</div>
`;

test('applies year-aware date filtering', async () => {
  const originalGet = axios.get.bind(axios);
  axios.get = (async () => ({ data: pageHTML })) as typeof axios.get;

  try {
    const crawler = new FixedDateCrawler(BOARD);
    const articles = await crawler.getArticles(1, {
      startDate: '2024-12-01',
      endDate: '2024-12-31',
    });

    expectDeepEqual(articles.map((article) => article.title), ['Year End Post']);
  } finally {
    axios.get = originalGet;
  }
});
