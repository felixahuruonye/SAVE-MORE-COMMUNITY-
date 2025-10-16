-- Create hidden_posts table to support per-user feed hiding
CREATE TABLE IF NOT EXISTS public.hidden_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  post_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT hidden_posts_user_post_unique UNIQUE (user_id, post_id)
);

-- Enable RLS
ALTER TABLE public.hidden_posts ENABLE ROW LEVEL SECURITY;

-- Policies for hidden_posts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'hidden_posts' AND policyname = 'Users can insert own hidden posts'
  ) THEN
    CREATE POLICY "Users can insert own hidden posts"
    ON public.hidden_posts
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'hidden_posts' AND policyname = 'Users can view own hidden posts'
  ) THEN
    CREATE POLICY "Users can view own hidden posts"
    ON public.hidden_posts
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'hidden_posts' AND policyname = 'Users can delete own hidden posts'
  ) THEN
    CREATE POLICY "Users can delete own hidden posts"
    ON public.hidden_posts
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_hidden_posts_user ON public.hidden_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_hidden_posts_post ON public.hidden_posts(post_id);

-- Relax post_reports RLS to allow admin UI operations
-- Allow all authenticated users to view reports (temporary until admin role is implemented)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'post_reports' AND policyname = 'Authenticated can view all reports'
  ) THEN
    CREATE POLICY "Authenticated can view all reports"
    ON public.post_reports
    FOR SELECT
    TO authenticated
    USING (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'post_reports' AND policyname = 'Authenticated can resolve reports'
  ) THEN
    CREATE POLICY "Authenticated can resolve reports"
    ON public.post_reports
    FOR UPDATE
    TO authenticated
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (true);
  END IF;
END $$;

-- Ensure realtime works by adding tables to supabase_realtime publication and setting replica identity
ALTER TABLE public.post_reports REPLICA IDENTITY FULL;
ALTER TABLE public.hidden_posts REPLICA IDENTITY FULL;
ALTER TABLE public.post_comments REPLICA IDENTITY FULL;
ALTER TABLE public.posts REPLICA IDENTITY FULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'post_reports'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.post_reports;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'hidden_posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.hidden_posts;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'post_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
  END IF;
END $$;
