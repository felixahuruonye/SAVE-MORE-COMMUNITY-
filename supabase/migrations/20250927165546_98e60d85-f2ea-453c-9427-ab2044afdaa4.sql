-- Create user_profiles table to extend auth.users
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  vip BOOLEAN DEFAULT false,
  vip_started_at TIMESTAMP WITH TIME ZONE,
  vip_expires_at TIMESTAMP WITH TIME ZONE,
  device_id TEXT,
  wallet_balance DECIMAL(10,2) DEFAULT 0,
  star_balance INTEGER DEFAULT 0,
  analytics_last_seen TIMESTAMP WITH TIME ZONE,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create groups table for community groups
CREATE TABLE public.groups (
  id TEXT PRIMARY KEY DEFAULT ('group-' || to_char(now(), 'YYYYMMDDHH24MISS') || '-' || upper(substring(gen_random_uuid()::text, 1, 4))),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_type TEXT NOT NULL DEFAULT 'public' CHECK (group_type IN ('public', 'private')),
  avatar_url TEXT,
  member_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_suspended BOOLEAN DEFAULT false
);

-- Create group_members table
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id TEXT NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'banned')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create likes table for post reactions
CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create post_shares table for tracking shares
CREATE TABLE public.post_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_type TEXT NOT NULL CHECK (share_type IN ('repost', 'group_share', 'external')),
  target_group_id TEXT REFERENCES public.groups(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'share', 'follow', 'group_invite', 'payment', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add rating system to posts
ALTER TABLE public.posts ADD COLUMN rating INTEGER DEFAULT 0 CHECK (rating >= 0 AND rating <= 10);
ALTER TABLE public.posts ADD COLUMN view_count INTEGER DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view all profiles" ON public.user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (id = auth.uid());

-- RLS Policies for groups
CREATE POLICY "Users can view non-suspended groups" ON public.groups
  FOR SELECT USING (NOT is_suspended);

CREATE POLICY "Users can create groups" ON public.groups
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Group owners can update their groups" ON public.groups
  FOR UPDATE USING (owner_id = auth.uid());

-- RLS Policies for group_members
CREATE POLICY "Users can view group members" ON public.group_members
  FOR SELECT USING (true);

CREATE POLICY "Users can join groups" ON public.group_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage their group membership" ON public.group_members
  FOR UPDATE USING (user_id = auth.uid() OR 
    EXISTS(SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid()));

-- RLS Policies for post_likes
CREATE POLICY "Users can view post likes" ON public.post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like posts" ON public.post_likes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unlike their own likes" ON public.post_likes
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for post_shares
CREATE POLICY "Users can view post shares" ON public.post_shares
  FOR SELECT USING (true);

CREATE POLICY "Users can share posts" ON public.post_shares
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('user-avatars', 'user-avatars', true),
  ('post-media', 'post-media', true),
  ('group-avatars', 'group-avatars', true),
  ('chat-media', 'chat-media', false);

-- Storage policies for user avatars
CREATE POLICY "Users can view avatar images" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can upload their own avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatars" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'user-avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for post media
CREATE POLICY "Users can view post media" ON storage.objects
  FOR SELECT USING (bucket_id = 'post-media');

CREATE POLICY "Users can upload post media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'post-media' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for group avatars
CREATE POLICY "Users can view group avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'group-avatars');

CREATE POLICY "Group owners can upload group avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'group-avatars');

-- Storage policies for chat media
CREATE POLICY "Users can view their chat media" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'chat-media' AND 
    (auth.uid()::text = (storage.foldername(name))[1] OR 
     auth.uid()::text = (storage.foldername(name))[2])
  );

CREATE POLICY "Users can upload chat media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-media' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.groups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();