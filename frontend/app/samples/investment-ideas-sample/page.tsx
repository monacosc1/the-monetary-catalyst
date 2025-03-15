// /frontend/app/samples/investment-ideas-sample/page.tsx
import { getSampleArticleConfig } from '@/config/sampleArticles';
import SampleArticleDisplay from '@/components/SampleArticleDisplay';
import DotPattern from '@/components/DotPattern';
import articleService from '@/services/articleService';

export default async function InvestmentIdeasSamplePage() {
  const config = getSampleArticleConfig('investmentIdeas');
  let article;
  try {
    article = await articleService.getSampleArticleBySlug(config.slug);
  } catch (error) {
    console.error('Error fetching sample article:', error);
    return (
      <div className="bg-background-dark text-white min-h-screen py-12 relative">
        <DotPattern />
        <div className="container mx-auto px-4 relative z-10">
          <div className="bg-white text-black p-8 rounded-lg shadow-xl">
            <p>Failed to load sample article. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="bg-background-dark text-white min-h-screen py-12 relative">
        <DotPattern />
        <div className="container mx-auto px-4 relative z-10">
          <div className="bg-white text-black p-8 rounded-lg shadow-xl">
            <p>Article not found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-dark text-white min-h-screen py-12 relative">
      <DotPattern />
      <div className="container mx-auto px-4 relative z-10">
        <SampleArticleDisplay 
          article={article}
          articleType={config.articleType}
        />
      </div>
    </div>
  );
}