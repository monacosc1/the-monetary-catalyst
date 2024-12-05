export const SAMPLE_ARTICLES = {
  marketAnalysis: {
    id: 7,
    title: "Fiscal Policy is a Mess",
    slug: "fiscal-policy-is-a-mess"
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