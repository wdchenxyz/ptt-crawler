import { run } from './runner';
import './PttCrawler.concurrency.test';
import './PttCrawler.pagination.test';
import './PttCrawler.separator.test';
import './PttCrawler.date-filter.test';

run().catch((error) => {
  console.error(error);
  throw error;
});
