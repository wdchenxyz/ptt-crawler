import { run } from './runner';
import './PttCrawler.concurrency.test';
import './PttCrawler.pagination.test';

run().catch((error) => {
  console.error(error);
  throw error;
});
