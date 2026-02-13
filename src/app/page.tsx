'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useProspects } from '@/hooks/use-prospects';
import { useSequences } from '@/hooks/use-sequences';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Mail, Sparkles, Upload, ArrowRight } from 'lucide-react';
import type { ProspectStatus } from '@/lib/types';

const STATUS_COLORS: Record<ProspectStatus, string> = {
  new: 'bg-blue-500',
  enriched: 'bg-purple-500',
  sequenced: 'bg-green-500',
  contacted: 'bg-orange-500',
};

export default function DashboardPage() {
  const { prospects, hydrated } = useProspects();
  const { sequences } = useSequences();

  const stats = useMemo(() => {
    const statusCounts: Record<ProspectStatus, number> = {
      new: 0,
      enriched: 0,
      sequenced: 0,
      contacted: 0,
    };
    prospects.forEach((p) => {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
    });

    const totalMessages = sequences.reduce((sum, s) => sum + s.messages.length, 0);

    // Top industries
    const industryCounts: Record<string, number> = {};
    prospects.forEach((p) => {
      if (p.industry) industryCounts[p.industry] = (industryCounts[p.industry] || 0) + 1;
    });
    const topIndustries = Object.entries(industryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Recent activity
    const recentSequences = [...sequences]
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
      .slice(0, 5);

    return { statusCounts, totalMessages, topIndustries, recentSequences };
  }, [prospects, sequences]);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your LinkedIn outreach pipeline
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Prospects
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{prospects.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sequences Generated
            </CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{sequences.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Messages
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalMessages}</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      {prospects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-4 overflow-hidden rounded-full">
              {(Object.entries(stats.statusCounts) as [ProspectStatus, number][])
                .filter(([, count]) => count > 0)
                .map(([status, count]) => (
                  <div
                    key={status}
                    className={`${STATUS_COLORS[status]} transition-all`}
                    style={{ width: `${(count / prospects.length) * 100}%` }}
                    title={`${status}: ${count}`}
                  />
                ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-4">
              {(Object.entries(stats.statusCounts) as [ProspectStatus, number][]).map(
                ([status, count]) => (
                  <div key={status} className="flex items-center gap-2 text-sm">
                    <div className={`h-3 w-3 rounded-full ${STATUS_COLORS[status]}`} />
                    <span className="capitalize">{status}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Industries */}
        {stats.topIndustries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Top Industries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.topIndustries.map(([industry, count]) => (
                  <div key={industry} className="flex items-center justify-between">
                    <span className="text-sm">{industry}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        {stats.recentSequences.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Recent Sequences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.recentSequences.map((seq) => (
                  <Link
                    key={seq.id}
                    href={`/prospects/${seq.prospectId}`}
                    className="flex items-center justify-between rounded-md p-2 hover:bg-accent"
                  >
                    <div>
                      <p className="text-sm font-medium">{seq.prospectName}</p>
                      <p className="text-xs text-muted-foreground">
                        {seq.style} &middot; {seq.messages.length} msgs
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(seq.generatedAt).toLocaleDateString()}
                    </span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Empty state */}
      {prospects.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold">Get Started</h2>
            <p className="mb-6 max-w-md text-center text-muted-foreground">
              Import your LinkedIn connections CSV, then generate personalized outreach
              sequences powered by AI.
            </p>
            <div className="flex gap-3">
              <Link href="/prospects">
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Prospects
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="outline">
                  Settings
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
