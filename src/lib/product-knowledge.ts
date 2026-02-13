export const productKnowledge = {
  company: "Three Bears Data",
  website: "https://threebearsdata.com",
  products: {
    optimmeasure: {
      name: "Optimmeasure",
      tagline: "Marketing measurement and optimization platform",
      price: "$60-90K annually",
      addOns: [
        "Scenario Planning ($30K)",
        "Creative Effectiveness",
        "Market Benchmarks"
      ],
      targetCompanySize: "500-5000 employees",
      targetAdSpend: "$1M+ annually",
      targetTitles: [
        "VP of Marketing",
        "CMO",
        "Director of Analytics",
        "Head of Growth",
        "Director of Marketing"
      ],
      industries: [
        "Technology",
        "E-commerce",
        "Financial Services",
        "Healthcare",
        "Retail",
        "SaaS"
      ]
    },
    base60: {
      name: "Base 60 Framework",
      assessmentUrl: "https://threebearsdata.com/base12",
      tiers: {
        base12: {
          name: "Decision Readiness Assessment",
          price: "Free",
          duration: "5 minutes"
        },
        base60: {
          name: "Guided Diagnostic",
          price: "Free",
          duration: "60 minutes"
        },
        foundations: {
          name: "B60 Data Foundations",
          price: "$36,000",
          duration: "3 months"
        },
        advisory: {
          name: "Ongoing Advisory",
          price: "$8-12K/month",
          duration: "Ongoing"
        }
      }
    }
  },
  differentiators: [
    "Multi-touch attribution replacing outdated marketing mix models",
    "Data science expertise at a fraction of in-house cost",
    "Purpose-built reporting interface (not generic BI tools)",
    "Synthetic data for market benchmark reports",
    "Educational approach: inform first, sell second"
  ],
  painPoints: [
    "Walled garden attribution data from ad platforms",
    "Marketing mix models can't handle real-time optimization",
    "In-house data science teams cost $500K+ annually",
    "No single source of truth for marketing performance",
    "Can't measure incremental impact of marketing spend"
  ],
  socialProof: [
    "Helped mid-market brands identify 15-30% wasted ad spend",
    "Reduced time-to-insight from weeks to hours",
    "Replaced $400K in-house analytics with fractional model"
  ]
} as const;
