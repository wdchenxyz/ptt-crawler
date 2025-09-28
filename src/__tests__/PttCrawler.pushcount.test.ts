import axios from 'axios';
import { PttCrawler } from '../PttCrawler';
import { expectDeepEqual, test } from './runner';

const BOARD = 'TestBoard';

const pageHTML = `
<div class="btn-group-paging">
  <a class="btn" href="/bbs/${BOARD}/index12345.html">‹ 上頁</a>
</div>
<div class="r-list-container">
  <div class="r-ent">
    <div class="title"><a href="/bbs/${BOARD}/M.30.html">Explosive Post</a></div>
    <div class="meta">
      <div class="author">authorE</div>
      <div class="date"> 9/05</div>
    </div>
    <div class="nrec"><span class="hl">爆</span></div>
  </div>
  <div class="r-ent">
    <div class="title"><a href="/bbs/${BOARD}/M.31.html">Positive Post</a></div>
    <div class="meta">
      <div class="author">authorP</div>
      <div class="date"> 9/04</div>
    </div>
    <div class="nrec">15</div>
  </div>
  <div class="r-ent">
    <div class="title"><a href="/bbs/${BOARD}/M.32.html">Controversial Post</a></div>
    <div class="meta">
      <div class="author">authorC</div>
      <div class="date"> 9/03</div>
    </div>
    <div class="nrec">X2</div>
  </div>
  <div class="r-list-sep"></div>
</div>
`;

test('parses push counts including explosive and negative values', async () => {
  const originalGet = axios.get.bind(axios);
  axios.get = (async () => ({ data: pageHTML })) as typeof axios.get;

  try {
    const crawler = new PttCrawler(BOARD);
    const allArticles = await crawler.getArticles(1);
    expectDeepEqual(allArticles.map((article) => article.points), [100, 15, -20]);

    const filtered = await crawler.getArticles(1, { minPushCount: 10 });
    expectDeepEqual(filtered.map((article) => article.title), ['Explosive Post', 'Positive Post']);
  } finally {
    axios.get = originalGet;
  }
});
