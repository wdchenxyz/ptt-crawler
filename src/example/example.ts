import { PttCrawler, getImages } from '../PttCrawler';

async function main() {
  const crawler = new PttCrawler('Gossiping');

  // Get articles from the first 2 pages, filter for push count >= 10
  // const articles = await crawler.getArticles(5, { minPushCount: 10, });
  // console.log('Filtered Articles:', articles);

  const articleURL = "https://www.ptt.cc/bbs/Beauty/M.1736911963.A.5E8.html";
  const links = await getImages(articleURL);
  console.log(links)
}

main().catch(console.error);
