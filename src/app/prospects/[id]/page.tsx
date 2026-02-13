'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProspects } from '@/hooks/use-prospects';
import { useSequences } from '@/hooks/use-sequences';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Copy, ExternalLink, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { ProspectStatus } from '@/lib/types';

const STATUS_COLORS: Record<ProspectStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  enriched: 'bg-purple-100 text-purple-800',
  sequenced: 'bg-green-100 text-green-800',
  contacted: 'bg-orange-100 text-orange-800',
};

const TYPE_LABELS: Record<string, string> = {
  connection_request: 'Connection Request',
  follow_up_1: 'Follow-up 1',
  follow_up_2: 'Follow-up 2',
  break_up: 'Break-up',
  re_engagement: 'Re-engagement',
  value_add: 'Value Add',
  offer: 'Offer',
  soft_close: 'Soft Close',
  referral_intro: 'Referral Intro',
  value_cta: 'Value + CTA',
  gentle_follow_up: 'Follow-up',
};

export default function ProspectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { prospects, updateProspect, hydrated } = useProspects();
  const { getSequenceForProspect } = useSequences();

  const prospect = prospects.find((p) => p.id === id);
  const sequence = getSequenceForProspect(id);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!prospect) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="mb-4 text-lg">Prospect not found</p>
        <Link href="/prospects">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Prospects
          </Button>
        </Link>
      </div>
    );
  }

  const copyMessage = (body: string) => {
    navigator.clipboard.writeText(body);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/prospects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {prospect.firstName} {prospect.lastName}
          </h1>
          <p className="text-muted-foreground">
            {prospect.title}
            {prospect.company ? ` at ${prospect.company}` : ''}
          </p>
        </div>
        <Badge variant="secondary" className={STATUS_COLORS[prospect.status]}>
          {prospect.status}
        </Badge>
        {prospect.linkedinUrl && (
          <a href={prospect.linkedinUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-1 h-4 w-4" />
              LinkedIn
            </Button>
          </a>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>First Name</Label>
                <Input
                  value={prospect.firstName}
                  onChange={(e) => updateProspect(id, { firstName: e.target.value })}
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input
                  value={prospect.lastName}
                  onChange={(e) => updateProspect(id, { lastName: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Title</Label>
              <Input
                value={prospect.title}
                onChange={(e) => updateProspect(id, { title: e.target.value })}
              />
            </div>
            <div>
              <Label>Company</Label>
              <Input
                value={prospect.company}
                onChange={(e) => updateProspect(id, { company: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Industry</Label>
                <Input
                  value={prospect.industry}
                  onChange={(e) => updateProspect(id, { industry: e.target.value })}
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={prospect.location}
                  onChange={(e) => updateProspect(id, { location: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>LinkedIn URL</Label>
              <Input
                value={prospect.linkedinUrl}
                onChange={(e) => updateProspect(id, { linkedinUrl: e.target.value })}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={prospect.notes}
                onChange={(e) => updateProspect(id, { notes: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sequence */}
        <div className="space-y-4">
          {sequence ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Sequence</h2>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{sequence.style}</Badge>
                  <span>{sequence.generationTime}</span>
                </div>
              </div>
              {sequence.messages.map((msg, i) => (
                <Card key={i}>
                  <CardContent className="pt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Day {msg.day}</Badge>
                        <span className="text-sm font-medium">
                          {TYPE_LABELS[msg.type] || msg.type}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyMessage(msg.body)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    {msg.subject && (
                      <p className="mb-1 text-sm font-medium text-muted-foreground">
                        Subject: {msg.subject}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap text-sm">{msg.body}</p>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="mb-3 text-muted-foreground">No sequence generated yet</p>
                <Link href={`/generate?ids=${id}`}>
                  <Button>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Sequence
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
