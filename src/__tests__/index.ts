import { run } from './runner';
import './PttCrawler.concurrency.test';
import './PttCrawler.pagination.test';
import './PttCrawler.separator.test';
import './PttCrawler.date-filter.test';
import './getImages.image-extraction.test';
import './PttCrawler.pushcount.test';
import './PttCrawler.article-content.test';

run().catch((error) => {
  console.error(error);
  throw error;
});
