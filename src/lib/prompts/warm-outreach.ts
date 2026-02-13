export const warmOutreachPrompt = `Generate a 4-message warm outreach sequence for this prospect. This is someone who is already a LinkedIn connection. Return ONLY valid JSON, no markdown fencing.

**Prospect:**
- Name: {{firstName}} {{lastName}}
- Title: {{title}}
- Company: {{company}} ({{companySize}} employees, {{industry}})
- Location: {{location}}
- Connected on: {{connectedOn}}
{{#if notes}}- Notes: {{notes}}{{/if}}
{{#if enrichment}}
- Company info: {{enrichment.companyDescription}}
- Recent news: {{enrichment.recentNews}}
- Estimated ad spend: {{enrichment.estimatedAdSpend}}
- Pain points: {{enrichment.painPoints}}
{{/if}}

**Requirements:**
1. Message 1 (Re-engagement, Day 0): 120 words max. Reference the existing connection. Open naturally — comment on something they posted, a shared interest, or a mutual connection. Transition to a relevant industry challenge.
2. Message 2 (Value-add, Day 3): 100 words max. Share a specific insight relevant to their company's stage or industry. Include a subject line.
3. Message 3 (Offer, Day 7): 120 words max. Reference a relevant case study or metric. Offer the free Base 12 assessment at {{base12Url}}. Include a subject line.
4. Message 4 (Soft close, Day 14): 80 words max. Warm close acknowledging the existing relationship. Leave door open. Include a subject line.

**Rules:**
- Leverage the existing connection — this is NOT a cold outreach
- Reference any notes or context about how you connected
- No corporate-speak or formal language
- Each message must stand alone
- Reference specific details about their company/industry
- The CTA in message 3 should be the Base 12 assessment link
- Keep subject lines under 50 characters

Return your response as a JSON object with this exact structure:
{
  "messages": [
    {
      "day": 0,
      "type": "re_engagement",
      "subject": null,
      "body": "..."
    },
    {
      "day": 3,
      "type": "value_add",
      "subject": "...",
      "body": "..."
    },
    {
      "day": 7,
      "type": "offer",
      "subject": "...",
      "body": "..."
    },
    {
      "day": 14,
      "type": "soft_close",
      "subject": "...",
      "body": "..."
    }
  ]
}`;
