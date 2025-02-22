"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import SearchAndFilter from "@/components/layout/SearchAndFilter";
import { Button } from "@/components/ui/button";
import NewsForm from "@/components/news/NewsForm";
import NewsCard from "@/components/news/NewsCard";
import { useToast } from "@/components/ui/use-toast";
import { API_BASE_URL } from "@/lib/api";

interface NewsArticle {
  _id: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  image: string;
  tags: string[];
  author: {
    _id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  views: number;
  likes: string[];
}

export default function NewsPage() {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { toast } = useToast();

  const filterOptions = [
    { label: "All Categories", value: "all" },
    { label: "Framework Updates", value: "Framework Updates" },
    { label: "Security", value: "Security" },
    { label: "Community", value: "Community" },
    { label: "Tutorials", value: "Tutorials" },
  ];

  const fetchNews = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/news`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        }
      });
      const data = await response.json();
      if (data.success) {
        setNews(data.data.news);
      } else {
        throw new Error(data.message || 'Failed to fetch news');
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      toast({
        title: "Error",
        description: "Failed to fetch news articles",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleSubmitNews = async (formData: FormData) => {
    try {
      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to submit news",
          variant: "destructive",
        });
        router.push('/login');
        return;
      }

      // Get user data from token
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const userId = tokenData.id;

      const newsData = {
        title: formData.get('title'),
        content: formData.get('content'),
        excerpt: formData.get('content')?.toString().slice(0, 150) + '...',
        category: formData.get('category'),
        image: formData.get('image'),
        tags: formData.get('tags')?.toString().split(',').map(tag => tag.trim()),
        author: userId  // Add the author ID
      };

      console.log('Submitting news with data:', newsData);  // Debug log

      const response = await fetch(`${API_BASE_URL}/api/news`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newsData),
      });

      const data = await response.json();
      console.log('Response from news creation:', data);  // Debug log

      if (data.success) {
        toast({
          title: "Success",
          description: "News article published successfully",
        });
        setShowAddForm(false);
        fetchNews(); // Refresh the news list
      } else {
        throw new Error(data.message || 'Failed to publish news');
      }
    } catch (error) {
      console.error("Error creating news:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to publish news",
        variant: "destructive",
      });
    }
  };

  // Filter news based on search query and category
  const filteredNews = news.filter(article => {
    const matchesSearch = searchQuery.toLowerCase() === '' || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <PageContainer className="py-6">
      <PageHeader
        title="Tech News"
        description="Stay updated with the latest developments in the tech world"
        action={
          <Button className="gap-2" onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4" />
            Submit News
          </Button>
        }
      />

      <SearchAndFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* News Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {isLoading ? (
          // Loading skeletons
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-card animate-pulse rounded-lg p-4 h-64" />
          ))
        ) : filteredNews.length > 0 ? (
          filteredNews.map((article) => (
            <div key={article._id} onClick={() => router.push(`/news/${article._id}`)}>
              <NewsCard
                news={{
                  id: article._id,
                  title: article.title,
                  category: article.category || 'Uncategorized',
                  date: new Date(article.createdAt).toLocaleDateString(),
                  image: article.image || '/placeholder-news.jpg',
                  excerpt: article.excerpt,
                  views: article.views,
                  author: article.author ? {
                    _id: article.author._id,
                    name: article.author.name || 'Anonymous',
                    avatar: article.author.avatar
                  } : undefined
                }}
                onDelete={() => {
                  // Refresh the news list after deletion
                  fetchNews();
                }}
              />
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No news articles found
          </div>
        )}
      </div>

      {showAddForm && (
        <NewsForm
          onSubmit={handleSubmitNews}
          onCancel={() => setShowAddForm(false)}
        />
      )}
    </PageContainer>
  );
} 