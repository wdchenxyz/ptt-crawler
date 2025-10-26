import axios from 'axios';
import { PttCrawler } from '../PttCrawler';
import { expectDeepEqual, expectEqual, test } from './runner';

const BOARD = 'TestBoard';

const articleHTML = `
<div id="main-content">
  <div class="article-metaline">
    <span class="article-meta-tag">作者</span>
    <span class="article-meta-value">tester (Tester)</span>
  </div>
  <div class="article-metaline">
    <span class="article-meta-tag">標題</span>
    <span class="article-meta-value">[Test] Example Post</span>
  </div>
  <div class="article-metaline-right">
    <span class="article-meta-tag">時間</span>
    <span class="article-meta-value">Mon Sep 09 12:34:56 2024</span>
  </div>
  First line of main content.
  <span>Second line of main content.</span>
  <div class="push">
    <span class="push-tag">推</span>
    <span class="push-userid">userA</span>
    <span class="push-content">: great article</span>
    <span class="push-ipdatetime"> 09/09 12:00</span>
  </div>
  <div class="push">
    <span class="push-tag">噓</span>
    <span class="push-userid">userB</span>
    <span class="push-content">: disagree</span>
    <span class="push-ipdatetime"> 09/09 12:05</span>
  </div>
  <span>※ 發信站: 批踢踢實業坊(ptt.cc)</span>
</div>
`;

test('getArticleContent extracts main content and push comments', async () => {
  const originalGet = axios.get.bind(axios);
  axios.get = (async () => ({ data: articleHTML })) as typeof axios.get;

  try {
    const crawler = new PttCrawler(BOARD);
    const { content, comments } = await crawler.getArticleContent(
      `https://www.ptt.cc/bbs/${BOARD}/M.test.html`,
    );

    expectEqual(content, 'First line of main content.\nSecond line of main content.');
    expectDeepEqual(comments, [
      {
        tag: '推',
        userId: 'userA',
        text: 'great article',
        timestamp: '09/09 12:00',
      },
      {
        tag: '噓',
        userId: 'userB',
        text: 'disagree',
        timestamp: '09/09 12:05',
      },
    ]);
  } finally {
    axios.get = originalGet;
  }
});
