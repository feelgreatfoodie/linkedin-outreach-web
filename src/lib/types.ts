export type ProspectStatus = 'new' | 'enriched' | 'sequenced' | 'contacted';
export type OutreachStyle = 'cold' | 'warm' | 'referral';

export interface Prospect {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  companySize: string;
  industry: string;
  location: string;
  linkedinUrl: string;
  connectedOn: string;
  notes: string;
  status: ProspectStatus;
  importedAt: string;
}

export interface Message {
  day: number;
  type: string;
  subject: string | null;
  body: string;
}

export interface Sequence {
  id: string;
  prospectId: string;
  prospectName: string;
  company: string;
  style: OutreachStyle;
  model: string;
  provider: string;
  generatedAt: string;
  generationTime: string;
  demo?: boolean;
  messages: Message[];
}
