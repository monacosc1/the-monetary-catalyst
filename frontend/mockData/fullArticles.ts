type ContentItem = 
  | { type: 'paragraph'; content: string }
  | { type: 'image'; url?: string; caption?: string };

export const fullArticles: Array<{
  id: number;
  title: string;
  content: ContentItem[];
  author: string;
  publish_date: string;
  updated_at: string;
  type: string;
  slug: string;
  excerpt: string;
  image_url: string;
}> = [
  {
    id: 1,
    title: "The Stock Market Is About to Get Rug Pulled",
    content: [
      {
        type: 'paragraph',
        content: "The stock market has been on a rollercoaster ride in recent years, with unprecedented highs followed by sharp corrections. As we approach the final quarter of 2024, all signs point to a major market event that could catch many investors off guard. This article delves into the factors contributing to this potential 'rug pull' and what it means for investors."
      },
      {
        type: 'paragraph',
        content: "First and foremost, we need to consider the current market valuations. Price-to-earnings ratios across major indices have reached levels not seen since the dot-com bubble. This overvaluation has been fueled by a combination of loose monetary policy, retail investor enthusiasm, and a general sense of FOMO (fear of missing out) in the market."
      },
      {
        type: 'image',
        url: '/images/market-valuation-chart.png',
        caption: 'S&P 500 Price-to-Earnings Ratio (2000-2024)'
      },
      {
        type: 'paragraph',
        content: "However, several economic indicators are flashing warning signs. Inflation has remained stubbornly high, forcing central banks to maintain higher interest rates for longer than initially anticipated. This prolonged period of tight monetary policy is starting to take its toll on corporate earnings and consumer spending."
      },
      {
        type: 'paragraph',
        content: "Moreover, geopolitical tensions have been escalating, with trade disputes and regional conflicts threatening to disrupt global supply chains. The energy sector, in particular, has been volatile, with oil prices fluctuating wildly in response to these geopolitical events."
      },
      {
        type: 'image',
        url: '/images/geopolitical-risk-index.png',
        caption: 'Global Geopolitical Risk Index (2020-2024)'
      },
      {
        type: 'paragraph',
        content: "Another crucial factor to consider is the state of the housing market. After years of rapid appreciation, fueled by low interest rates and increased demand for suburban living during the pandemic, the real estate sector is showing signs of cooling. A significant correction in housing prices could have far-reaching effects on consumer wealth and spending."
      },
      {
        type: 'paragraph',
        content: "Lastly, we cannot ignore the role of technology and artificial intelligence in shaping market dynamics. The rapid advancement of AI has led to increased automation in trading, potentially exacerbating market volatility during times of stress."
      },
      {
        type: 'image',
        url: '/images/ai-trading-volume.png',
        caption: 'AI-Driven Trading Volume as a Percentage of Total Market Volume (2022-2024)'
      },
      {
        type: 'paragraph',
        content: "In conclusion, while it's impossible to predict the exact timing of a market downturn, the confluence of these factors suggests that we may be on the brink of a significant correction. Investors would be wise to reassess their risk tolerance, diversify their portfolios, and prepare for increased volatility in the coming months."
      }
    ],
    author: "John Doe",
    publish_date: "Oct 24, 2024",
    updated_at: "2024-10-24T09:00:00Z",
    type: "market_analysis",
    slug: "stock-market-rug-pull",
    excerpt: "Analysis of potential market downturn and its implications.",
    image_url: "/images/example-image.png"
  }
];
