'use client';

import { useState, useEffect } from 'react';
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
  Chrome,
} from 'lucide-react';
import { toast } from 'sonner';

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

      {/* Chrome Extension */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Chrome className="h-5 w-5" />
            Chrome Extension
          </CardTitle>
          <CardDescription>
            Scrape your LinkedIn connections directly from your browser and send them to this app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="mb-2 font-medium">Install the Extension</h3>
            <ol className="mb-3 list-inside list-decimal space-y-1.5 text-sm text-muted-foreground">
              <li>
                Download the <code className="rounded bg-muted px-1">extension/</code> folder from the{' '}
                <a
                  href="https://github.com/feelgreatfoodie/linkedin-outreach-web"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  GitHub repo
                </a>
              </li>
              <li>
                Open Chrome and go to{' '}
                <code className="rounded bg-muted px-1">chrome://extensions</code>
              </li>
              <li>Enable <strong>Developer mode</strong> (toggle in top right)</li>
              <li>Click <strong>Load unpacked</strong> and select the <code className="rounded bg-muted px-1">extension/</code> folder</li>
              <li>Pin the extension to your toolbar for easy access</li>
            </ol>
          </div>

          <Separator />

          <div>
            <h3 className="mb-2 font-medium">How to Use</h3>
            <ol className="list-inside list-decimal space-y-1.5 text-sm text-muted-foreground">
              <li>
                Go to your{' '}
                <a
                  href="https://www.linkedin.com/mynetwork/invite-connect/connections/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  LinkedIn Connections page
                </a>
              </li>
              <li>Click the extension icon in your toolbar</li>
              <li>Set the App URL to this app (default: <code className="rounded bg-muted px-1">http://localhost:3000</code>)</li>
              <li>Click <strong>Scrape &amp; Send to App</strong> to import directly</li>
              <li>Or click <strong>Download CSV</strong> to save a file and import it manually</li>
            </ol>
          </div>

          <Separator />

          <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Notes</p>
            <ul className="mt-1 list-inside list-disc space-y-1">
              <li>The extension only runs on your LinkedIn connections page</li>
              <li>It clicks &quot;Load more&quot; automatically to get all connections</li>
              <li>Large accounts (1000+ connections) may take 2-5 minutes</li>
              <li>Connections are deduplicated on import</li>
            </ul>
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
