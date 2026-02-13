import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import type { Prospect } from '@/lib/types';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Preflight for Chrome extension CORS
export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}

interface ConnectionPayload {
  name: string;
  title: string;
  url: string;
  connectedOn: string;
}

// In-memory store for the most recent import (single-user app)
let pendingImport: Prospect[] | null = null;

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || '',
  };
}

function parseTitle(rawTitle: string): { jobTitle: string; company: string } {
  let jobTitle = rawTitle;
  let company = '';

  const atMatch = rawTitle.match(/^(.+?)\s+(?:at|@)\s+(.+)$/i);
  if (atMatch) {
    jobTitle = atMatch[1];
    company = atMatch[2];
  } else if (rawTitle.includes(' | ')) {
    const pipeMatch = rawTitle.match(/^(.+?)\s*\|\s*(.+)$/);
    if (pipeMatch) {
      jobTitle = pipeMatch[1];
      company = pipeMatch[2];
    }
  }

  return { jobTitle, company };
}

// POST: Receive connections from the Chrome extension
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const connections: ConnectionPayload[] = body.connections;

    if (!Array.isArray(connections) || connections.length === 0) {
      return NextResponse.json(
        { error: 'No connections provided' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const prospects: Prospect[] = connections.map((conn) => {
      const { firstName, lastName } = splitName(conn.name);
      const { jobTitle, company } = parseTitle(conn.title || '');

      return {
        id: nanoid(10),
        firstName,
        lastName,
        title: jobTitle,
        company,
        companySize: '',
        industry: '',
        location: '',
        linkedinUrl: conn.url || '',
        connectedOn: conn.connectedOn || '',
        notes: '',
        status: 'new',
        importedAt: new Date().toISOString(),
      };
    });

    // Store for GET pickup
    pendingImport = prospects;

    return NextResponse.json({
      added: prospects.length,
      duplicates: 0,
      message: `Imported ${prospects.length} connections. Open the app to see them.`,
    }, { headers: CORS_HEADERS });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400, headers: CORS_HEADERS }
    );
  }
}

// GET: Retrieve pending import (called by the web app frontend)
export async function GET() {
  if (!pendingImport) {
    return NextResponse.json({ prospects: [], pending: false }, { headers: CORS_HEADERS });
  }

  const prospects = pendingImport;
  pendingImport = null; // Clear after pickup

  return NextResponse.json({ prospects, pending: true }, { headers: CORS_HEADERS });
}
