'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  CheckCircle,
  XCircle,
  Chrome,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  Key,
  RefreshCw,
  ArrowUpFromLine,
} from 'lucide-react';
import { toast } from 'sonner';
import { regenerateApiKeyAction, migrateLocalDataAction } from './actions';

const APP_URL = 'https://linkedin-outreach-web.vercel.app';

const GUIDE_STEPS = [
  {
    title: 'Download the Extension',
    content: (
      <>
        <p className="text-sm text-muted-foreground leading-relaxed">
          First, you need to download the Chrome extension files from our GitHub repository.
        </p>
        <ol className="mt-3 space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
            <div>
              Go to{' '}
              <a
                href="https://github.com/feelgreatfoodie/linkedin-outreach-web"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline inline-flex items-center gap-1"
              >
                our GitHub page <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
            <div>
              Click the green <strong>&quot;Code&quot;</strong> button, then click <strong>&quot;Download ZIP&quot;</strong>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span>
            <div>
              Unzip the downloaded file. Inside you&apos;ll find an <code className="rounded bg-muted px-1.5 py-0.5 text-xs">extension</code> folder &mdash; that&apos;s what you need.
            </div>
          </li>
        </ol>
      </>
    ),
  },
  {
    title: 'Install in Chrome',
    content: (
      <>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Now install the extension in your Chrome browser. This only takes a minute.
        </p>
        <ol className="mt-3 space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
            <div>
              Open Chrome and type <code className="rounded bg-muted px-1.5 py-0.5 text-xs">chrome://extensions</code> in the address bar, then press Enter
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
            <div>
              Turn on <strong>&quot;Developer mode&quot;</strong> &mdash; it&apos;s a toggle switch in the <strong>top-right corner</strong> of the page
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span>
            <div>
              Click <strong>&quot;Load unpacked&quot;</strong> (top-left area) and select the <code className="rounded bg-muted px-1.5 py-0.5 text-xs">extension</code> folder you unzipped
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">4</span>
            <div>
              Click the <strong>puzzle piece icon</strong> in Chrome&apos;s toolbar, then click the <strong>pin icon</strong> next to &quot;LinkedIn Outreach Exporter&quot; so it&apos;s always visible
            </div>
          </li>
        </ol>
        <div className="mt-4 rounded-md border-l-4 border-amber-400 bg-amber-50 p-3 text-xs text-amber-900">
          <strong>Note:</strong> You only need to do this once. The extension stays installed even after you close Chrome.
        </div>
      </>
    ),
  },
  {
    title: 'Set Your App URL & API Key',
    content: (
      <>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The extension needs your App URL and API key to send connections to your account.
        </p>
        <ol className="mt-3 space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
            <div>Click the extension icon in your toolbar</div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
            <div>Paste your <strong>App URL</strong> and <strong>API Key</strong> (copy both from the Settings page below)</div>
          </li>
        </ol>
        <CopyableUrl url={APP_URL} />
        <div className="mt-4 rounded-md border-l-4 border-red-400 bg-red-50 p-3 text-xs text-red-900">
          <strong>Don&apos;t skip the API Key!</strong> Without it, the extension can&apos;t link connections to your account.
        </div>
      </>
    ),
  },
  {
    title: 'Export Your Connections',
    content: (
      <>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Now you&apos;re ready to export! Here&apos;s how to run the scraper.
        </p>
        <ol className="mt-3 space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
            <div>
              Go to your{' '}
              <a
                href="https://www.linkedin.com/mynetwork/invite-connect/connections/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline inline-flex items-center gap-1"
              >
                LinkedIn Connections page <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
            <div>Click the extension icon, then press <strong>&quot;Scrape &amp; Send to App&quot;</strong></div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span>
            <div>Come back here and check the <strong>Prospects</strong> page!</div>
          </li>
        </ol>
        <div className="mt-3 rounded-md border-l-4 border-green-500 bg-green-50 p-3 text-xs text-green-900">
          <strong>That&apos;s it!</strong> Your connections are now linked to your account and saved to the database.
        </div>
      </>
    ),
  },
];

function CopyableUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-3 flex items-center gap-2 rounded-md border bg-muted/50 p-2.5">
      <code className="flex-1 text-xs font-medium break-all">{url}</code>
      <Button variant="ghost" size="sm" className="shrink-0 h-7 px-2" onClick={handleCopy}>
        {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}

function CopyableApiKey({ apiKey }: { apiKey: string }) {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('API key copied');
  };

  const display = visible ? apiKey : apiKey.slice(0, 8) + '\u2022'.repeat(24);

  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-2.5">
      <code className="flex-1 text-xs font-medium break-all font-mono">{display}</code>
      <Button variant="ghost" size="sm" className="shrink-0 h-7 px-2" onClick={() => setVisible(!visible)}>
        <span className="text-xs">{visible ? 'Hide' : 'Show'}</span>
      </Button>
      <Button variant="ghost" size="sm" className="shrink-0 h-7 px-2" onClick={handleCopy}>
        {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}

function SetupGuideDialog() {
  const [step, setStep] = useState(0);
  const current = GUIDE_STEPS[step];
  const isLast = step === GUIDE_STEPS.length - 1;
  const isFirst = step === 0;

  return (
    <Dialog onOpenChange={() => setStep(0)}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <HelpCircle className="mr-1.5 h-4 w-4" />
          Setup Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {step + 1}
            </span>
            {current.title}
          </DialogTitle>
          <DialogDescription>
            Step {step + 1} of {GUIDE_STEPS.length}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">{current.content}</div>

        <div className="flex justify-center gap-1.5 py-2">
          {GUIDE_STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === step ? 'bg-primary' : 'bg-muted-foreground/20'
              }`}
            />
          ))}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStep(step - 1)}
            disabled={isFirst}
          >
            <ChevronLeft className="mr-1 h-3 w-3" />
            Back
          </Button>
          <Button
            size="sm"
            onClick={() => {
              if (isLast) {
                const closeBtn = document.querySelector('[data-slot="dialog-close"]');
                if (closeBtn instanceof HTMLElement) closeBtn.click();
              } else {
                setStep(step + 1);
              }
            }}
          >
            {isLast ? 'Done' : 'Next'}
            {!isLast && <ChevronRight className="ml-1 h-3 w-3" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface SettingsClientProps {
  apiKey: string | null;
  hasDbData: boolean;
}

export function SettingsClient({ apiKey, hasDbData }: SettingsClientProps) {
  const [health, setHealth] = useState<{
    provider: string;
    providerName: string;
    model: string;
    modelLabel: string;
    configured: boolean;
  } | null>(null);
  const [currentApiKey, setCurrentApiKey] = useState(apiKey);
  const [isPending, startTransition] = useTransition();
  const [localDataCount, setLocalDataCount] = useState<{ prospects: number; sequences: number } | null>(null);
  const [migrated, setMigrated] = useState(false);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => {});
  }, []);

  // Detect localStorage data for migration
  useEffect(() => {
    if (hasDbData) return;
    try {
      const storedProspects = window.localStorage.getItem('outreach:prospects');
      const storedSequences = window.localStorage.getItem('outreach:sequences');
      const prospects = storedProspects ? JSON.parse(storedProspects) : [];
      const sequences = storedSequences ? JSON.parse(storedSequences) : [];
      if (prospects.length > 0 || sequences.length > 0) {
        setLocalDataCount({ prospects: prospects.length, sequences: sequences.length });
      }
    } catch {
      // ignore
    }
  }, [hasDbData]);

  const handleRegenerate = () => {
    startTransition(async () => {
      const newKey = await regenerateApiKeyAction();
      setCurrentApiKey(newKey);
      toast.success('API key regenerated');
    });
  };

  const handleMigrate = () => {
    startTransition(async () => {
      try {
        const storedProspects = window.localStorage.getItem('outreach:prospects');
        const storedSequences = window.localStorage.getItem('outreach:sequences');
        const prospects = storedProspects ? JSON.parse(storedProspects) : [];
        const sequences = storedSequences ? JSON.parse(storedSequences) : [];

        const result = await migrateLocalDataAction(prospects, sequences);
        window.localStorage.removeItem('outreach:prospects');
        window.localStorage.removeItem('outreach:sequences');
        setMigrated(true);
        setLocalDataCount(null);
        toast.success(`Migrated ${result.prospects} prospects`);
      } catch {
        toast.error('Migration failed');
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          API keys, AI provider configuration, and tools
        </p>
      </div>

      {/* localStorage Migration */}
      {localDataCount && !migrated && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpFromLine className="h-5 w-5 text-amber-600" />
              Migrate Local Data
            </CardTitle>
            <CardDescription>
              Found {localDataCount.prospects} prospects and {localDataCount.sequences} sequences in browser storage.
              Migrate them to your account so they&apos;re saved permanently.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleMigrate} disabled={isPending}>
              <ArrowUpFromLine className="mr-2 h-4 w-4" />
              {isPending ? 'Migrating...' : 'Migrate my data'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* API Key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Key
          </CardTitle>
          <CardDescription>
            Use this key in the Chrome extension to link scraped connections to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentApiKey ? (
            <CopyableApiKey apiKey={currentApiKey} />
          ) : (
            <p className="text-sm text-muted-foreground">No API key generated yet</p>
          )}
          <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={isPending}>
            <RefreshCw className="mr-1 h-3 w-3" />
            Regenerate
          </Button>
          <p className="text-xs text-muted-foreground">
            Regenerating will invalidate the old key. Update it in the Chrome extension after regenerating.
          </p>
        </CardContent>
      </Card>

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
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center gap-2">
                <Chrome className="h-5 w-5" />
                Chrome Extension
              </CardTitle>
              <CardDescription>
                Scrape your LinkedIn connections and import them into this app automatically
              </CardDescription>
            </div>
            <SetupGuideDialog />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
            <h3 className="mb-3 text-sm font-semibold">Quick Start</h3>
            <div className="space-y-2.5 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">1</span>
                <span>Install the extension (one-time setup &mdash; click <strong>Setup Guide</strong> above for detailed steps)</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">2</span>
                <span>Set the <strong>App URL</strong> in the extension to:</span>
              </div>
              <CopyableUrl url={APP_URL} />
              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">3</span>
                <span>Paste your <strong>API Key</strong> from the section above</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">4</span>
                <span>
                  Go to your{' '}
                  <a
                    href="https://www.linkedin.com/mynetwork/invite-connect/connections/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary underline"
                  >
                    LinkedIn Connections page
                  </a>
                  , click the extension, and press <strong>&quot;Scrape &amp; Send to App&quot;</strong>
                </span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Good to know</p>
            <ul className="mt-1.5 list-inside list-disc space-y-1">
              <li>The extension only activates on your LinkedIn connections page</li>
              <li>It automatically clicks &quot;Load more&quot; to get all your connections</li>
              <li>Large accounts (1000+ connections) may take 2-5 minutes</li>
              <li>Keep the LinkedIn tab open while scraping &mdash; don&apos;t close it</li>
              <li>Duplicate connections are automatically skipped on import</li>
              <li>You can also click &quot;Download CSV Instead&quot; to get a spreadsheet file</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
