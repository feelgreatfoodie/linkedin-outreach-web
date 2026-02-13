import type { Message } from './types';

interface SampleSequence {
  style: string;
  industry: string;
  titlePattern: string;
  messages: Message[];
}

export const sampleSequences: SampleSequence[] = [
  {
    style: 'cold',
    industry: 'Technology',
    titlePattern: 'VP|Director|Head',
    messages: [
      {
        day: 0,
        type: 'connection_request',
        subject: null,
        body: 'Hi {{firstName}} — I noticed {{company}} has been scaling quickly in the {{industry}} space. At that growth stage, most marketing teams start finding that platform-reported ROAS numbers don\'t add up when you compare them against actual revenue. The walled garden problem gets worse, not better, as spend increases. How is your team currently handling cross-channel attribution as you scale?',
      },
      {
        day: 3,
        type: 'follow_up_1',
        subject: 'Quick thought on {{industry}} attribution',
        body: '{{firstName}} — I was looking at some research on mid-market {{industry}} companies and a pattern keeps emerging: teams spending $1M+ on marketing are losing 15-30% of budget to misattribution. The culprit is usually relying on platform-reported conversions that double-count across channels. We\'ve been helping companies like {{company}} replace that guesswork with multi-touch models that show where dollars actually drive results.',
      },
      {
        day: 7,
        type: 'follow_up_2',
        subject: '5-min assessment for {{company}}',
        body: '{{firstName}} — One of our clients in a similar space was spending $3M annually on paid media with no clear picture of which channels were driving pipeline. Within 60 days, our measurement framework identified that 22% of their spend was going to channels with near-zero incremental impact. They reallocated and saw a 31% improvement in cost-per-acquisition.\n\nWe built a free 5-minute self-assessment that tells you where your measurement gaps are — no strings attached: https://threebearsdata.com/base12\n\nWorth a look?',
      },
      {
        day: 14,
        type: 'break_up',
        subject: 'Last note from me',
        body: '{{firstName}} — I don\'t want to be another person cluttering your inbox. If marketing measurement isn\'t a priority right now, totally understood. But if it becomes one down the road, I\'m here. The Base 12 assessment (https://threebearsdata.com/base12) is always available as a starting point.\n\nWishing {{company}} continued growth.',
      },
    ],
  },
  {
    style: 'cold',
    industry: 'Retail',
    titlePattern: 'Director|VP|Head|Manager',
    messages: [
      {
        day: 0,
        type: 'connection_request',
        subject: null,
        body: 'Hi {{firstName}} — Retail marketing has a unique attribution challenge: your customers see an ad online, research on their phone, and buy in-store. I\'ve been working with mid-market retailers like {{company}} who are trying to connect those dots. What\'s your team\'s approach to measuring the full customer journey right now?',
      },
      {
        day: 3,
        type: 'follow_up_1',
        subject: 'The retail measurement gap',
        body: '{{firstName}} — Interesting trend in retail analytics: companies spending $2M+ on digital are seeing a 40% gap between what platforms report and what actually drives in-store and online revenue. The issue isn\'t the data — it\'s that each platform grades its own homework. We\'ve been helping retailers build a single source of truth that bridges online and offline.',
      },
      {
        day: 7,
        type: 'follow_up_2',
        subject: 'How a retailer saved $800K',
        body: '{{firstName}} — A mid-market retailer we work with was running seasonal campaigns across 6 channels with no way to measure incrementality. Our measurement platform revealed that two of those channels were cannibalizing each other — they were paying twice for the same conversions. Cutting the overlap saved $800K annually and actually improved performance.\n\nCurious where {{company}} might have similar blind spots? Our free 5-minute assessment gives you a quick read: https://threebearsdata.com/base12',
      },
      {
        day: 14,
        type: 'break_up',
        subject: 'Signing off',
        body: '{{firstName}} — I\'ll keep this brief. If marketing measurement becomes a priority for {{company}}, I\'d welcome the conversation. The Base 12 self-assessment is always there when you need it: https://threebearsdata.com/base12\n\nAll the best with the upcoming quarter.',
      },
    ],
  },
  {
    style: 'warm',
    industry: '*',
    titlePattern: '.*',
    messages: [
      {
        day: 0,
        type: 're_engagement',
        subject: null,
        body: '{{firstName}} — Great to be connected here. I\'ve been following {{company}}\'s growth and it\'s impressive what you\'ve built in the {{industry}} space. I work with marketing leaders at companies around your size who are navigating a common challenge: their ad platforms all claim credit for the same conversions, and nobody has a clear picture of what\'s actually driving results. Is that something your team has been grappling with?',
      },
      {
        day: 3,
        type: 'value_add',
        subject: 'Thought you\'d find this relevant',
        body: '{{firstName}} — Wanted to share something we\'ve been seeing across {{industry}} companies at {{company}}\'s stage: the teams that shift from platform-reported metrics to independent multi-touch attribution are finding 15-30% of their spend was going to low-impact channels. Not because those channels are bad — but because the measurement was wrong. It\'s a surprisingly common blind spot.',
      },
      {
        day: 7,
        type: 'offer',
        subject: 'Quick diagnostic for {{company}}',
        body: '{{firstName}} — We recently helped a company in a similar space go from "we think our marketing works" to "we know exactly which dollars drive revenue." The shift happened in about 60 days.\n\nIf you\'re curious where {{company}}\'s measurement maturity stands, we built a free 5-minute self-assessment that gives you a clear picture — no sales pitch attached: https://threebearsdata.com/base12\n\nHappy to walk through the results if you find them interesting.',
      },
      {
        day: 14,
        type: 'soft_close',
        subject: 'No pressure',
        body: '{{firstName}} — I know timing is everything, and marketing measurement might not be the top priority right now. Totally fine. If it ever moves up the list, I\'m here and happy to help — even if it\'s just a 15-minute brainstorm.\n\nThe self-assessment is always at https://threebearsdata.com/base12 whenever it\'s useful.',
      },
    ],
  },
];
