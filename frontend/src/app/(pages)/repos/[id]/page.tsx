"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Star, GitFork, AlertCircle, GitPullRequest } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import PageContainer from "@/components/layout/PageContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import Image from "next/image";
import OverviewTab from "@/components/repos/tabs/OverviewTab";
import ActivityTab from "@/components/repos/tabs/ActivityTab";
import ContributorsTab from "@/components/repos/tabs/ContributorsTab";
import DependenciesTab from "@/components/repos/tabs/DependenciesTab";
import { getRepoDetails } from "@/lib/github";

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
}

interface Repository {
  _id: string;
  name: string;
  description: string;
  github_url: string;
  stars: number;
  forks: number;
  branches: number;
  contributors: Array<{
    login: string;
    avatar_url: string;
    contributions: number;
  }>;
  thumbnail_url: string;
  owner: string;
  readme_url: string;
  likes: string[];
  comments: Array<{
    user: string;
    content: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
  avatar?: string;
  openIssues: number;
  pullRequests: number;
  readme?: string;
  languages?: string[];
  lastCommits?: Array<{
    date: string;
    commits: number;
  }>;
  activityData?: Array<{
    date: string;
    commits: number;
    pullRequests: number;
  }>;
  dependencies?: Array<{
    name: string;
    version: string;
    latest: string;
    type: "production" | "development";
    hasVulnerabilities: boolean;
    isOutdated: boolean;
  }>;
}

interface GithubData {
  repoData: {
    readme: string;
    [key: string]: any;
  };
  languages: Array<{
    name: string;
    value: number;
    color: string;
    bytes: number;
  }>;
  branches: Array<{
    name: string;
    lastCommit: string;
    protected: boolean;
  }>;
  commits: Array<{
    date: string;
    message: string;
    author: string;
    sha: string;
    url: string;
  }>;
  repoInfo: {
    owner: string;
    name: string;
    defaultBranch: string;
  };
  activityData: Array<{
    date: string;
    commits: number;
    pullRequests: number;
  }>;
  pullRequests: Array<{
    title: string;
    author: string;
    status: "open" | "merged" | "closed";
    createdAt: string;
    number: number;
    url: string;
  }>;
}

export default function RepoDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const [repo, setRepo] = useState<Repository | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [githubData, setGithubData] = useState<GithubData | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch repo data from your API
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/repos/${params.id}`);
        const data = await response.json();
        
        if (data.success) {
          setRepo(data.data);
          
          // Fetch GitHub data
          const githubData = await getRepoDetails(data.data.owner, data.data.name);
          setGithubData(githubData);
        } else {
          throw new Error(data.message || 'Failed to fetch repository details');
        }
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Error",
          description: "Failed to load repository details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchAllData();
    }
  }, [params.id, toast]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="animate-pulse space-y-4 py-8">
          <div className="h-8 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="h-96 bg-muted rounded"></div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!repo) {
    return (
      <PageContainer>
        <div className="py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Repository not found</h1>
          <Link href="/repos" className="text-primary hover:underline">
            Back to Repositories
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-4 sm:py-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Link
          href="/repos"
          className="inline-flex items-center gap-1.5 sm:gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          Back to Repositories
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl bg-primary/10 flex items-center justify-center relative">
              <Image
                src={repo.avatar || "/Z.jpg"}
                alt={repo.name}
                className="h-8 w-8 sm:h-12 sm:w-12"
                width={48}
                height={48}
              />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold">{repo.name}</h1>
              <p className="text-sm sm:text-base text-muted-foreground">{repo.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="outline" size="sm" asChild className="text-xs sm:text-sm">
              <a href={repo.github_url} target="_blank" rel="noopener noreferrer">
                <Github className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                View on GitHub
              </a>
            </Button>
            <Button size="sm" className="text-xs sm:text-sm">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Star
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Stars"
            value={repo.stars}
            icon={<Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500" />}
          />
          <StatCard
            title="Forks"
            value={repo.forks}
            icon={<GitFork className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          />
          <StatCard
            title="Open Issues"
            value={repo.openIssues}
            icon={<AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          />
          <StatCard
            title="Pull Requests"
            value={repo.pullRequests}
            icon={<GitPullRequest className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          />
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="w-full sm:w-auto inline-flex">
            <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
            <TabsTrigger value="activity" className="text-sm">Activity</TabsTrigger>
            <TabsTrigger value="contributors" className="text-sm">Contributors</TabsTrigger>
            <TabsTrigger value="dependencies" className="text-sm">Dependencies</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <OverviewTab
            readme={githubData?.repoData?.readme || ""}
            languages={githubData?.languages || []}
            branches={githubData?.branches || []}
            lastCommits={githubData?.commits || []}
            repoInfo={githubData?.repoInfo || {
              owner: repo?.owner || '',
              name: repo?.name || '',
              defaultBranch: 'main' // fallback
            }}
          />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <ActivityTab
            activityData={githubData?.activityData || []}
            pullRequests={githubData?.pullRequests || []}
          />
        </TabsContent>

        <TabsContent value="contributors" className="space-y-4">
          <ContributorsTab
            contributors={repo.contributors?.map(c => ({
              ...c,
              pullRequests: 0,
              reviews: 0
            })) || []}
            totalContributions={repo.contributors?.reduce((acc, curr) => acc + curr.contributions, 0) || 0}
          />
        </TabsContent>

        <TabsContent value="dependencies" className="space-y-4">
          <DependenciesTab
            dependencies={repo.dependencies || []}
          />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-lg sm:text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
} 