import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { join } from 'path';

const PROFILE_DIR = join(process.env.HOME || '/tmp', '.linkedin-scraper-profile');
const CONNECTIONS_URL = 'https://www.linkedin.com/mynetwork/invite-connect/connections/';
const MAX_LOADS = 200;

interface Connection {
  name: string;
  title: string;
  url: string;
  connectedOn: string;
}

async function main() {
  console.log('[Scraper] Launching browser (headed mode)...');

  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    viewport: { width: 1280, height: 900 },
  });

  const page = context.pages()[0] || await context.newPage();

  console.log('[Scraper] Navigating to LinkedIn connections...');
  await page.goto(CONNECTIONS_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Check if we need to log in
  const currentUrl = page.url();
  if (currentUrl.includes('/login') || currentUrl.includes('/authwall') || currentUrl.includes('/checkpoint')) {
    console.log('');
    console.log('=== LOG IN TO LINKEDIN ===');
    console.log('Please log in to LinkedIn in the browser window.');
    console.log('Waiting up to 3 minutes...');
    console.log('');
    await page.waitForURL('**/connections/**', { timeout: 180000 });
    console.log('[Scraper] Login detected!');
  }

  console.log('[Scraper] Waiting for connections to load...');
  await page.waitForTimeout(5000);

  // Make sure we're still on the connections page
  if (!page.url().includes('/connections')) {
    console.log('[Scraper] Redirected away from connections page. Navigating back...');
    await page.goto(CONNECTIONS_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);
  }

  // Read total connection count
  const totalExpected = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    const m = bodyText.match(/([\d,]+)\s+connections?\b/i);
    return m ? parseInt(m[1].replace(/,/g, ''), 10) : 0;
  });
  console.log(`[Scraper] Page shows ${totalExpected || '???'} total connections`);

  const seen = new Map<string, Connection>();
  let loadCount = 0;
  let consecutiveNoNew = 0;

  // Extract visible connections from the DOM
  async function extractVisible(): Promise<number> {
    try {
      const batch = await page.evaluate(() => {
        const results: { name: string; title: string; url: string; connectedOn: string }[] = [];
        const profileLinks = document.querySelectorAll('a[href*="/in/"]');

        profileLinks.forEach((link) => {
          const anchor = link as HTMLAnchorElement;
          if (anchor.querySelector('img, svg, figure')) return;

          const url = anchor.href.split('?')[0];

          // Walk up to find card container (has Message button)
          let card: Element | null = anchor;
          for (let i = 0; i < 8; i++) {
            card = card.parentElement;
            if (!card) break;
            if (card.querySelector('[data-view-name="message-button"]')) break;
          }
          if (!card) return;

          // Parse <p> elements: first = name, second = title, "Connected on..." = date
          const paragraphs = card.querySelectorAll('p');
          let name = '';
          let title = '';
          let connectedOn = '';

          paragraphs.forEach((p) => {
            const text = (p.textContent || '').trim();
            if (!text || text.length < 2) return;
            if (text.startsWith('Connected on')) {
              connectedOn = text.replace('Connected on ', '');
            } else if (!name) {
              name = text;
            } else if (!title) {
              title = text;
            }
          });

          if (!name || name.length < 2) return;
          results.push({ name, title, url, connectedOn });
        });

        return results;
      });

      let newCount = 0;
      for (const conn of batch) {
        if (!seen.has(conn.url)) {
          seen.set(conn.url, conn);
          newCount++;
        }
      }
      return newCount;
    } catch (err) {
      console.log(`[Scraper] Extract error (will retry): ${(err as Error).message?.slice(0, 80)}`);
      return 0;
    }
  }

  // Click "Load more" button
  async function clickLoadMore(): Promise<boolean> {
    try {
      // Use Playwright's text locator (more reliable than evaluate)
      const loadMoreBtn = page.getByRole('button', { name: /load more/i });
      if (await loadMoreBtn.isVisible({ timeout: 2000 })) {
        await loadMoreBtn.scrollIntoViewIfNeeded();
        await loadMoreBtn.click();
        return true;
      }
    } catch {
      // Fallback: try evaluate-based search
      try {
        return await page.evaluate(() => {
          const buttons = document.querySelectorAll('button');
          for (const btn of buttons) {
            const text = (btn.textContent || '').trim().toLowerCase();
            if (text.includes('load more') || text.includes('show more')) {
              btn.scrollIntoView();
              btn.click();
              return true;
            }
          }
          return false;
        });
      } catch {
        return false;
      }
    }
    return false;
  }

  console.log('[Scraper] Extracting connections...');

  // Initial extraction
  await extractVisible();
  console.log(`[Scraper] Initial batch: ${seen.size} connections`);

  // Click "Load more" repeatedly
  while (loadCount < MAX_LOADS && consecutiveNoNew < 5) {
    // Scroll to bottom to make button visible
    try {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    } catch { /* ignore */ }
    await page.waitForTimeout(500);

    const clicked = await clickLoadMore();

    if (!clicked) {
      console.log('[Scraper] No "Load more" button found.');
      await page.waitForTimeout(2000);
      await extractVisible();
      break;
    }

    loadCount++;

    // Wait for content to render
    await page.waitForTimeout(2500);

    // Scroll down and extract
    try {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    } catch { /* ignore */ }
    await page.waitForTimeout(1000);

    const newCount = await extractVisible();

    if (newCount > 0) {
      consecutiveNoNew = 0;
      if (loadCount % 5 === 0 || loadCount === 1) {
        console.log(`[Scraper] ${seen.size} connections after ${loadCount} loads`);
      }
    } else {
      consecutiveNoNew++;
    }

    if (totalExpected > 0 && seen.size >= totalExpected) {
      console.log(`[Scraper] Reached expected total (${totalExpected}).`);
      break;
    }
  }

  // Final extraction passes
  for (let i = 0; i < 3; i++) {
    try {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    } catch { break; }
    await page.waitForTimeout(1500);
    await extractVisible();
  }

  const connections = Array.from(seen.values());
  console.log(`[Scraper] Total: ${connections.length} connections after ${loadCount} "Load more" clicks`);

  if (connections.length === 0) {
    console.error('[Scraper] No connections extracted!');
    await page.screenshot({ path: join(process.cwd(), 'linkedin-debug.png') });
    await context.close();
    process.exit(1);
  }

  // Build CSV
  let csv = 'First Name,Last Name,Title,Company,LinkedIn URL,Connected On\n';
  for (const conn of connections) {
    const parts = conn.name.split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';

    let jobTitle = conn.title;
    let company = '';
    // "Title at Company" or "Title @ Company"
    const atMatch = conn.title.match(/^(.+?)\s+(?:at|@)\s+(.+)$/i);
    if (atMatch) {
      jobTitle = atMatch[1];
      company = atMatch[2];
    }
    // "Title | Company" pattern
    if (!company && conn.title.includes(' | ')) {
      const pipeMatch = conn.title.match(/^(.+?)\s*\|\s*(.+)$/);
      if (pipeMatch) {
        jobTitle = pipeMatch[1];
        company = pipeMatch[2];
      }
    }

    csv += `"${esc(firstName)}","${esc(lastName)}","${esc(jobTitle)}","${esc(company)}","${conn.url}","${esc(conn.connectedOn)}"\n`;
  }

  const outputPath = join(process.cwd(), 'linkedin-connections.csv');
  writeFileSync(outputPath, csv);

  console.log('');
  console.log(`[Scraper] Done! Exported ${connections.length} connections`);
  console.log(`[Scraper] CSV: ${outputPath}`);
  if (totalExpected > 0 && connections.length < totalExpected) {
    console.log(`[Scraper] Coverage: ${connections.length}/${totalExpected} (${Math.round(100 * connections.length / totalExpected)}%)`);
  }
  console.log('');

  await context.close();
}

function esc(s: string): string {
  return s.replace(/"/g, '""');
}

main().catch((err) => {
  console.error('[Scraper] Fatal error:', err);
  process.exit(1);
});
