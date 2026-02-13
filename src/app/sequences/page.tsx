'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSequences } from '@/hooks/use-sequences';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Copy, ChevronDown, ChevronUp, Search, Sparkles } from 'lucide-react';
import type { OutreachStyle } from '@/lib/types';
import { toast } from 'sonner';

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

const STYLE_COLORS: Record<OutreachStyle, string> = {
  cold: 'bg-blue-100 text-blue-800',
  warm: 'bg-amber-100 text-amber-800',
  referral: 'bg-green-100 text-green-800',
};

export default function SequencesPage() {
  const { sequences, hydrated } = useSequences();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [styleFilter, setStyleFilter] = useState<string>('all');

  const filtered = sequences.filter((s) => {
    if (styleFilter !== 'all' && s.style !== styleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.prospectName.toLowerCase().includes(q) ||
        s.company.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyMessage = (body: string) => {
    navigator.clipboard.writeText(body);
    toast.success('Copied to clipboard');
  };

  const copyAll = (sequenceId: string) => {
    const seq = sequences.find((s) => s.id === sequenceId);
    if (!seq) return;
    const text = seq.messages
      .map((m) => {
        const parts = [`--- Day ${m.day}: ${TYPE_LABELS[m.type] || m.type} ---`];
        if (m.subject) parts.push(`Subject: ${m.subject}`);
        parts.push(m.body);
        return parts.join('\n');
      })
      .join('\n\n');
    navigator.clipboard.writeText(text);
    toast.success('All messages copied');
  };

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sequences</h1>
          <p className="text-sm text-muted-foreground">
            {sequences.length} sequence{sequences.length !== 1 ? 's' : ''} generated
          </p>
        </div>
        <Link href="/generate">
          <Button>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate More
          </Button>
        </Link>
      </div>

      {sequences.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={styleFilter} onValueChange={setStyleFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Styles</SelectItem>
              <SelectItem value="cold">Cold</SelectItem>
              <SelectItem value="warm">Warm</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {sequences.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <p className="mb-2 text-lg font-medium">No sequences yet</p>
          <p className="mb-4 text-sm text-muted-foreground">
            Generate sequences from the Generate page
          </p>
          <Link href="/generate">
            <Button>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Sequences
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((seq) => (
            <Card key={seq.id}>
              <CardContent className="pt-4">
                <div
                  className="flex cursor-pointer items-center justify-between"
                  onClick={() => toggleExpand(seq.id)}
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{seq.prospectName}</p>
                      <p className="text-sm text-muted-foreground">{seq.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={STYLE_COLORS[seq.style]}>
                      {seq.style}
                    </Badge>
                    <Badge variant="outline">
                      {seq.messages.length} msgs
                    </Badge>
                    {seq.demo && (
                      <Badge variant="outline" className="text-amber-600">
                        demo
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{seq.generationTime}</span>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); copyAll(seq.id); }}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    {expanded.has(seq.id) ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {expanded.has(seq.id) && (
                  <div className="mt-4 space-y-3 border-t pt-4">
                    {seq.messages.map((msg, i) => (
                      <div key={i} className="rounded-md border p-3">
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
                            <Copy className="mr-1 h-3 w-3" />
                            Copy
                          </Button>
                        </div>
                        {msg.subject && (
                          <p className="mb-1 text-sm font-medium text-muted-foreground">
                            Subject: {msg.subject}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap text-sm">{msg.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
