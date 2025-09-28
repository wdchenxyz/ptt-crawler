import axios from 'axios';
import { expectDeepEqual, test } from './runner';
import { getImages } from '../PttCrawler';

const pageHTML = `
<div id="main-content">
  <a href="https://i.example.com/a.jpg">Image Link</a>
  <div>
    <img src="https://i.example.com/b.png?size=large" />
  </div>
  <p>https://i.example.com/c.gif</p>
  <span>※ 發信站: 批踢踢實業坊(ptt.cc)</span>
  <a href="https://i.example.com/d.jpg">Ignored After Separator</a>
</div>
`;

test('extracts image URLs from attributes and inline links', async () => {
  const originalGet = axios.get.bind(axios);
  axios.get = (async () => ({ data: pageHTML })) as typeof axios.get;

  try {
    const images = await getImages('https://www.ptt.cc/bbs/TestBoard/M.0.html');
    expectDeepEqual(images, [
      'https://i.example.com/a.jpg',
      'https://i.example.com/b.png?size=large',
      'https://i.example.com/c.gif',
    ]);
  } finally {
    axios.get = originalGet;
  }
});
