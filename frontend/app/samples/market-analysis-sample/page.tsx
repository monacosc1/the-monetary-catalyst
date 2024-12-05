import { SAMPLE_ARTICLES } from '@/config/sampleArticles';
import SampleArticleDisplay from '@/components/SampleArticleDisplay';

export default function MarketAnalysisSamplePage() {
  return (
    <div className="bg-background-dark text-white min-h-screen py-12 relative">
      <div className="container mx-auto px-4 relative z-10">
        <SampleArticleDisplay 
          articleId={SAMPLE_ARTICLES.marketAnalysis.id}
          articleType="market-analysis"
        />
      </div>
    </div>
  );
} 