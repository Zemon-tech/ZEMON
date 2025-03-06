"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Filter, Lightbulb, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import PageContainer from "@/components/layout/PageContainer";
import IdeaCard from "@/components/community/IdeaCard";
import ResourceList from "@/components/community/ResourceList";
import AddIdeaModal from "@/components/community/AddIdeaModal";
import ShareResourceModal from "@/components/community/ShareResourceModal";
import CommentsSidePanel from "@/components/community/CommentsSidePanel";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

interface Comment {
  _id: string;
  userId: string;
  username: string;
  avatar: string;
  text: string;
  createdAt: string;
}

interface Idea {
  _id: string;
  title: string;
  description: string;
  author: {
    _id: string;
    name: string;
  } | null;
  createdAt: string;
  comments: Comment[];
}

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState("ideas");
  const [isAddIdeaOpen, setIsAddIdeaOpen] = useState(false);
  const [isShareResourceOpen, setIsShareResourceOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeComments, setActiveComments] = useState<{ ideaId: string; title: string; comments: Comment[] } | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleShareClick = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to share your ideas and resources.",
        variant: "destructive",
      });
      router.push('/login');
      return;
    }
    
    if (activeTab === "ideas") {
      setIsAddIdeaOpen(true);
    } else {
      setIsShareResourceOpen(true);
    }
  };

  const fetchIdeas = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/api/community/ideas`);
      setIdeas(response.data);
    } catch (error: Error | unknown) {
      console.error('Error fetching ideas:', error);
      setError('Failed to load ideas. Please try again later.');
      toast({
        title: "Error",
        description: "Failed to load ideas. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchResources = () => {
    setActiveTab("resources");
  };

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const filteredIdeas = ideas.filter(idea =>
    idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    idea.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCommentClick = (idea: Idea) => {
    setActiveComments({
      ideaId: idea._id,
      title: idea.title,
      comments: idea.comments
    });
  };

  const handleCloseComments = () => {
    setActiveComments(null);
  };

  return (
    <PageContainer>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto py-4 sm:py-8 px-3 sm:px-6"
      >
        {/* Header Section */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Community Hub</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Share ideas, learn, and grow together with fellow developers
            </p>
          </div>
          <Button onClick={handleShareClick} className="w-full sm:w-auto gap-2 h-9 sm:h-10">
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {activeTab === "ideas" ? "Share Idea" : "Share Resource"}
          </Button>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="ideas" className="space-y-4 sm:space-y-6" onValueChange={setActiveTab}>
          <div className="flex flex-col gap-3 sm:gap-4">
            <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex h-auto p-1">
              <TabsTrigger value="ideas" className="gap-2 px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base">
                <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Ideas
              </TabsTrigger>
              <TabsTrigger value="resources" className="gap-2 px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base">
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Resources
              </TabsTrigger>
            </TabsList>

            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <Input
                  placeholder={`Search ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 sm:h-10 text-sm sm:text-base"
                />
              </div>
              <Button variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 shrink-0">
                <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>

          <TabsContent value="ideas" className="space-y-4 sm:space-y-6 focus-visible:outline-none focus-visible:ring-0">
            {/* Ideas Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {isLoading ? (
                <div className="col-span-full flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-sm sm:text-base text-muted-foreground">Loading ideas...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="col-span-full flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3 text-center px-4">
                    <div className="rounded-full bg-red-100 p-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm sm:text-base text-red-500">{error}</p>
                    <Button variant="outline" size="sm" onClick={fetchIdeas} className="mt-2">
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : filteredIdeas.length > 0 ? (
                filteredIdeas.map((idea) => (
                  <IdeaCard
                    key={idea._id}
                    idea={{
                      id: idea._id,
                      title: idea.title,
                      description: idea.description,
                      author: idea.author,
                      comments: idea.comments,
                      createdAt: idea.createdAt
                    }}
                    onDelete={fetchIdeas}
                    onCommentClick={() => handleCommentClick(idea)}
                  />
                ))
              ) : (
                <div className="col-span-full flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3 text-center px-4">
                    <div className="rounded-full bg-muted p-3">
                      <Lightbulb className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground">No ideas found. Be the first to share an idea!</p>
                    <Button size="sm" onClick={() => setIsAddIdeaOpen(true)} className="mt-2">
                      Share Idea
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4 sm:space-y-6 focus-visible:outline-none focus-visible:ring-0">
            <ResourceList />
          </TabsContent>
        </Tabs>
      </motion.div>

      <AddIdeaModal
        isOpen={isAddIdeaOpen}
        onClose={() => setIsAddIdeaOpen(false)}
        onIdeaAdded={fetchIdeas}
      />

      <ShareResourceModal
        isOpen={isShareResourceOpen}
        onClose={() => setIsShareResourceOpen(false)}
        onResourceAdded={fetchResources}
      />

      {activeComments && (
        <CommentsSidePanel
          isOpen={true}
          onClose={handleCloseComments}
          ideaId={activeComments.ideaId}
          ideaTitle={activeComments.title}
          comments={activeComments.comments}
          onRefresh={fetchIdeas}
        />
      )}
    </PageContainer>
  );
} 