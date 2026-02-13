export const referralOutreachPrompt = `Generate a 3-message referral-based outreach sequence for this prospect. Someone has referred or introduced you. Return ONLY valid JSON, no markdown fencing.

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
1. Message 1 (Referral intro, Day 0): 130 words max. Lead with the referral context (from their notes or connection). Briefly mention what you help companies like theirs achieve. End with a specific question about their measurement challenges.
2. Message 2 (Value + CTA, Day 5): 120 words max. Share a relevant insight or quick win. Offer the free Base 12 assessment at {{base12Url}}. Include a subject line.
3. Message 3 (Gentle follow-up, Day 12): 80 words max. Brief, warm close. Reference the referral one more time. Leave door open. Include a subject line.

**Rules:**
- The referral connection must feel natural, not forced
- Higher trust level than cold — be more direct about value proposition
- No "I hope this finds you well" or cliches
- Each message must stand alone
- Reference specific details about their company/industry
- Keep subject lines under 50 characters

Return your response as a JSON object with this exact structure:
{
  "messages": [
    {
      "day": 0,
      "type": "referral_intro",
      "subject": null,
      "body": "..."
    },
    {
      "day": 5,
      "type": "value_cta",
      "subject": "...",
      "body": "..."
    },
    {
      "day": 12,
      "type": "gentle_follow_up",
      "subject": "...",
      "body": "..."
    }
  ]
}`;
