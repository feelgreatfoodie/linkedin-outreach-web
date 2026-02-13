'use client';

import { useState, useEffect } from 'react';
import { useProspects } from '@/hooks/use-prospects';
import { useSequences } from '@/hooks/use-sequences';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

const BOOKMARKLET_CODE = `javascript:void(function(){var d=document,cards=[],prev=0,maxScroll=50,scrolls=0;function scroll(){window.scrollTo(0,d.body.scrollHeight);scrolls++;setTimeout(function(){var c=d.querySelectorAll('li.mn-connection-card');if(c.length>prev){prev=c.length;scrolls=0;scroll()}else if(scrolls<3){scroll()}else{extract(c)}},1500)}function extract(c){c.forEach(function(el){var name=el.querySelector('.mn-connection-card__name');var title=el.querySelector('.mn-connection-card__occupation');var link=el.querySelector('a[href*="/in/"]');if(name){cards.push({name:name.textContent.trim(),title:title?title.textContent.trim():'',url:link?link.href.split('?')[0]:''})}});var csv='First Name,Last Name,Title,Company,LinkedIn URL\\n';cards.forEach(function(r){var parts=r.name.split(' ');var fn=parts[0]||'';var ln=parts.slice(1).join(' ')||'';var titleParts=r.title.split(' at ');var t=titleParts[0]||'';var co=titleParts[1]||'';csv+='"'+fn+'","'+ln+'","'+t+'","'+co+'","'+r.url+'"\\n'});var blob=new Blob([csv],{type:'text/csv'});var a=d.createElement('a');a.href=URL.createObjectURL(blob);a.download='linkedin-connections.csv';a.click();alert('Exported '+cards.length+' connections!')}scroll()})()`;

export default function SettingsPage() {
  const { prospects, setProspects } = useProspects();
  const { sequences, setSequences } = useSequences();
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

  const copyBookmarklet = () => {
    navigator.clipboard.writeText(BOOKMARKLET_CODE);
    toast.success('Bookmarklet code copied');
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

      {/* LinkedIn Scraper Bookmarklet */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            LinkedIn Connection Scraper
          </CardTitle>
          <CardDescription>
            A bookmarklet that extracts your LinkedIn connections as a CSV file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border bg-muted/50 p-4">
            <h3 className="mb-2 font-medium">How to use:</h3>
            <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
              <li>Drag the button below to your browser&apos;s bookmarks bar</li>
              <li>Go to your LinkedIn connections page</li>
              <li>Click the bookmarklet</li>
              <li>Wait while it auto-scrolls and extracts all connections (1-3 minutes)</li>
              <li>A CSV file will download automatically</li>
              <li>Import that CSV on the Prospects page</li>
            </ol>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={BOOKMARKLET_CODE}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              onClick={(e) => {
                e.preventDefault();
                toast.info('Drag this button to your bookmarks bar!');
              }}
              draggable
            >
              <Bookmark className="h-4 w-4" />
              Export LinkedIn
            </a>
            <span className="text-xs text-muted-foreground">
              Drag to bookmarks bar
            </span>
          </div>

          <Separator />

          <div>
            <h3 className="mb-2 text-sm font-medium">Alternative: Console method</h3>
            <p className="mb-2 text-xs text-muted-foreground">
              If bookmarklet drag doesn&apos;t work, copy and paste this into your browser console
              while on your LinkedIn connections page:
            </p>
            <div className="relative">
              <pre className="max-h-32 overflow-auto rounded-md bg-muted p-3 text-xs">
                {BOOKMARKLET_CODE.replace('javascript:void(', '(').slice(0, -1)}
              </pre>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2"
                onClick={copyBookmarklet}
              >
                <Copy className="h-3 w-3" />
              </Button>
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
