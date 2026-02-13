'use client';

import { useState, useEffect, useRef } from 'react';
import { useProspects } from '@/hooks/use-prospects';
import { useSequences } from '@/hooks/use-sequences';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Download,
  Upload,
  Trash2,
  CheckCircle,
  XCircle,
  Copy,
  Bookmark,
} from 'lucide-react';
import { toast } from 'sonner';

// Readable version of the scraper — this is what gets copied/pasted into the console.
// Uses multiple selector strategies to handle LinkedIn DOM changes.
const SCRAPER_CODE = `(function() {
  var connections = [];
  var prevCount = 0;
  var staleRounds = 0;

  console.log('[Scraper] Starting LinkedIn connection export...');
  console.log('[Scraper] Auto-scrolling to load all connections...');

  function getCards() {
    // Try multiple selectors — LinkedIn changes these periodically
    var cards = document.querySelectorAll('li.mn-connection-card');
    if (cards.length === 0) cards = document.querySelectorAll('[data-view-name="connections-list-item"]');
    if (cards.length === 0) cards = document.querySelectorAll('.scaffold-finite-scroll__content > ul > li');
    if (cards.length === 0) {
      // Last resort: find all list items containing profile links
      var allLis = document.querySelectorAll('li');
      var filtered = [];
      allLis.forEach(function(li) {
        if (li.querySelector('a[href*="/in/"]') && li.textContent.length > 10) {
          filtered.push(li);
        }
      });
      cards = filtered;
    }
    return cards;
  }

  function scrollAndLoad() {
    window.scrollTo(0, document.body.scrollHeight);
    staleRounds++;

    setTimeout(function() {
      var cards = getCards();
      var currentCount = cards.length;

      if (currentCount > prevCount) {
        console.log('[Scraper] Found ' + currentCount + ' connections so far...');
        prevCount = currentCount;
        staleRounds = 0;
        scrollAndLoad();
      } else if (staleRounds < 4) {
        // Try a few more times in case of slow loading
        scrollAndLoad();
      } else {
        console.log('[Scraper] Finished scrolling. Extracting ' + currentCount + ' connections...');
        extractAll(cards);
      }
    }, 2000);
  }

  function extractAll(cards) {
    cards.forEach(function(card) {
      try {
        // Find profile link
        var link = card.querySelector('a[href*="/in/"]');
        var url = link ? link.href.split('?')[0] : '';

        // Find name — try specific selectors first, then fall back
        var nameEl = card.querySelector('.mn-connection-card__name')
          || card.querySelector('[class*="entity-result__title"] span[aria-hidden="true"]')
          || card.querySelector('span.t-16.t-black.t-bold')
          || (link && link.querySelector('span[aria-hidden="true"]'));
        var name = nameEl ? nameEl.textContent.trim() : '';

        // Find title/occupation
        var titleEl = card.querySelector('.mn-connection-card__occupation')
          || card.querySelector('[class*="entity-result__primary-subtitle"]')
          || card.querySelector('span.t-14.t-normal');
        var title = titleEl ? titleEl.textContent.trim() : '';

        if (name && name.length > 1) {
          connections.push({ name: name, title: title, url: url });
        }
      } catch(e) {
        // Skip cards that can't be parsed
      }
    });

    if (connections.length === 0) {
      console.error('[Scraper] Could not extract any connections. LinkedIn may have changed their page structure.');
      console.log('[Scraper] Try: Right-click a connection name > Inspect, then tell me what CSS classes you see.');
      alert('Scraper could not find connections. Check the browser console for details.');
      return;
    }

    // Build CSV
    var csv = 'First Name,Last Name,Title,Company,LinkedIn URL\\n';
    connections.forEach(function(r) {
      var parts = r.name.split(' ');
      var firstName = parts[0] || '';
      var lastName = parts.slice(1).join(' ') || '';
      // Split "Title at Company" pattern
      var titleParts = r.title.split(' at ');
      var jobTitle = titleParts[0] || '';
      var company = titleParts.slice(1).join(' at ') || '';
      csv += '"' + firstName.replace(/"/g, '""') + '","'
           + lastName.replace(/"/g, '""') + '","'
           + jobTitle.replace(/"/g, '""') + '","'
           + company.replace(/"/g, '""') + '","'
           + r.url + '"\\n';
    });

    // Trigger download
    var blob = new Blob([csv], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'linkedin-connections.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    console.log('[Scraper] Done! Exported ' + connections.length + ' connections.');
    alert('Exported ' + connections.length + ' connections! Check your downloads folder.');
  }

  scrollAndLoad();
})();`;

const SCRAPER_CODE_FIXED = SCRAPER_CODE;

export default function SettingsPage() {
  const { prospects, setProspects } = useProspects();
  const { sequences, setSequences } = useSequences();
  const bookmarkletRef = useRef<HTMLDivElement>(null);
  const [health, setHealth] = useState<{
    provider: string;
    providerName: string;
    model: string;
    modelLabel: string;
    configured: boolean;
  } | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => {});
  }, []);

  // Inject a real (non-React) anchor for the bookmarklet drag target
  // React blocks javascript: URLs, so we need raw DOM
  useEffect(() => {
    if (!bookmarkletRef.current) return;
    const container = bookmarkletRef.current;
    // Clear previous
    container.innerHTML = '';

    const minified = SCRAPER_CODE_FIXED
      .replace(/\n/g, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/\/\/.*/g, '');

    const a = document.createElement('a');
    a.href = 'javascript:' + minified;
    a.textContent = 'Export LinkedIn';
    a.className = 'inline-flex items-center gap-2 rounded-md bg-zinc-900 text-white px-4 py-2 text-sm font-medium no-underline cursor-grab';
    a.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Drag this link to your bookmarks bar — don\'t click it here!');
    });
    container.appendChild(a);
  }, []);

  const handleExport = () => {
    const data = {
      prospects,
      sequences,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `outreach-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.prospects) setProspects(data.prospects);
          if (data.sequences) setSequences(data.sequences);
          toast.success('Data imported');
        } catch {
          toast.error('Invalid backup file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleClear = () => {
    if (!confirm('This will delete all prospects and sequences. Are you sure?')) return;
    setProspects([]);
    setSequences([]);
    toast.success('All data cleared');
  };

  const copyConsoleCode = () => {
    navigator.clipboard.writeText(SCRAPER_CODE_FIXED);
    toast.success('Scraper code copied — paste into browser console on LinkedIn');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          AI provider configuration, data management, and tools
        </p>
      </div>

      {/* AI Provider */}
      <Card>
        <CardHeader>
          <CardTitle>AI Provider</CardTitle>
          <CardDescription>
            Configure via environment variables on your deployment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {health ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm">Provider</span>
                <span className="text-sm font-medium">{health.providerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Model</span>
                <span className="text-sm font-medium">{health.modelLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">API Key</span>
                <div className="flex items-center gap-2">
                  {health.configured ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">Configured</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-amber-500" />
                      <span className="text-sm text-amber-600">Not set (demo mode)</span>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}
          <Separator />
          <div className="text-xs text-muted-foreground">
            <p>Set these environment variables on Vercel (or in .env.local):</p>
            <code className="mt-1 block rounded bg-muted p-2 font-mono text-xs">
              GOOGLE_API_KEY=your-key-here<br />
              AI_PROVIDER=gemini<br />
              MODEL=gemini-2.0-flash
            </code>
          </div>
        </CardContent>
      </Card>

      {/* LinkedIn Scraper */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            LinkedIn Connection Exporter
          </CardTitle>
          <CardDescription>
            Extract your LinkedIn connections as a CSV, then import on the Prospects page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Method 1: Console paste (recommended — always works) */}
          <div>
            <h3 className="mb-2 font-medium">Recommended: Paste in Console</h3>
            <ol className="mb-3 list-inside list-decimal space-y-1 text-sm text-muted-foreground">
              <li>
                Go to{' '}
                <code className="rounded bg-muted px-1">linkedin.com/mynetwork/invite-connect/connections/</code>
              </li>
              <li>Open DevTools (F12 or Cmd+Option+J)</li>
              <li>Click the <strong>Console</strong> tab</li>
              <li>Paste the code below and press Enter</li>
              <li>Watch the console logs — it auto-scrolls and exports a CSV</li>
              <li>Import the downloaded CSV on the Prospects page</li>
            </ol>
            <div className="relative">
              <pre className="max-h-48 overflow-auto rounded-md bg-muted p-3 font-mono text-xs leading-relaxed">
                {SCRAPER_CODE_FIXED}
              </pre>
              <Button
                variant="secondary"
                size="sm"
                className="absolute right-2 top-2"
                onClick={copyConsoleCode}
              >
                <Copy className="mr-1 h-3 w-3" />
                Copy
              </Button>
            </div>
          </div>

          <Separator />

          {/* Method 2: Bookmarklet (drag to bar) */}
          <div>
            <h3 className="mb-2 font-medium">Alternative: Bookmarklet</h3>
            <p className="mb-2 text-sm text-muted-foreground">
              Drag this link to your bookmarks bar, then click it when on your LinkedIn connections page:
            </p>
            <div ref={bookmarkletRef} className="flex items-center gap-3">
              {/* Real anchor injected via useEffect to bypass React's javascript: URL blocking */}
              <span className="text-xs text-muted-foreground">Loading bookmarklet...</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Export, import, or clear your data. All data is stored in your browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Current data</p>
              <p className="text-xs text-muted-foreground">
                {prospects.length} prospects, {sequences.length} sequences
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-1 h-3 w-3" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={handleImport}>
                <Upload className="mr-1 h-3 w-3" />
                Import
              </Button>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-destructive">Clear all data</p>
              <p className="text-xs text-muted-foreground">
                Permanently delete all prospects and sequences
              </p>
            </div>
            <Button variant="destructive" size="sm" onClick={handleClear}>
              <Trash2 className="mr-1 h-3 w-3" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
