import { run } from './runner';
import './PttCrawler.concurrency.test';

run().catch((error) => {
  console.error(error);
  throw error;
});
