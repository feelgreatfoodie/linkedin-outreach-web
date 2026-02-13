'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileUp } from 'lucide-react';
import { parseCSVString, deduplicateProspects } from '@/lib/csv-parser';
import type { Prospect } from '@/lib/types';
import { toast } from 'sonner';

interface ImportDialogProps {
  existingProspects: Prospect[];
  onImport: (prospects: Prospect[]) => void;
}

export function ImportDialog({ existingProspects, onImport }: ImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = parseCSVString(content);
          const { added, duplicates } = deduplicateProspects(existingProspects, parsed);

          if (added.length === 0) {
            toast.info('No new prospects', {
              description: `${duplicates.length} duplicate(s) skipped.`,
            });
            return;
          }

          onImport(added);
          setOpen(false);

          const msg = duplicates.length > 0
            ? `${added.length} imported, ${duplicates.length} duplicates skipped`
            : `${added.length} prospects imported`;
          toast.success('Import complete', { description: msg });
        } catch (err) {
          toast.error('Import failed', {
            description: err instanceof Error ? err.message : 'Could not parse CSV',
          });
        }
      };
      reader.readAsText(file);
    },
    [existingProspects, onImport]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Prospects</DialogTitle>
          <DialogDescription>
            Upload a CSV from Sales Navigator, LinkedIn data export, or any spreadsheet.
            Headers are auto-mapped.
          </DialogDescription>
        </DialogHeader>
        <div
          className={`flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-8 transition-colors ${
            dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <FileUp className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Drag & drop a CSV file, or click to browse
          </p>
          <input
            type="file"
            accept=".csv"
            className="hidden"
            id="csv-upload"
            onChange={handleFileInput}
          />
          <Button variant="outline" asChild>
            <label htmlFor="csv-upload" className="cursor-pointer">
              Choose File
            </label>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Supported columns: First Name, Last Name, Title, Company, Industry, Location, LinkedIn URL, and more.
          Duplicates are automatically detected.
        </p>
      </DialogContent>
    </Dialog>
  );
}
