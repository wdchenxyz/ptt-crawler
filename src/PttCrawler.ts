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

export interface ArticleComment {
  tag: string;
  userId: string;
  text: string;
  timestamp: string;
}

export interface ArticleContent {
  content: string;
  comments: ArticleComment[];
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

  protected getCurrentDate(): Date {
    return new Date();
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
    const entriesToProcess = separatorIndex >= 0 ? validEntries.slice(0, separatorIndex) : validEntries;

    entriesToProcess.forEach((element) => {
      const title = $(element).find('.title a').text().trim();
      const link = $(element).find('.title a').attr('href') || '';
      const author = $(element).find('.meta .author').text().trim();
      const date = $(element).find('.meta .date').text().trim();
      const nrecText = $(element).find('.nrec').text().trim();
      const points = this.parsePushCount(nrecText);

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
  private parseArticleDate(rawDate: string): Date | null {
    const match = rawDate.trim().match(/^(\d{1,2})\/(\d{1,2})$/);
    if (!match) {
      return null;
    }

    const month = parseInt(match[1], 10) - 1;
    const day = parseInt(match[2], 10);
    const currentDate = this.getCurrentDate();
    const candidate = new Date(currentDate.getFullYear(), month, day);

    if (candidate.getTime() > currentDate.getTime()) {
      candidate.setFullYear(candidate.getFullYear() - 1);
    }

    return candidate;
  }

  private applyFilters(articles: Article[], filters: FilterOptions): Article[] {
    const startDate = filters.startDate ? new Date(filters.startDate) : null;
    const endDate = filters.endDate ? new Date(filters.endDate) : null;

    return articles.filter(article => {
      const matchesKeyword = filters.keyword ? article.title.includes(filters.keyword) : true;
      const matchesAuthor = filters.author ? article.author === filters.author : true;

      let matchesDate = true;
      if (filters.startDate || filters.endDate) {
        const articleDate = this.parseArticleDate(article.date);
        if (!articleDate) {
          matchesDate = false;
        } else {
          matchesDate = (!startDate || articleDate >= startDate) && (!endDate || articleDate <= endDate);
        }
      }

      const matchesMinPushCount = filters.minPushCount ? article.points >= filters.minPushCount : true;

      return matchesKeyword && matchesAuthor && matchesDate && matchesMinPushCount;
    });
  }

  private parsePushCount(pushText: string): number {
    const normalized = pushText.trim();
    if (!normalized) {
      return 0;
    }

    const numericValue = parseInt(normalized, 10);
    if (!Number.isNaN(numericValue)) {
      return numericValue;
    }

    if (/^爆+$/u.test(normalized)) {
      return 100;
    }

    const negativeMatch = normalized.match(/^X(\d)$/i);
    if (negativeMatch) {
      return -10 * parseInt(negativeMatch[1], 10);
    }

    return 0;
  }

  public async getArticleContent(articleURL: string): Promise<ArticleContent> {
    const response = await axios.get(articleURL, {
      headers: { 'Cookie': 'over18=1;' },
    });

    const $ = cheerio.load(response.data);
    const mainContent = $('#main-content');
    if (mainContent.length === 0) {
      return { content: '', comments: [] };
    }

    const contentLines: string[] = [];
    let reachedFooter = false;
    const isFooterLine = (text: string) => text.startsWith('※') || text.startsWith('--');

    mainContent.contents().each((_, node) => {
      if (reachedFooter) {
        return;
      }

      if (node.type === 'comment') {
        return;
      }

      if (node.type === 'text') {
        const text = (node.data ?? '').trim();
        if (!text) {
          return;
        }

        if (isFooterLine(text)) {
          reachedFooter = true;
          return;
        }

        contentLines.push(text);
        return;
      }

      if (node.type === 'tag') {
        const element = $(node);

        if (
          element.hasClass('article-metaline') ||
          element.hasClass('article-metaline-right') ||
          element.hasClass('push')
        ) {
          return;
        }

        if (element.is('br')) {
          return;
        }

        const text = element.text().trim();
        if (!text) {
          return;
        }

        if (isFooterLine(text)) {
          reachedFooter = true;
          return;
        }

        contentLines.push(text);
      }
    });

    const content = contentLines
      .map((line) => line.replace(/\u00a0/g, ' ').trim())
      .filter((line) => line.length > 0)
      .join('\n');

    const comments: ArticleComment[] = [];
    mainContent.find('.push').each((_, pushElement) => {
      const element = $(pushElement);
      const tag = element.find('.push-tag').text().trim();
      const userId = element.find('.push-userid').text().trim();
      const rawContent = element.find('.push-content').text();
      const text = rawContent.replace(/^\s*:\s*/, '').trim();
      const timestamp = element.find('.push-ipdatetime').text().trim();

      comments.push({ tag, userId, text, timestamp });
    });

    return { content, comments };
  }
}


export async function getImages(pageURL: string) {
  const response = await axios.get(pageURL, {
    headers: { 'Cookie': 'over18=1;' }, // For bypassing age restriction
  });

  const $ = cheerio.load(response.data);

  const imageLinks: string[] = [];
  const seenLinks = new Set<string>();
  let reachedSeparator = false;

  const imagePattern = /\.(jpe?g|png|gif)(?:\?.*)?$/i;

  const recordImage = (candidate?: string | null) => {
    if (!candidate) {
      return;
    }

    const normalized = candidate.trim();
    if (!imagePattern.test(normalized)) {
      return;
    }

    if (!seenLinks.has(normalized)) {
      seenLinks.add(normalized);
      imageLinks.push(normalized);
    }
  };

  // Iterate through children of #main-content
  $('#main-content').children().each((_, element) => {
    const text = $(element).text().trim();
    if (text.includes('※')) {
      reachedSeparator = true;
      return false; // Break the loop
    }

    // If not reached separator, collect image links
    if (!reachedSeparator) {
      recordImage($(element).attr('href'));
      recordImage($(element).attr('src'));

      $(element)
        .find('a, img')
        .each((_, child) => {
          recordImage($(child).attr('href'));
          recordImage($(child).attr('src'));
        });

      const inlineLinks = text.match(/https?:\/\/\S+/g);
      if (inlineLinks) {
        inlineLinks.forEach((link) => recordImage(link));
      }
    }
  });
  return imageLinks;
}
