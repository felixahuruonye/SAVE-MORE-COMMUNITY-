import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Ban, CheckCircle, MessageSquare, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

export const StoryManagement = () => {
  const [stories, setStories] = useState<any[]>([]);
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadStories();
    setupRealtimeSubscription();
  }, []);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('admin-stories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_storylines' }, loadStories)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  };

  const loadStories = async () => {
    const { data } = await supabase
      .from('user_storylines')
      .select(`
        *,
        user_profiles (username, avatar_url)
      `)
      .order('created_at', { ascending: false });

    setStories(data || []);
  };

  const handleSuspend = async (storyId: string, username: string) => {
    const { error } = await supabase
      .from('user_storylines')
      .update({ 
        status: 'suspended',
        suspended_at: new Date().toISOString(),
        suspension_reason: 'Violated community guidelines'
      })
      .eq('id', storyId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    // Notify user
    const story = stories.find(s => s.id === storyId);
    await supabase.from('user_notifications').insert({
      user_id: story.user_id,
      title: 'Story Suspended',
      message: 'Your story has been removed from the platform for violating community guidelines. You can request a review.',
      type: 'error',
      notification_category: 'story_suspension',
      action_data: { story_id: storyId }
    });

    toast({ title: 'Success', description: 'Story suspended and user notified' });
    loadStories();
  };

  const handleUnsuspend = async (storyId: string) => {
    const { error } = await supabase
      .from('user_storylines')
      .update({ 
        status: 'active',
        suspended_at: null,
        suspension_reason: null
      })
      .eq('id', storyId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Success', description: 'Story restored' });
    loadStories();
  };

  const handleSendMessage = async () => {
    if (!selectedStory || !message.trim()) return;

    const { error } = await supabase.from('admin_user_messages').insert({
      user_id: selectedStory.user_id,
      message: message.trim(),
      is_from_admin: true
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    // Also add to notifications
    await supabase.from('user_notifications').insert({
      user_id: selectedStory.user_id,
      title: 'Message from Admin',
      message: message.trim(),
      type: 'info',
      notification_category: 'admin_message'
    });

    toast({ title: 'Success', description: 'Message sent' });
    setMessage('');
    setMessageOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Story Management ({stories.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Preview</TableHead>
                <TableHead>Stars</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stories.map((story) => (
                <TableRow key={story.id}>
                  <TableCell>{story.user_profiles?.username}</TableCell>
                  <TableCell>
                    <img 
                      src={story.preview_url || story.media_url} 
                      alt="Preview" 
                      className="w-16 h-16 object-cover rounded"
                    />
                  </TableCell>
                  <TableCell>
                    {story.star_price > 0 ? (
                      <Badge variant="secondary">
                        {story.star_price}<Star className="h-3 w-3 ml-1 inline" />
                      </Badge>
                    ) : (
                      <Badge variant="outline">Free</Badge>
                    )}
                  </TableCell>
                  <TableCell>{story.view_count || 0}</TableCell>
                  <TableCell>
                    <Badge variant={story.status === 'active' ? 'default' : 'destructive'}>
                      {story.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(story.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedStory(story);
                          setPreviewOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {story.status === 'active' ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleSuspend(story.id, story.user_profiles?.username)}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleUnsuspend(story.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setSelectedStory(story);
                          setMessageOpen(true);
                        }}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Story Preview</DialogTitle>
          </DialogHeader>
          {selectedStory && (
            <div className="space-y-4">
              {selectedStory.media_type === 'video' ? (
                <video src={selectedStory.media_url} controls className="w-full rounded-lg" />
              ) : (
                <img src={selectedStory.media_url} alt="Story" className="w-full rounded-lg" />
              )}
              {selectedStory.caption && (
                <p className="text-sm">{selectedStory.caption}</p>
              )}
              {selectedStory.music_url && (
                <audio src={selectedStory.music_url} controls className="w-full" />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message to {selectedStory?.user_profiles?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              rows={4}
            />
            <Button onClick={handleSendMessage} className="w-full">
              Send Message
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
