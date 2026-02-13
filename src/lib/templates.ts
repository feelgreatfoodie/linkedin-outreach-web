import { systemPrompt } from './prompts/system';
import { coldOutreachPrompt } from './prompts/cold-outreach';
import { warmOutreachPrompt } from './prompts/warm-outreach';
import { referralOutreachPrompt } from './prompts/referral-outreach';
import type { Prospect, OutreachStyle } from './types';

const BASE12_URL = 'https://threebearsdata.com/base12';

const PROMPT_MAP: Record<OutreachStyle, string> = {
  cold: coldOutreachPrompt,
  warm: warmOutreachPrompt,
  referral: referralOutreachPrompt,
};

export function fillTemplate(template: string, prospect: Prospect): string {
  let result = template;

  result = result.replace(/\{\{firstName\}\}/g, prospect.firstName || '');
  result = result.replace(/\{\{lastName\}\}/g, prospect.lastName || '');
  result = result.replace(/\{\{title\}\}/g, prospect.title || '');
  result = result.replace(/\{\{company\}\}/g, prospect.company || '');
  result = result.replace(/\{\{companySize\}\}/g, prospect.companySize || 'Unknown');
  result = result.replace(/\{\{industry\}\}/g, prospect.industry || 'Unknown');
  result = result.replace(/\{\{location\}\}/g, prospect.location || 'Unknown');
  result = result.replace(/\{\{connectedOn\}\}/g, prospect.connectedOn || 'N/A');
  result = result.replace(/\{\{notes\}\}/g, prospect.notes || '');
  result = result.replace(/\{\{base12Url\}\}/g, BASE12_URL);

  // Conditional blocks: {{#if notes}}...{{/if}}
  result = result.replace(/\{\{#if notes\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, content: string) => {
    return prospect.notes ? content : '';
  });

  // Enrichment conditional block (prospects don't have enrichment in web version yet)
  result = result.replace(/\{\{#if enrichment\}\}([\s\S]*?)\{\{\/if\}\}/g, () => '');

  // Clean up empty lines
  result = result.replace(/\n{3,}/g, '\n\n');

  return result.trim();
}

export function getSystemPrompt(): string {
  return systemPrompt;
}

export function getOutreachPrompt(style: OutreachStyle, prospect: Prospect): string {
  const template = PROMPT_MAP[style];
  if (!template) {
    throw new Error(`Unknown outreach style: ${style}. Use: cold, warm, or referral`);
  }
  return fillTemplate(template, prospect);
}
