import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share, MoreHorizontal, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CreatePost from '@/components/Posts/CreatePost';
import ProfileSetup from '@/components/Profile/ProfileSetup';

interface Post {
  id: string;
  title: string;
  body: string;
  media_urls: string[];
  category: string;
  created_at: string;
  status: string;
  boosted: boolean;
  boost_until: string | null;
  comments_count: number;
  likes_count: number;
  view_count: number;
  rating: number;
  user_id: string;
}

interface UserProfile {
  id: string;
  username: string;
  avatar_url: string;
  vip: boolean;
}

interface PostLike {
  id: string;
  user_id: string;
  post_id: string;
}

const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<{ [key: string]: UserProfile }>({});
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [postLikes, setPostLikes] = useState<{ [key: string]: PostLike[] }>({});
  const [loading, setLoading] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      checkUserProfile();
    }
  }, [user]);

  useEffect(() => {
    if (userProfile) {
      fetchPosts();
      setupRealtimeSubscription();
    }
  }, [userProfile]);

  const checkUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist
        setNeedsProfileSetup(true);
        setLoading(false);
        return;
      }
      
      if (error) throw error;
      setUserProfile(data);
      setNeedsProfileSetup(false);
    } catch (error) {
      console.error('Error checking profile:', error);
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      // Fetch posts with ratings and boosted posts first
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'approved')
        .order('boosted', { ascending: false })
        .order('rating', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (postsError) throw postsError;

      if (postsData && postsData.length > 0) {
        // Get unique user IDs
        const userIds = [...new Set(postsData.map(post => post.user_id))];
        
        // Fetch user profiles
        const { data: usersData, error: usersError } = await supabase
          .from('user_profiles')
          .select('id, username, avatar_url, vip')
          .in('id', userIds);

        if (usersError) throw usersError;

        // Create users lookup
        const usersLookup: { [key: string]: UserProfile } = {};
        usersData?.forEach(user => {
          usersLookup[user.id] = user;
        });

        // Fetch post likes
        const { data: likesData, error: likesError } = await supabase
          .from('post_likes')
          .select('*')
          .in('post_id', postsData.map(p => p.id));

        if (likesError) throw likesError;

        // Group likes by post_id
        const likesLookup: { [key: string]: PostLike[] } = {};
        likesData?.forEach(like => {
          if (!likesLookup[like.post_id]) {
            likesLookup[like.post_id] = [];
          }
          likesLookup[like.post_id].push(like);
        });

        setPosts(postsData);
        setUsers(usersLookup);
        setPostLikes(likesLookup);
      } else {
        setPosts([]);
        setUsers({});
        setPostLikes({});
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to load posts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('posts-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter: 'status=eq.approved'
        },
        () => {
          fetchPosts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'post_likes'
        },
        (payload) => {
          setPostLikes(prev => {
            const updated = { ...prev };
            const postId = payload.new.post_id;
            if (!updated[postId]) {
              updated[postId] = [];
            }
            updated[postId].push(payload.new as PostLike);
            return updated;
          });
          
          // Update likes count on the post
          setPosts(prev => prev.map(post => 
            post.id === payload.new.post_id 
              ? { ...post, likes_count: post.likes_count + 1 }
              : post
          ));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'post_likes'
        },
        (payload) => {
          setPostLikes(prev => {
            const updated = { ...prev };
            const postId = payload.old.post_id;
            if (updated[postId]) {
              updated[postId] = updated[postId].filter(like => like.id !== payload.old.id);
            }
            return updated;
          });
          
          // Update likes count on the post
          setPosts(prev => prev.map(post => 
            post.id === payload.old.post_id 
              ? { ...post, likes_count: Math.max(0, post.likes_count - 1) }
              : post
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleLike = async (postId: string) => {
    if (!user) return;

    const postLikesList = postLikes[postId] || [];
    const existingLike = postLikesList.find(like => like.user_id === user.id);

    try {
      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('id', existingLike.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive"
      });
    }
  };

  const isPostLiked = (postId: string): boolean => {
    if (!user) return false;
    const postLikesList = postLikes[postId] || [];
    return postLikesList.some(like => like.user_id === user.id);
  };

  const getUsernamesWhoLiked = (postId: string): string[] => {
    const postLikesList = postLikes[postId] || [];
    return postLikesList.map(like => users[like.user_id]?.username || 'Unknown').filter(Boolean);
  };

  if (needsProfileSetup) {
    return <ProfileSetup onComplete={() => {
      setNeedsProfileSetup(false);
      checkUserProfile();
    }} />;
  }

  if (loading) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-muted rounded-full"></div>
                  <div className="h-4 bg-muted rounded w-24"></div>
                </div>
                <div className="h-6 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary">SaveMore Community</h1>
          <p className="text-muted-foreground">Share your food experiences</p>
        </div>
        <CreatePost onPostCreated={fetchPosts} />
      </div>

      {/* View Last Posts Banner */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardContent className="p-4 text-center">
          <p className="text-sm font-medium">See posts you may have missed</p>
          <Button variant="outline" size="sm" className="mt-2">
            VIEW LAST POSTS
          </Button>
        </CardContent>
      </Card>

      {/* Posts */}
      <div className="space-y-4">
        {posts.map((post) => {
          const postUser = users[post.user_id];
          const likedUsernames = getUsernamesWhoLiked(post.id);
          const currentUserLiked = isPostLiked(post.id);
          
          return (
            <Card key={post.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={postUser?.avatar_url} />
                      <AvatarFallback>
                        {postUser?.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{postUser?.username || 'Anonymous'}</span>
                        {postUser?.vip && (
                          <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                            <Star className="w-3 h-3 mr-1" />
                            VIP
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {post.boosted && (
                      <Badge variant="outline" className="text-xs">Boosted</Badge>
                    )}
                    {post.rating > 0 && (
                      <Badge variant="outline" className="text-xs">★ {post.rating}</Badge>
                    )}
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{post.title}</h3>
                  <Badge variant="outline" className="text-xs">{post.category}</Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-sm mb-4 whitespace-pre-line">{post.body}</p>
                
                {/* Media */}
                {post.media_urls && post.media_urls.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {post.media_urls.map((url, index) => (
                      <div key={index}>
                        {url.includes('video') ? (
                          <video 
                            src={url}
                            controls
                            autoPlay
                            muted
                            className="w-full rounded-lg max-h-96 object-cover"
                          />
                        ) : (
                          <img 
                            src={url} 
                            alt={`Post media ${index + 1}`}
                            className="w-full rounded-lg max-h-96 object-cover"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Reactions and Actions */}
                <div className="pt-4 border-t space-y-3">
                  {/* Like usernames */}
                  {likedUsernames.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Liked by {likedUsernames.slice(0, 3).join(', ')}
                      {likedUsernames.length > 3 && ` and ${likedUsernames.length - 3} others`}
                    </div>
                  )}
                  
                  {/* Action buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`p-0 ${currentUserLiked ? 'text-red-500' : ''}`}
                        onClick={() => handleLike(post.id)}
                      >
                        <Heart className={`w-4 h-4 mr-1 ${currentUserLiked ? 'fill-current' : ''}`} />
                        <span className="text-xs">{post.likes_count}</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="p-0">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        <span className="text-xs">{post.comments_count}</span>
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" className="p-0">
                      <Share className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No posts yet. Be the first to share!</p>
        </div>
      )}
    </div>
  );
};

export default Feed;

  if (loading) {
    return (
      <div className="p-4">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-muted rounded-full"></div>
                  <div className="h-4 bg-muted rounded w-24"></div>
                </div>
                <div className="h-6 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary mb-4">SaveMore Community</h1>
        <Button className="w-full" size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Create Post
        </Button>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback>
                      U
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">User</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {post.boosted && (
                  <Badge variant="outline" className="text-xs">Boosted</Badge>
                )}
              </div>
              <div>
                <h3 className="font-semibold mb-2">{post.title}</h3>
                <Badge variant="outline" className="text-xs">{post.category}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">{post.body}</p>
              
              {/* Media */}
              {post.media_urls && post.media_urls.length > 0 && (
                <div className="mb-4">
                  <img 
                    src={post.media_urls[0]} 
                    alt="Post media"
                    className="w-full rounded-lg object-cover max-h-64"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" size="sm" className="p-0">
                    <Heart className="w-4 h-4 mr-1" />
                    <span className="text-xs">{post.likes_count}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="p-0">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    <span className="text-xs">{post.comments_count}</span>
                  </Button>
                </div>
                <Button variant="ghost" size="sm" className="p-0">
                  <Share className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No posts yet. Be the first to share!</p>
        </div>
      )}
    </div>
  );
};

export default Feed;