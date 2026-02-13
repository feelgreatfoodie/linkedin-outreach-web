import Papa from 'papaparse';
import { nanoid } from 'nanoid';
import type { Prospect } from './types';

const COLUMN_MAP: Record<string, keyof Prospect> = {
  'first name': 'firstName',
  'last name': 'lastName',
  'title': 'title',
  'job title': 'title',
  'company': 'company',
  'company name': 'company',
  'company size': 'companySize',
  '# of employees': 'companySize',
  'number of employees': 'companySize',
  'industry': 'industry',
  'location': 'location',
  'geography': 'location',
  'linkedin url': 'linkedinUrl',
  'profile url': 'linkedinUrl',
  'linkedin profile url': 'linkedinUrl',
  'url': 'linkedinUrl',
  'connected on': 'connectedOn',
  'connection date': 'connectedOn',
  'notes': 'notes',
};

function normalizeHeader(header: string): string {
  return header.toLowerCase().trim().replace(/['"]/g, '');
}

function mapRow(row: Record<string, string>, headerMap: Record<string, keyof Prospect>): Prospect {
  const prospect: Prospect = {
    id: nanoid(10),
    firstName: '',
    lastName: '',
    title: '',
    company: '',
    companySize: '',
    industry: '',
    location: '',
    linkedinUrl: '',
    connectedOn: '',
    notes: '',
    status: 'new',
    importedAt: new Date().toISOString(),
  };

  for (const [csvHeader, value] of Object.entries(row)) {
    const normalized = normalizeHeader(csvHeader);
    const fieldName = headerMap[normalized];
    if (fieldName && value) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prospect as any)[fieldName] = value.trim();
    }
  }

  return prospect;
}

export function parseCSVString(content: string): Prospect[] {
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  });

  if (result.data.length === 0) {
    throw new Error('No records found in CSV file');
  }

  const csvHeaders = Object.keys(result.data[0]);
  const headerMap: Record<string, keyof Prospect> = {};
  for (const header of csvHeaders) {
    const normalized = normalizeHeader(header);
    if (COLUMN_MAP[normalized]) {
      headerMap[normalized] = COLUMN_MAP[normalized];
    }
  }

  return result.data
    .map((row) => mapRow(row, headerMap))
    .filter((p) => p.firstName && p.lastName);
}

export function deduplicateProspects(
  existing: Prospect[],
  newProspects: Prospect[]
): { added: Prospect[]; duplicates: Prospect[] } {
  const added: Prospect[] = [];
  const duplicates: Prospect[] = [];

  for (const prospect of newProspects) {
    const isDuplicate = existing.some(
      (p) =>
        p.firstName.toLowerCase() === prospect.firstName.toLowerCase() &&
        p.lastName.toLowerCase() === prospect.lastName.toLowerCase() &&
        p.company.toLowerCase() === prospect.company.toLowerCase()
    );
    if (isDuplicate) {
      duplicates.push(prospect);
    } else {
      added.push(prospect);
    }
  }

  return { added, duplicates };
}
