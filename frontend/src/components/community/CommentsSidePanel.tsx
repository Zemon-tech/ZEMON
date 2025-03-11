import { useState, useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { X, Loader2, ThumbsUp, Reply, MoreVertical, CornerDownRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";

interface Comment {
  _id: string;
  userId: string;
  username: string;
  avatar: string;
  text: string;
  createdAt: string;
  likes?: number;
  isLiked?: boolean;
  replyTo?: {
    username: string;
    commentId: string;
  };
}

interface CommentsSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  ideaId: string;
  ideaTitle: string;
  comments: Comment[];
  onRefresh?: () => void;
}

export default function CommentsSidePanel({
  isOpen,
  onClose,
  ideaId,
  ideaTitle,
  comments: initialComments,
  onRefresh
}: CommentsSidePanelProps) {
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [localComments, setLocalComments] = useState<Comment[]>(initialComments);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const commentsContainerRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Scroll to bottom when new comments are added
  useEffect(() => {
    if (commentsContainerRef.current && !replyingTo) {
      commentsContainerRef.current.scrollTop = commentsContainerRef.current.scrollHeight;
    }
  }, [localComments, replyingTo]);

  useEffect(() => {
    setLocalComments(initialComments);
  }, [initialComments]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(tokenData.id);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'n' && e.metaKey) {
        e.preventDefault();
        commentInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onClose]);

  const handleAddComment = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to add a comment.",
        variant: "destructive",
      });
      router.push('/auth/login');
      return;
    }

    if (!newComment.trim()) return;

    try {
      setIsSubmittingComment(true);
      const response = await axios.post(
        `${API_BASE_URL}/api/community/ideas/${ideaId}/comments`,
        { 
          text: newComment,
          replyTo: replyingTo ? {
            commentId: replyingTo,
            username: localComments.find(c => c._id === replyingTo)?.username
          } : undefined
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      if (response.data.success) {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        const newCommentObj: Comment = {
          _id: response.data.data._id || Date.now().toString(),
          userId: tokenData.id,
          username: tokenData.name,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(tokenData.name)}&background=random`,
          text: newComment,
          createdAt: new Date().toISOString(),
          likes: 0,
          isLiked: false,
          replyTo: replyingTo ? {
            commentId: replyingTo,
            username: localComments.find(c => c._id === replyingTo)?.username || ''
          } : undefined
        };

        setLocalComments(prev => [...prev, newCommentObj]);
        setNewComment("");
        setReplyingTo(null);
        onRefresh?.();

        toast({
          title: "Success",
          description: "Comment added successfully",
        });
      }
    } catch (error: unknown) {
      console.error('Error adding comment:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        switch (error.response.status) {
          case 401:
            localStorage.removeItem('token');
            toast({
              title: "Session Expired",
              description: "Please log in again to continue.",
              variant: "destructive",
            });
            router.push('/auth/login');
            break;
          case 404:
            toast({
              title: "Error",
              description: "The idea was not found.",
              variant: "destructive",
            });
            break;
          default:
            toast({
              title: "Error",
              description: error.response.data?.message || "Failed to add comment",
              variant: "destructive",
            });
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to connect to server",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!currentUserId) {
      toast({
        title: "Authentication Required",
        description: "Please log in to like comments.",
        variant: "destructive",
      });
      return;
    }

    setLocalComments(prev => prev.map(comment => 
      comment._id === commentId
        ? { 
            ...comment, 
            likes: (comment.likes || 0) + (comment.isLiked ? -1 : 1),
            isLiked: !comment.isLiked
          }
        : comment
    ));
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed top-[64px] right-0 bottom-0 w-96 bg-background border-l shadow-lg z-50 overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="p-6 border-b bg-card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">{ideaTitle}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 -mr-2 hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Comments ({localComments.length})</p>
          <p className="text-xs text-muted-foreground">Press ⌘N to comment</p>
        </div>
      </div>

      {/* Comments List */}
      <div ref={commentsContainerRef} className="flex-1 overflow-y-auto scroll-smooth" id="comments-container">
        <AnimatePresence>
          {localComments.length > 0 ? (
            <div className="divide-y">
              {localComments.map((comment) => (
                <motion.div
                  key={comment._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`p-4 hover:bg-muted/50 transition-colors ${comment.replyTo ? 'pl-12 relative before:absolute before:left-6 before:top-0 before:bottom-0 before:w-px before:bg-muted' : ''}`}
                >
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.avatar} alt={comment.username} />
                      <AvatarFallback>
                        {comment.username ? comment.username[0].toUpperCase() : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {comment.username || 'Unknown User'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                      {comment.replyTo && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <CornerDownRight className="h-3 w-3" />
                          Replying to <span className="font-medium">@{comment.replyTo.username}</span>
                        </div>
                      )}
                      <p className="text-sm text-foreground">{comment.text}</p>
                      <div className="flex items-center gap-4 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-muted-foreground hover:text-primary"
                          onClick={() => handleLikeComment(comment._id)}
                        >
                          <ThumbsUp className={`h-4 w-4 mr-1 ${comment.isLiked ? 'fill-current text-primary' : ''}`} />
                          {comment.likes || 0}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-muted-foreground hover:text-primary"
                          onClick={() => {
                            setReplyingTo(comment._id);
                            commentInputRef.current?.focus();
                          }}
                        >
                          <Reply className="h-4 w-4 mr-1" />
                          Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center h-full text-muted-foreground"
            >
              No comments yet. Be the first to comment!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Comment Input */}
      <div className="p-4 border-t bg-card">
        {currentUserId ? (
          <div className="space-y-2">
            {replyingTo && (
              <div className="flex items-center justify-between px-3 py-1 bg-muted rounded-md">
                <p className="text-xs text-muted-foreground">
                  Replying to @{localComments.find(c => c._id === replyingTo)?.username}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setReplyingTo(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                ref={commentInputRef}
                placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
                className="flex-1"
              />
              <Button 
                onClick={handleAddComment}
                disabled={isSubmittingComment || !newComment.trim()}
                className="shrink-0"
              >
                {isSubmittingComment ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Post'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Sign in to add a comment</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/auth/login')}
            >
              Sign in
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
} 