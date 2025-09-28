import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Users, MessageCircle, Phone, Video, Mic, Smile, Paperclip } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  channel: string;
  from_user_id: string;
  body: string;
  media_url?: string;
  created_at: string;
  user_profiles?: {
    username: string;
    avatar_url: string;
    vip: boolean;
    is_online: boolean;
  };
}

interface OnlineUser {
  id: string;
  username: string;
  avatar_url: string;
  vip: boolean;
  is_online: boolean;
  last_seen: string;
}

const Chat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeChannel, setActiveChannel] = useState('global');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchMessages();
      fetchOnlineUsers();
      setupRealtimeSubscription();
      updateUserOnlineStatus(true);
    }

    return () => {
      if (user) {
        updateUserOnlineStatus(false);
      }
    };
  }, [user, activeChannel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      // First get messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('channel', activeChannel)
        .is('to_user_id', null) // Only public messages for global chat
        .order('created_at', { ascending: true })
        .limit(100);

      if (messagesError) throw messagesError;

      if (messagesData && messagesData.length > 0) {
        // Get unique user IDs
        const userIds = [...new Set(messagesData.map(msg => msg.from_user_id))];
        
        // Fetch user profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, username, avatar_url, vip, is_online')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        // Create profiles lookup
        const profilesLookup: { [key: string]: any } = {};
        profilesData?.forEach(profile => {
          profilesLookup[profile.id] = profile;
        });

        // Merge messages with profiles
        const messagesWithProfiles = messagesData.map(msg => ({
          ...msg,
          user_profiles: profilesLookup[msg.from_user_id] || {
            username: 'Unknown',
            avatar_url: '',
            vip: false,
            is_online: false
          }
        }));

        setMessages(messagesWithProfiles);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOnlineUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, username, avatar_url, vip, is_online, last_seen')
        .eq('is_online', true)
        .order('username');

      if (error) throw error;
      setOnlineUsers(data || []);
    } catch (error) {
      console.error('Error fetching online users:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel=eq.${activeChannel}`
        },
        async (payload) => {
          // Fetch user profile for new message
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('username, avatar_url, vip, is_online')
            .eq('id', payload.new.from_user_id)
            .single();

          setMessages(prev => [...prev, {
            ...payload.new,
            user_profiles: profileData || {
              username: 'Unknown',
              avatar_url: '',
              vip: false,
              is_online: false
            }
          } as Message]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_profiles'
        },
        () => {
          fetchOnlineUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const updateUserOnlineStatus = async (isOnline: boolean) => {
    if (!user) return;

    await supabase
      .from('user_profiles')
      .update({
        is_online: isOnline,
        last_seen: new Date().toISOString()
      })
      .eq('id', user.id);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          channel: activeChannel,
          from_user_id: user.id,
          body: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const startPrivateChat = (userId: string) => {
    // Implement private chat functionality
    console.log('Start private chat with:', userId);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-card border-b p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">SaveMore Chat</h1>
          <Badge variant="outline">
            <Users className="w-3 h-3 mr-1" />
            {onlineUsers.length} online
          </Badge>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Online Users Sidebar */}
        <div className="w-64 bg-card border-r p-4 hidden md:block">
          <h3 className="font-semibold mb-4">Active Users</h3>
          <div className="space-y-2">
            {onlineUsers.map((onlineUser) => (
              <div
                key={onlineUser.id}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent cursor-pointer"
                onClick={() => startPrivateChat(onlineUser.id)}
              >
                <div className="relative">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={onlineUser.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {onlineUser.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1">
                    <p className="text-sm font-medium truncate">{onlineUser.username}</p>
                    {onlineUser.vip && (
                      <Badge variant="secondary" className="text-xs px-1">VIP</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : messages.length > 0 ? (
              messages.map((message) => (
                <div key={message.id} className="flex space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={message.user_profiles?.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {message.user_profiles?.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-semibold">
                        {message.user_profiles?.username || 'Unknown'}
                      </span>
                      {message.user_profiles?.vip && (
                        <Badge variant="secondary" className="text-xs px-1">VIP</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                    <p className="text-sm">{message.body}</p>
                    {message.media_url && (
                      <img 
                        src={message.media_url} 
                        alt="Shared media"
                        className="mt-2 max-w-sm rounded-lg"
                      />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t">
            <form onSubmit={sendMessage} className="flex space-x-2">
              <div className="flex-1 flex">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 mr-2"
                  maxLength={500}
                />
                <div className="flex space-x-1">
                  <Button type="button" variant="ghost" size="sm">
                    <Smile className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm">
                    <Mic className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <Button type="submit" disabled={!newMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-1">
              {newMessage.length}/500 characters
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;