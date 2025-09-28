// Import necessary libraries
import axios from 'axios';
import * as cheerio from 'cheerio';

export interface Article {
  title: string;
  author: string;
  date: string;
  link: string;
  points: number;
}

interface FilterOptions {
  keyword?: string;
  author?: string;
  startDate?: string; // Format: YYYY-MM-DD
  endDate?: string;   // Format: YYYY-MM-DD
  minPushCount?: number
}

export class PttCrawler {
  private baseURL: string;
  private lastPageNumber: number;

  constructor(board: string) {
    this.baseURL = `https://www.ptt.cc/bbs/${board}`;
    this.lastPageNumber = 0;
  }


  // Get articles with optional filters
  public async getArticles(pages: number = 1, filters?: FilterOptions): Promise<Article[]> {
    if (pages <= 0) {
      return [];
    }

    const firstPageURL = `${this.baseURL}/index.html`;
    const articleCollections: Article[][] = [];

    const firstPageArticles = await this.fetchPage(firstPageURL);
    articleCollections.push(firstPageArticles);

    if (pages > 1) {
      const pageURLs: string[] = [];
      for (let i = 1; i < pages; i++) {
        const pageNumber = this.lastPageNumber - i;
        if (pageNumber < 0) {
          break;
        }
        pageURLs.push(`${this.baseURL}/index${pageNumber}.html`);
      }

      const remainingArticleCollections = await Promise.all(
        pageURLs.map((url) => this.fetchPage(url)),
      );
      articleCollections.push(...remainingArticleCollections);
    }

    let articles = articleCollections.reduce<Article[]>(
      (accumulator, collection) => accumulator.concat(collection),
      [],
    );

    if (filters) {
      articles = this.applyFilters(articles, filters);
    }

    return articles;
  }

  private setLastPageNumber($: cheerio.CheerioAPI): void {
    // Find the specific anchor tag and extract the href attribute
    const href = $('.btn-group-paging a')
      .filter((_, element) => $(element).text().includes('上頁')) // Locate the link with text "上頁"
      .attr('href');

    // Use a regular expression to extract the number from the href
    const match = href && href.match(/index(\d+)\.html/);
    const pageNumber = match ? parseInt(match[1], 10) : 10000;
    this.lastPageNumber = pageNumber + 1;
  }

  // Fetch articles from a specific page
  private async fetchPage(pageURL: string): Promise<Article[]> {
    const response = await axios.get(pageURL, {
      headers: { 'Cookie': 'over18=1;' }, // For bypassing age restriction
    });

    const $ = cheerio.load(response.data);
    if (pageURL.endsWith('index.html')) {
      this.setLastPageNumber($);
    }

    const articles: Article[] = [];

    // Select only .r-ent elements before the .r-list-sep element
    const validEntries = $('.r-list-container .r-ent').toArray(); // Get all .r-ent elements
    const separatorIndex = $('.r-list-container .r-list-sep').index(); // Find index of .r-list-sep

    // Iterate only up to the separatorIndex
    validEntries.slice(0, separatorIndex).forEach((element) => {
      const title = $(element).find('.title a').text().trim();
      const link = $(element).find('.title a').attr('href') || '';
      const author = $(element).find('.meta .author').text().trim();
      const date = $(element).find('.meta .date').text().trim();
      const nrecText = $(element).find('.nrec .hl').text().trim();
      const points = parseInt(nrecText) || 0; // Default to 0 if parsing fails

      if (title && link) {
        articles.push({
          title,
          author,
          date,
          link: `https://www.ptt.cc${link}`,
          points,
        });
      }
    });

    return articles;
  }

  // Apply filters to the articles
  private applyFilters(articles: Article[], filters: FilterOptions): Article[] {
    return articles.filter(article => {
      const matchesKeyword = filters.keyword ? article.title.includes(filters.keyword) : true;
      const matchesAuthor = filters.author ? article.author === filters.author : true;

      let matchesDate = true;
      if (filters.startDate || filters.endDate) {
        const articleDate = new Date(article.date);
        const startDate = filters.startDate ? new Date(filters.startDate) : null;
        const endDate = filters.endDate ? new Date(filters.endDate) : null;

        matchesDate = (!startDate || articleDate >= startDate) && (!endDate || articleDate <= endDate);
      }

      const matchesMinPushCount = filters.minPushCount ? article.points >= filters.minPushCount : true;

      return matchesKeyword && matchesAuthor && matchesDate && matchesMinPushCount;
    });
  }
}


export async function getImages(pageURL: string) {
  const response = await axios.get(pageURL, {
    headers: { 'Cookie': 'over18=1;' }, // For bypassing age restriction
  });

  const $ = cheerio.load(response.data);

  const imageLinks: string[] = [];
  let reachedSeparator = false;

  // Iterate through children of #main-content
  $('#main-content').children().each((_, element) => {
    const text = $(element).text().trim();
    if (text.includes('※')) {
      reachedSeparator = true;
      return false; // Break the loop
    }

    // If not reached separator, collect image links
    if (!reachedSeparator) {
      // console.log(href);
      const link = text
      if (link && (link.endsWith('.jpg') || link.endsWith('.jpeg') || link.endsWith('.png') || link.endsWith('.gif'))) {
        imageLinks.push(link);
      }
    }
  });
  return imageLinks;
}
