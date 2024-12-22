import { SAMPLE_ARTICLES } from '@/config/sampleArticles';
import SampleArticleDisplay from '@/components/SampleArticleDisplay';
import DotPattern from '@/components/DotPattern';

export default function InvestmentIdeasSamplePage() {
  return (
    <div className="bg-background-dark text-white min-h-screen py-12 relative">
      <DotPattern />
      <div className="container mx-auto px-4 relative z-10">
        <SampleArticleDisplay 
          articleId={SAMPLE_ARTICLES.investmentIdeas.id}
          articleType="investment-ideas"
        />
      </div>
    </div>
  );
} 