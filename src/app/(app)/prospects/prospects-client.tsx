'use client';

import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { ImportDialog } from '@/components/import-dialog';
import { ManualAddForm } from '@/components/manual-add-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Trash2, ChevronDown, ExternalLink, Search, CheckSquare, XSquare } from 'lucide-react';
import type { Prospect, ProspectStatus } from '@/lib/types';
import { toast } from 'sonner';
import {
  addProspectsAction,
  updateStatusAction,
  deleteProspectsAction,
} from './actions';

const STATUS_COLORS: Record<ProspectStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  enriched: 'bg-purple-100 text-purple-800',
  sequenced: 'bg-green-100 text-green-800',
  contacted: 'bg-orange-100 text-orange-800',
};

interface ProspectsClientProps {
  prospects: Prospect[];
  sequenceProspectIds: string[];
}

export function ProspectsClient({ prospects, sequenceProspectIds }: ProspectsClientProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [isPending, startTransition] = useTransition();

  const seqSet = useMemo(() => new Set(sequenceProspectIds), [sequenceProspectIds]);

  const companies = useMemo(() => {
    const set = new Set(prospects.map((p) => p.company).filter(Boolean));
    return Array.from(set).sort();
  }, [prospects]);

  const filtered = useMemo(() => {
    return prospects.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (companyFilter !== 'all' && p.company !== companyFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.firstName.toLowerCase().includes(q) ||
          p.lastName.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q) ||
          p.company.toLowerCase().includes(q) ||
          p.industry.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [prospects, search, statusFilter, companyFilter]);

  const allSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selected);
    const count = ids.length;
    setSelected(new Set());
    startTransition(async () => {
      await deleteProspectsAction(ids);
      toast.success(`Deleted ${count} prospect(s)`);
    });
  };

  const handleBulkStatus = (status: ProspectStatus) => {
    const ids = Array.from(selected);
    const count = ids.length;
    setSelected(new Set());
    startTransition(async () => {
      await updateStatusAction(ids, status);
      toast.success(`Updated ${count} prospect(s) to "${status}"`);
    });
  };

  const handleImport = (newProspects: Prospect[]) => {
    startTransition(async () => {
      await addProspectsAction(newProspects);
      toast.success(`Imported ${newProspects.length} prospect(s)`);
    });
  };

  const handleAdd = (prospect: Prospect) => {
    startTransition(async () => {
      await addProspectsAction([prospect]);
      toast.success(`Added ${prospect.firstName} ${prospect.lastName}`);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Prospects</h1>
          <p className="text-sm text-muted-foreground">
            {prospects.length} total prospect{prospects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ManualAddForm onAdd={handleAdd} />
          <ImportDialog existingProspects={prospects} onImport={handleImport} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, title, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="enriched">Enriched</SelectItem>
            <SelectItem value="sequenced">Sequenced</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
          </SelectContent>
        </Select>
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Company" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            {companies.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filtered.length !== prospects.length && (
          <span className="text-sm text-muted-foreground">
            Showing {filtered.length} of {prospects.length}
          </span>
        )}
        {filtered.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAll}
            className="ml-auto whitespace-nowrap"
          >
            {allSelected ? (
              <><XSquare className="mr-1 h-4 w-4" /> Deselect All</>
            ) : (
              <><CheckSquare className="mr-1 h-4 w-4" /> Select All ({filtered.length})</>
            )}
          </Button>
        )}
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-md border bg-muted/50 p-3">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Link href={`/generate?ids=${Array.from(selected).join(',')}`}>
            <Button size="sm">Generate Sequences</Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Set Status <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleBulkStatus('new')}>New</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkStatus('contacted')}>Contacted</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={isPending}>
            <Trash2 className="mr-1 h-3 w-3" />
            Delete
          </Button>
        </div>
      )}

      {prospects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <p className="mb-2 text-lg font-medium">No prospects yet</p>
          <p className="mb-4 text-sm text-muted-foreground">
            Import a CSV or add prospects manually to get started
          </p>
          <ImportDialog existingProspects={prospects} onImport={handleImport} />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((prospect) => (
                <TableRow key={prospect.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(prospect.id)}
                      onCheckedChange={() => toggleOne(prospect.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/prospects/${prospect.id}`}
                      className="font-medium hover:underline"
                    >
                      {prospect.firstName} {prospect.lastName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {prospect.title || '\u2014'}
                  </TableCell>
                  <TableCell>{prospect.company || '\u2014'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {prospect.industry || '\u2014'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={STATUS_COLORS[prospect.status as ProspectStatus]}>
                      {prospect.status}
                    </Badge>
                    {seqSet.has(prospect.id) && (
                      <Badge variant="outline" className="ml-1">
                        seq
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {prospect.linkedinUrl && (
                      <a
                        href={prospect.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
