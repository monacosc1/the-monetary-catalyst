// /frontend/config/sampleArticles.ts
export const SAMPLE_ARTICLES = {
  marketAnalysis: {
    development: {
      slug: 'central-bank-failure',
      title: 'Test3: Monetary Policy Strikes Again',
      articleType: 'market-analysis',
    },
    production: {
      slug: 'are-financial-conditions-actually-tight',
      title: 'Are Financial Conditions Actually Tight?',
      articleType: 'market-analysis',
    },
  },
  investmentIdeas: {
    development: {
      slug: 'investment-pick-2024',
      title: 'Test4: Investment Pick for November 2024',
      articleType: 'investment-ideas',
    },
    production: {
      slug: 'investment-pick-for-november-2024', // Update with a new production slug later
      title: 'Investment Pick for November 2024', // Update with a new title later
      articleType: 'investment-ideas',
    },
  },
} as const;

export function getSampleArticleConfig(type: 'marketAnalysis' | 'investmentIdeas') {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const env = isDevelopment ? 'development' : 'production';
  return SAMPLE_ARTICLES[type][env];
}

console.log('Sample article configs:', {
  marketAnalysis: getSampleArticleConfig('marketAnalysis'),
  investmentIdeas: getSampleArticleConfig('investmentIdeas'),
});