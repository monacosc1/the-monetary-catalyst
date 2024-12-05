export const SAMPLE_ARTICLES = {
  marketAnalysis: {
    id: 11,
    title: "Monetary Policy Strikes Again",
    slug: "monetary-policy-strikes-again"
  },
  investmentIdeas: {
    id: 13,
    title: "Investment Pick for November 2024",
    slug: "investment-pick-for-november-2024"
  }
} as const;

console.log('Sample article IDs:', {
  marketAnalysis: SAMPLE_ARTICLES.marketAnalysis.id,
  investmentIdeas: SAMPLE_ARTICLES.investmentIdeas.id
}); 