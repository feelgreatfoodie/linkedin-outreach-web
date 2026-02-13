const APP_URL_KEY = 'outreach_app_url';
const SEEN_GUIDE_KEY = 'outreach_seen_guide';
const DEFAULT_URL = 'https://linkedin-outreach-web.vercel.app';

document.addEventListener('DOMContentLoaded', async () => {
  const appUrlInput = document.getElementById('app-url');
  const scrapeBtn = document.getElementById('scrape-btn');
  const downloadBtn = document.getElementById('download-btn');
  const statusEl = document.getElementById('status');
  const progressBar = document.getElementById('progress-bar');
  const progressFill = document.getElementById('progress-fill');
  const resultsEl = document.getElementById('results');
  const contentReady = document.getElementById('content-ready');
  const contentWrongPage = document.getElementById('content-wrong-page');

  // ── Help Guide Navigation ──
  const guideOverlay = document.getElementById('guide-overlay');
  const guidePages = document.querySelectorAll('.guide-page');
  const guideDots = document.querySelectorAll('.guide-dots .dot');
  const guidePrev = document.getElementById('guide-prev');
  const guideNext = document.getElementById('guide-next');
  let guidePage = 1;
  const totalPages = guidePages.length;

  function showGuidePage(page) {
    guidePage = page;
    guidePages.forEach((p, i) => p.classList.toggle('visible', i === page - 1));
    guideDots.forEach((d, i) => d.classList.toggle('active', i === page - 1));
    guidePrev.disabled = page === 1;
    guideNext.textContent = page === totalPages ? 'Got It' : 'Next';
  }

  function openGuide(startPage) {
    showGuidePage(startPage || 1);
    guideOverlay.classList.add('visible');
  }

  function closeGuide() {
    guideOverlay.classList.remove('visible');
    chrome.storage.local.set({ [SEEN_GUIDE_KEY]: true });
  }

  document.getElementById('help-btn').addEventListener('click', () => openGuide(1));
  document.getElementById('guide-close').addEventListener('click', closeGuide);
  const urlHelpLink = document.getElementById('url-help-link');
  if (urlHelpLink) urlHelpLink.addEventListener('click', () => openGuide(2));
  const wrongPageHelp = document.getElementById('wrong-page-help');
  if (wrongPageHelp) wrongPageHelp.addEventListener('click', () => openGuide(1));

  guidePrev.addEventListener('click', () => {
    if (guidePage > 1) showGuidePage(guidePage - 1);
  });
  guideNext.addEventListener('click', () => {
    if (guidePage < totalPages) showGuidePage(guidePage + 1);
    else closeGuide();
  });
  guideDots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const page = parseInt(dot.getAttribute('data-page'), 10);
      if (page) showGuidePage(page);
    });
  });

  // Show guide automatically on first use
  const guideState = await chrome.storage.local.get(SEEN_GUIDE_KEY);
  if (!guideState[SEEN_GUIDE_KEY]) {
    openGuide(1);
  }

  // Load saved app URL
  const stored = await chrome.storage.local.get(APP_URL_KEY);
  appUrlInput.value = stored[APP_URL_KEY] || DEFAULT_URL;

  // Save URL on change
  appUrlInput.addEventListener('change', () => {
    chrome.storage.local.set({ [APP_URL_KEY]: appUrlInput.value.trim() });
  });

  // Check if we're on the right page
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isConnectionsPage = tab?.url?.includes('linkedin.com/mynetwork/invite-connect/connections');

  if (isConnectionsPage) {
    contentReady.style.display = 'block';
  } else {
    contentWrongPage.style.display = 'block';
    return;
  }

  function setStatus(msg, type = '') {
    statusEl.textContent = msg;
    statusEl.className = type;
  }

  function setProgress(pct) {
    progressBar.style.display = 'block';
    progressFill.style.width = `${pct}%`;
  }

  // Scrape & send to app
  scrapeBtn.addEventListener('click', async () => {
    scrapeBtn.disabled = true;
    downloadBtn.disabled = true;
    setStatus('Starting scrape...');
    setProgress(5);

    try {
      const connections = await runScraper(tab.id, (msg, pct) => {
        setStatus(msg);
        if (pct) setProgress(pct);
      });

      if (connections.length === 0) {
        setStatus('No connections found. LinkedIn may have changed their page.', 'error');
        scrapeBtn.disabled = false;
        downloadBtn.disabled = false;
        return;
      }

      setStatus(`Sending ${connections.length} connections to app...`);
      setProgress(90);

      const appUrl = (appUrlInput.value.trim() || DEFAULT_URL).replace(/\/+$/, '');
      const res = await fetch(`${appUrl}/api/import-connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connections }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`App returned ${res.status}: ${text}`);
      }

      const result = await res.json();
      setProgress(100);
      setStatus('', 'success');

      resultsEl.style.display = 'block';
      resultsEl.innerHTML = `
        <div class="count">${result.added ?? connections.length}</div>
        connections imported${result.duplicates ? ` (${result.duplicates} duplicates skipped)` : ''}
      `;
    } catch (err) {
      setStatus(`Error: ${err.message}`, 'error');
    }

    scrapeBtn.disabled = false;
    downloadBtn.disabled = false;
  });

  // Download CSV
  downloadBtn.addEventListener('click', async () => {
    scrapeBtn.disabled = true;
    downloadBtn.disabled = true;
    setStatus('Starting scrape...');
    setProgress(5);

    try {
      const connections = await runScraper(tab.id, (msg, pct) => {
        setStatus(msg);
        if (pct) setProgress(pct);
      });

      if (connections.length === 0) {
        setStatus('No connections found.', 'error');
        scrapeBtn.disabled = false;
        downloadBtn.disabled = false;
        return;
      }

      setProgress(95);
      setStatus('Building CSV...');

      const csv = buildCSV(connections);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);

      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `linkedin-connections-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      setProgress(100);
      setStatus(`Downloaded ${connections.length} connections`, 'success');
    } catch (err) {
      setStatus(`Error: ${err.message}`, 'error');
    }

    scrapeBtn.disabled = false;
    downloadBtn.disabled = false;
  });
});

async function runScraper(tabId, onProgress) {
  // Inject and run the content script scraper
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: scrapeConnectionsFromPage,
    args: [],
  });

  // The content script returns a promise-like result via polling
  // But executeScript doesn't support long-running async well.
  // So we use message passing instead.

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Scraping timed out after 10 minutes'));
    }, 10 * 60 * 1000);

    chrome.runtime.onMessage.addListener(function listener(msg) {
      if (msg.type === 'scrape-progress') {
        onProgress(msg.message, msg.percent);
      }
      if (msg.type === 'scrape-done') {
        clearTimeout(timeout);
        chrome.runtime.onMessage.removeListener(listener);
        resolve(msg.connections);
      }
      if (msg.type === 'scrape-error') {
        clearTimeout(timeout);
        chrome.runtime.onMessage.removeListener(listener);
        reject(new Error(msg.error));
      }
    });
  });
}

// This function runs in the LinkedIn page context
function scrapeConnectionsFromPage() {
  (async () => {
    const seen = new Map();
    let loadCount = 0;
    const MAX_LOADS = 200;

    function sendProgress(message, percent) {
      chrome.runtime.sendMessage({ type: 'scrape-progress', message, percent });
    }

    // Read total count
    let totalExpected = 0;
    const bodyText = document.body.innerText;
    const m = bodyText.match(/([\d,]+)\s+connections?\b/i);
    if (m) totalExpected = parseInt(m[1].replace(/,/g, ''), 10);

    sendProgress(`Found ${totalExpected || '???'} connections. Scraping...`, 5);

    function extractVisible() {
      const results = [];
      const profileLinks = document.querySelectorAll('a[href*="/in/"]');

      profileLinks.forEach((anchor) => {
        if (anchor.querySelector('img, svg, figure')) return;
        const url = anchor.href.split('?')[0];

        let card = anchor;
        for (let i = 0; i < 8; i++) {
          card = card.parentElement;
          if (!card) break;
          if (card.querySelector('[data-view-name="message-button"]')) break;
        }
        if (!card) return;

        const paragraphs = card.querySelectorAll('p');
        let name = '', title = '', connectedOn = '';

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

        if (name && name.length > 1 && !seen.has(url)) {
          seen.set(url, { name, title, url, connectedOn });
          results.push({ name, title, url, connectedOn });
        }
      });

      return results;
    }

    function clickLoadMore() {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        const text = (btn.textContent || '').trim().toLowerCase();
        if (text.includes('load more') || text === 'show more results') {
          btn.scrollIntoView();
          btn.click();
          return true;
        }
      }
      return false;
    }

    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Initial extract
    extractVisible();
    sendProgress(`Extracted ${seen.size} connections...`, 10);

    // Click Load More repeatedly
    let noNewCount = 0;
    while (loadCount < MAX_LOADS && noNewCount < 5) {
      window.scrollTo(0, document.body.scrollHeight);
      await sleep(500);

      if (!clickLoadMore()) {
        // No button found — try one more extract
        window.scrollTo(0, document.body.scrollHeight);
        await sleep(2000);
        extractVisible();
        break;
      }

      loadCount++;
      await sleep(2500);

      window.scrollTo(0, document.body.scrollHeight);
      await sleep(1000);

      const before = seen.size;
      extractVisible();
      const added = seen.size - before;

      if (added > 0) {
        noNewCount = 0;
        const pct = totalExpected > 0
          ? Math.min(85, Math.round(10 + (seen.size / totalExpected) * 80))
          : Math.min(85, 10 + loadCount);
        if (loadCount % 3 === 0) {
          sendProgress(`${seen.size}${totalExpected ? '/' + totalExpected : ''} connections...`, pct);
        }
      } else {
        noNewCount++;
      }

      if (totalExpected > 0 && seen.size >= totalExpected) break;
    }

    const connections = Array.from(seen.values());
    chrome.runtime.sendMessage({
      type: 'scrape-done',
      connections,
    });
  })().catch((err) => {
    chrome.runtime.sendMessage({
      type: 'scrape-error',
      error: err.message || 'Unknown error',
    });
  });
}

function buildCSV(connections) {
  const esc = (s) => s.replace(/"/g, '""');
  let csv = 'First Name,Last Name,Title,Company,LinkedIn URL,Connected On\n';

  for (const conn of connections) {
    const parts = conn.name.split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';

    let jobTitle = conn.title;
    let company = '';
    const atMatch = conn.title.match(/^(.+?)\s+(?:at|@)\s+(.+)$/i);
    if (atMatch) {
      jobTitle = atMatch[1];
      company = atMatch[2];
    }
    if (!company && conn.title.includes(' | ')) {
      const pipeMatch = conn.title.match(/^(.+?)\s*\|\s*(.+)$/);
      if (pipeMatch) {
        jobTitle = pipeMatch[1];
        company = pipeMatch[2];
      }
    }

    csv += `"${esc(firstName)}","${esc(lastName)}","${esc(jobTitle)}","${esc(company)}","${conn.url}","${esc(conn.connectedOn)}"\n`;
  }

  return csv;
}
