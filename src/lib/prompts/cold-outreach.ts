export const coldOutreachPrompt = `Generate a 4-message cold outreach sequence for this prospect. Return ONLY valid JSON, no markdown fencing.

**Prospect:**
- Name: {{firstName}} {{lastName}}
- Title: {{title}}
- Company: {{company}} ({{companySize}} employees, {{industry}})
- Location: {{location}}
{{#if notes}}- Notes: {{notes}}{{/if}}
{{#if enrichment}}
- Company info: {{enrichment.companyDescription}}
- Recent news: {{enrichment.recentNews}}
- Estimated ad spend: {{enrichment.estimatedAdSpend}}
- Pain points: {{enrichment.painPoints}}
{{/if}}

**Requirements:**
1. Message 1 (Connection/InMail, Day 0): 150 words max. Open with something specific to their role or company. End with a question, not a pitch.
2. Message 2 (Follow-up, Day 3): 100 words max. Share a relevant insight about their industry's measurement challenges. Include a subject line.
3. Message 3 (Follow-up, Day 7): 120 words max. Reference a result or case study. Offer the free Base 12 assessment at {{base12Url}}. Include a subject line.
4. Message 4 (Break-up, Day 14): 80 words max. Friendly close, leave door open. Include a subject line.

**Rules:**
- No "I hope this finds you well" or other cliches
- No fake urgency or pressure
- Each message must stand alone (they may not read previous ones)
- Reference specific details about their company/industry
- The CTA in message 3 should be the Base 12 assessment link
- Keep subject lines under 50 characters (for messages 2-4)

Return your response as a JSON object with this exact structure:
{
  "messages": [
    {
      "day": 0,
      "type": "connection_request",
      "subject": null,
      "body": "..."
    },
    {
      "day": 3,
      "type": "follow_up_1",
      "subject": "...",
      "body": "..."
    },
    {
      "day": 7,
      "type": "follow_up_2",
      "subject": "...",
      "body": "..."
    },
    {
      "day": 14,
      "type": "break_up",
      "subject": "...",
      "body": "..."
    }
  ]
}`;
