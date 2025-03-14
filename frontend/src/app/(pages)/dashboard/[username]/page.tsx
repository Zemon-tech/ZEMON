"use client";

import { useState, useEffect } from "react";
import { 
  Github, Star, GitFork,
  ExternalLink, Eye, Linkedin,
  Share2, Edit, Globe,
  Wrench,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import PageContainer from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import GitHubStats from "@/components/dashboard/GitHubStats";
import GitHubRepos from "@/components/dashboard/GitHubRepos";
import { fetchGitHubProfile } from "@/lib/github";
import Image from "next/image";
import Link from "next/link";

interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  avatar?: string;
  github_username?: string;
  github?: string;
  phone?: string;
  role?: string;
  linkedin?: string;
  personalWebsite?: string;
  displayName?: string;
  education?: {
    university?: string;
    graduationYear?: string;
  };
}

interface UserStats {
  totalRepos: number;
  totalStars: number;
  totalForks: number;
  followers: number;
  following: number;
  contributions: number;
}

interface GithubRepo {
  id: number;
  name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
  updated_at: string;
}

interface PublishedProject {
  _id: string;
  name: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  github_url: string;
  githubUrl: string;
  updatedAt: string;
  createdAt: string;
  added_by: {
    _id: string;
    name: string;
  };
}

interface Tool {
  _id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: string;
  tags: string[];
  url: string;
  github_url?: string;
  dev_docs?: string;
  views: number;
  createdAt: string;
  updatedAt: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function UserDashboardPage() {
  const params = useParams();
  const username = params.username as string;
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [stats, setStats] = useState<UserStats | null>(null);
  const router = useRouter();
  const [publishedProjects, setPublishedProjects] = useState<PublishedProject[]>([]);
  const [userTools, setUserTools] = useState<Tool[]>([]);
  const [isCurrentUserProfile, setIsCurrentUserProfile] = useState(false);
  const [githubRepos, setGithubRepos] = useState<GithubRepo[]>([]);

  // Fetch the profile user data
  useEffect(() => {
    const fetchProfileUser = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch user profile by username
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/users/${username}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('User not found');
          }
          throw new Error('Failed to fetch user profile');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setUser(data.data);
          
          // Check if GitHub username exists
          const githubUsername = data.data.github || data.data.github_username;
          
          if (githubUsername) {
            try {
              // Fetch GitHub profile directly using the GitHub API
              const githubData = await fetchGitHubProfile(githubUsername);
              
              // Set stats from GitHub data
              setStats({
                totalRepos: githubData.public_repos,
                totalStars: githubData.total_stars,
                totalForks: 0,
                followers: githubData.followers,
                following: githubData.following,
                contributions: githubData.contributionStats?.totalContributions || 0
              });
              
              // Set GitHub repositories
              setGithubRepos(githubData.repositories.map(repo => ({
                id: Math.random(),
                name: repo.name,
                description: repo.description,
                html_url: repo.html_url,
                stargazers_count: repo.stars,
                forks_count: repo.forks,
                language: repo.language,
                updated_at: repo.updatedAt
              })));
              
            } catch (githubError) {
              console.error("GitHub fetch error:", githubError);
            }
          }
          
          // Fetch user's published projects
          try {
            const projectsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/repos/user/${username}`);
            
            if (projectsResponse.ok) {
              const projectsData = await projectsResponse.json();
              if (projectsData.success) {
                setPublishedProjects(projectsData.data.repos || []);
              }
            }
          } catch (projectsError) {
            console.error("Projects fetch error:", projectsError);
          }
          
          // Fetch user's tools
          try {
            const toolsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/store/user/${username}`);
            
            if (toolsResponse.ok) {
              const toolsData = await toolsResponse.json();
              if (toolsData.success) {
                setUserTools(toolsData.data.tools || []);
              }
            }
          } catch (toolsError) {
            console.error("Tools fetch error:", toolsError);
          }
        } else {
          throw new Error(data.message || 'Failed to fetch user profile');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load user profile",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (username) {
      fetchProfileUser();
    }
  }, [username, router, toast]);

  // Check if the current user is viewing their own profile
  useEffect(() => {
    const checkCurrentUser = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (!storedUser || !token) {
          setIsCurrentUserProfile(false);
          return;
        }

        const user = JSON.parse(storedUser);
        if (user.username === username) {
          setIsCurrentUserProfile(true);
        } else {
          setIsCurrentUserProfile(false);
        }
      } catch (error) {
        console.error('Error checking current user:', error);
        toast({
          title: "Error",
          description: "Failed to verify user profile access.",
          variant: "destructive",
        });
      }
    };

    checkCurrentUser();
  }, [username, toast]);

  const handleShareProfile = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "Profile link copied to clipboard",
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
          {/* Profile Header Skeleton */}
          <div className="mb-8">
            <div className="bg-card rounded-xl shadow-sm overflow-hidden">
              <div className="h-32 bg-muted animate-pulse relative">
                <div className="absolute top-4 right-4 flex gap-2">
                  <div className="h-8 bg-background/30 rounded w-28 animate-pulse" />
                  <div className="h-8 bg-background/30 rounded w-20 animate-pulse" />
                </div>
              </div>
              <div className="p-6 pt-0 relative">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0 -mt-16">
                    <div className="w-32 h-32 rounded-full bg-muted animate-pulse border-4 border-background" />
                  </div>
                  
                  <div className="flex-1 pt-4 md:pt-0">
                    <div className="flex flex-col justify-between gap-4 mb-6">
                      <div>
                        <div className="h-8 bg-muted rounded w-48 animate-pulse mb-2" />
                        <div className="h-5 bg-muted rounded w-32 animate-pulse mb-2" />
                        <div className="h-4 bg-muted rounded w-40 animate-pulse" />
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 mb-4">
                      <div className="h-9 bg-muted rounded w-24 animate-pulse" />
                      <div className="h-9 bg-muted rounded w-28 animate-pulse" />
                      <div className="h-9 bg-muted rounded w-24 animate-pulse" />
                    </div>
                    
                    <div className="h-4 bg-muted rounded w-56 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* GitHub Stats Skeleton */}
          <div className="mb-8">
            <div className="bg-card rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 pb-2">
                <div className="h-7 bg-muted rounded w-40 animate-pulse" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-6 pt-0">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-muted rounded-lg p-5 animate-pulse">
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-4 bg-background/50 rounded w-24" />
                      <div className="h-5 w-5 rounded-full bg-background/50" />
                    </div>
                    <div className="h-8 bg-background/50 rounded w-16" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Content Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl shadow-sm overflow-hidden border border-muted/40">
                <div className="p-4">
                  <div className="h-6 bg-muted rounded w-3/4 animate-pulse mb-3" />
                  <div className="h-4 bg-muted rounded w-full animate-pulse mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3 animate-pulse mb-4" />
                  <div className="flex gap-3">
                    <div className="h-5 bg-muted rounded w-16 animate-pulse" />
                    <div className="h-5 bg-muted rounded w-16 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error || !user) {
    return (
      <PageContainer>
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
          <div className="bg-card rounded-xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">User not found</h1>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              The user you&apos;re looking for doesn&apos;t exist or there was an error loading their profile.
            </p>
            <Button onClick={() => router.push('/')} variant="outline">
              Return to Home
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-7xl mx-auto py-4 sm:py-8 px-3 sm:px-6">
        {/* Profile Header - Redesigned with modern UI */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-card rounded-xl shadow-sm overflow-hidden border border-muted/40">
            <div className="h-24 sm:h-32 bg-gradient-to-r from-primary/10 via-primary/15 to-primary/30 dark:from-primary/5 dark:to-primary/20 relative">
              <div className="absolute inset-0 bg-gradient-to-l from-black/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-card to-transparent"></div>
              <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex gap-2">
                {isCurrentUserProfile && (
                  <Button variant="outline" size="sm" className="gap-1 sm:gap-2 bg-background/80 backdrop-blur-sm hover:bg-background/90 border-muted/50 text-xs sm:text-sm" onClick={() => router.push('/settings')}>
                    <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                    Edit Profile
                  </Button>
                )}
                <Button variant="outline" size="sm" className="gap-1 sm:gap-2 bg-background/80 backdrop-blur-sm hover:bg-background/90 border-muted/50 text-xs sm:text-sm" onClick={handleShareProfile}>
                  <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  Share
                </Button>
              </div>
            </div>
            
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 relative">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-shrink-0 -mt-10 sm:-mt-12 z-10">
                  <div className="rounded-full p-1 bg-card ring-2 ring-background shadow-md border border-muted/40">
                    <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border border-muted/50">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="text-lg sm:text-xl bg-primary/10">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                
                <div className="flex-1 pt-0 md:pt-0 md:mt-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                    <div className="p-2 sm:p-3 bg-muted/5 rounded-lg border border-muted/30">
                      <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{user.displayName || user.name}</h1>
                      <p className="text-sm sm:text-base text-muted-foreground flex items-center gap-2">
                        <span className="text-primary font-medium">@{user.name}</span>
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
                      {user.github && (
                        <a 
                          href={user.github.startsWith('http') ? user.github : `https://github.com/${user.github}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:no-underline"
                        >
                          <Button variant="outline" size="sm" className="gap-1.5 h-8 sm:h-9 rounded-full px-3 sm:px-4 border-muted/50 text-xs sm:text-sm">
                            <Github className="w-3 h-3 sm:w-4 sm:h-4" />
                            GitHub
                          </Button>
                        </a>
                      )}
                      {user.linkedin && (
                        <a 
                          href={user.linkedin.startsWith('http') ? user.linkedin : `https://linkedin.com/in/${user.linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:no-underline"
                        >
                          <Button variant="outline" size="sm" className="gap-1.5 h-8 sm:h-9 rounded-full px-3 sm:px-4 border-muted/50 text-xs sm:text-sm">
                            <Linkedin className="w-3 h-3 sm:w-4 sm:h-4" />
                            LinkedIn
                          </Button>
                        </a>
                      )}
                      {user.personalWebsite && (
                        <a 
                          href={user.personalWebsite.startsWith('http') ? user.personalWebsite : `https://${user.personalWebsite}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:no-underline"
                        >
                          <Button variant="outline" size="sm" className="gap-1.5 h-8 sm:h-9 rounded-full px-3 sm:px-4 border-muted/50 text-xs sm:text-sm">
                            <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
                            Portfolio
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                  
                  {user.education?.university && (
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-graduation-cap sm:w-4 sm:h-4">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                        <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
                      </svg>
                      {user.education.university}
                      {user.education.graduationYear && (
                        <span className="inline-flex items-center">
                          <span className="mx-1">•</span> Class of {user.education.graduationYear}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* GitHub Stats - Redesigned */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-card rounded-xl shadow-sm overflow-hidden border border-muted/40">
            <div className="p-4 sm:p-6 pb-0 border-b border-muted/40">
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <Github className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                GitHub Stats
              </h2>
            </div>
            
            <GitHubStats data={stats ? {
              repos: stats.totalRepos,
              followers: stats.followers,
              following: stats.following,
              contributions: stats.contributions,
              stars: stats.totalStars,
              forks: stats.totalForks
            } : null} />
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6 sm:space-y-8">
          {/* Projects and Tools Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Published Projects */}
            <div>
              {publishedProjects.length > 0 ? (
                <div className="bg-card rounded-xl shadow-sm overflow-hidden border border-muted/40 h-full">
                  <div className="p-4 sm:p-6">
                    <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2">
                      <Github className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                      Published Projects
                    </h2>
                    <div className="space-y-4">
                      {publishedProjects.map((project) => (
                        <Card key={project._id} className="hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                          <CardContent className="p-4">
                            <div className="space-y-4">
                              {/* Header Section */}
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                  <Link
                                    href={`/repos/${project._id}`}
                                    className="text-lg font-semibold hover:text-primary transition-colors line-clamp-1 block"
                                  >
                                    {project.name}
                                  </Link>
                                </div>
                                <div className="flex gap-1.5 flex-shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      window.open(project.githubUrl || project.github_url, '_blank');
                                    }}
                                    title="View on GitHub"
                                  >
                                    <Github className="w-4 h-4" />
                                  </Button>
                                  <Link href={`/repos/${project._id}`}>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      className="h-8 w-8"
                                      title="View Repository Details"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </Button>
                                  </Link>
                                </div>
                              </div>

                              {/* Description */}
                              <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                                {project.description || "No description provided"}
                              </p>

                              {/* Stats & Info */}
                              <div className="flex flex-wrap items-center gap-3 text-sm">
                                <Badge 
                                  variant="secondary" 
                                  className="font-medium"
                                >
                                  {project.language}
                                </Badge>
                                
                                <div className="flex items-center gap-1 text-muted-foreground" title="Stars">
                                  <Star className="w-3.5 h-3.5" />
                                  {project.stars.toLocaleString()}
                                </div>
                                
                                <div className="flex items-center gap-1 text-muted-foreground" title="Forks">
                                  <GitFork className="w-3.5 h-3.5" />
                                  {project.forks.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-card rounded-xl shadow-sm overflow-hidden border border-muted/40 h-full">
                  <div className="p-4 sm:p-6">
                    <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2">
                      <Github className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                      Published Projects
                    </h2>
                    <div className="text-center py-8 bg-muted/5 rounded-lg border border-dashed border-muted/20">
                      <h3 className="text-base font-medium mb-2">No published projects</h3>
                      <p className="text-sm text-muted-foreground">This user hasn't published any projects yet.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Published Tools */}
            <div>
              {userTools.length > 0 ? (
                <div className="bg-card rounded-xl shadow-sm overflow-hidden border border-muted/40 h-full">
                  <div className="p-4 sm:p-6">
                    <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2">
                      <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                      Published Tools
                    </h2>
                    <div className="space-y-4">
                      {userTools.map((tool) => (
                        <Link key={tool._id} href={`/store/${tool._id}`}>
                          <Card className="group hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                            <CardContent className="p-4">
                              <div className="flex flex-col gap-2">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-start gap-4">
                                    {/* Logo */}
                                    <div className="relative w-14 h-14">
                                      <img
                                        src={tool.thumbnail}
                                        alt={tool.name}
                                        className="w-full h-full rounded-[18px] object-cover shadow-sm group-hover:shadow-md transition-all duration-300"
                                      />
                                    </div>

                                    {/* Content */}
                                    <div>
                                      <h3 className="text-lg font-semibold group-hover:text-primary transition-colors truncate">
                                        {tool.name}
                                      </h3>
                                      <Badge variant="secondary" className="mt-1 text-xs">
                                        {tool.category}
                                      </Badge>
                                    </div>
                                  </div>

                                  {/* Visit Button */}
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        window.open(tool.url, '_blank');
                                      }}
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </Button>
                                    {tool.github_url && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          window.open(tool.github_url, '_blank');
                                        }}
                                      >
                                        <Github className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                {/* Description */}
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {tool.description}
                                </p>

                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  {tool.tags.map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground ml-auto">
                                    <Eye className="w-4 h-4" />
                                    {tool.views}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-card rounded-xl shadow-sm overflow-hidden border border-muted/40 h-full">
                  <div className="p-4 sm:p-6">
                    <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2">
                      <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                      Published Tools
                    </h2>
                    <div className="text-center py-8 bg-muted/5 rounded-lg border border-dashed border-muted/20">
                      <h3 className="text-base font-medium mb-2">No published tools</h3>
                      <p className="text-sm text-muted-foreground">This user hasn't published any tools yet.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* GitHub Repositories */}
          {githubRepos.length > 0 && (
            <div className="bg-card rounded-xl shadow-sm overflow-hidden border border-muted/40">
              <div className="p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2">
                  <Github className="w-5 h-5 sm:w-6 sm:h-6" />
                  GitHub Repositories
                </h2>
                <GitHubRepos 
                  repos={githubRepos} 
                  username={user?.github || user?.github_username || ''} 
                  limit={6}
                  showViewAll={true}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
} 