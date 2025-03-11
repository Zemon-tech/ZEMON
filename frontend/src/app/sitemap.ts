import { MetadataRoute } from 'next';

async function fetchAllUrls() {
  try {
    // Fetch all dynamic routes from your API
    const [reposResponse, toolsResponse, newsResponse, eventsResponse] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/repos`),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/store`),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/news`),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events`),
    ]);

    const [reposData, toolsData, newsData, eventsData] = await Promise.all([
      reposResponse.json(),
      toolsResponse.json(),
      newsResponse.json(),
      eventsResponse.json(),
    ]);

    return {
      repos: reposData.data?.repos || [],
      tools: toolsData.data?.tools || [],
      news: newsData.data?.news || [],
      events: eventsData.data?.events || [],
    };
  } catch (error) {
    console.error('Error fetching URLs for sitemap:', error);
    return {
      repos: [],
      tools: [],
      news: [],
      events: [],
    };
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://zemon.dev';
  
  // Static routes
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/repos`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/store`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/community`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ] as MetadataRoute.Sitemap;

  // Fetch dynamic routes
  const { repos, tools, news, events } = await fetchAllUrls();

  // Add dynamic routes
  const dynamicRoutes = [
    ...repos.map((repo: { _id: string, updatedAt: string }) => ({
      url: `${baseUrl}/repos/${repo._id}`,
      lastModified: new Date(repo.updatedAt),
      changeFrequency: 'weekly',
      priority: 0.7,
    })),
    ...tools.map((tool: { _id: string, updatedAt: string }) => ({
      url: `${baseUrl}/store/${tool._id}`,
      lastModified: new Date(tool.updatedAt),
      changeFrequency: 'weekly',
      priority: 0.7,
    })),
    ...news.map((article: { _id: string, createdAt: string }) => ({
      url: `${baseUrl}/news/${article._id}`,
      lastModified: new Date(article.createdAt),
      changeFrequency: 'monthly',
      priority: 0.6,
    })),
    ...events.map((event: { _id: string, updatedAt: string }) => ({
      url: `${baseUrl}/events/${event._id}`,
      lastModified: new Date(event.updatedAt),
      changeFrequency: 'weekly',
      priority: 0.6,
    })),
  ] as MetadataRoute.Sitemap;

  return [...staticRoutes, ...dynamicRoutes];
} 