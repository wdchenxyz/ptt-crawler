import axios from 'axios';
import { PttCrawler } from '../PttCrawler';
import { expectEqual, test } from './runner';

const BOARD = 'TestBoard';

const indexHTML = `
<div class="btn-group-paging">
  <a class="btn" href="/bbs/${BOARD}/index12345.html">‹ 上頁</a>
</div>
<div class="r-list-container">
  <div class="r-ent">
    <div class="title"><a href="/bbs/${BOARD}/M.3.html">Another Article</a></div>
    <div class="meta">
      <div class="author">author3</div>
      <div class="date"> 9/08</div>
    </div>
    <div class="nrec"><span class="hl">10</span></div>
  </div>
  <div class="r-list-sep"></div>
</div>
`;

test('updates lastPageNumber synchronously', async () => {
  const originalGet = axios.get.bind(axios);

  axios.get = (async () => ({ data: indexHTML })) as typeof axios.get;

  try {
    const crawler = new PttCrawler(BOARD);
    await crawler.getArticles(1);

    const internalState = crawler as unknown as { lastPageNumber: number };
    expectEqual(internalState.lastPageNumber, 12346);
  } finally {
    axios.get = originalGet;
  }
});
