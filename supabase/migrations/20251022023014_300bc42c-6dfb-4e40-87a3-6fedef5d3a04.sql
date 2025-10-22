-- Add star system and monetization to storylines
ALTER TABLE user_storylines
ADD COLUMN IF NOT EXISTS star_price integer DEFAULT 0 CHECK (star_price >= 0 AND star_price <= 5),
ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
ADD COLUMN IF NOT EXISTS caption text,
ADD COLUMN IF NOT EXISTS suspended_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS suspension_reason text;

-- Create story views table
CREATE TABLE IF NOT EXISTS story_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES user_storylines(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at timestamp with time zone DEFAULT now(),
  stars_spent integer DEFAULT 0,
  UNIQUE(story_id, viewer_id)
);

ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own story views" ON story_views
FOR SELECT USING (viewer_id = auth.uid() OR EXISTS (
  SELECT 1 FROM user_storylines WHERE id = story_views.story_id AND user_id = auth.uid()
));

CREATE POLICY "Users can create story views" ON story_views
FOR INSERT WITH CHECK (viewer_id = auth.uid());

-- Create story transactions table for star payments
CREATE TABLE IF NOT EXISTS story_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES user_storylines(id) ON DELETE CASCADE,
  uploader_id uuid REFERENCES auth.users(id),
  viewer_id uuid REFERENCES auth.users(id),
  stars_spent integer NOT NULL,
  uploader_earn numeric NOT NULL,
  viewer_earn numeric NOT NULL,
  platform_earn numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE story_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON story_transactions
FOR SELECT USING (uploader_id = auth.uid() OR viewer_id = auth.uid());

-- Add star balance and post limit to user profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS star_balance integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS post_count_free integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS suspension_reason text,
ADD COLUMN IF NOT EXISTS suspended_at timestamp with time zone;

-- Create payment requests table
CREATE TABLE IF NOT EXISTS payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  currency_symbol text DEFAULT '₦',
  payment_method text NOT NULL,
  account_info jsonb NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'rejected')),
  created_at timestamp with time zone DEFAULT now(),
  countdown_end timestamp with time zone DEFAULT (now() + interval '72 hours'),
  processed_at timestamp with time zone,
  admin_notes text
);

ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create payment requests" ON payment_requests
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own payment requests" ON payment_requests
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage payment requests" ON payment_requests
FOR ALL USING (true);

-- Add post management fields
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS disabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS requires_approval boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_action text;

-- Create user reports table
CREATE TABLE IF NOT EXISTS user_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  admin_action text,
  admin_notes text,
  created_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone
);

ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create user reports" ON user_reports
FOR INSERT WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can view own reports" ON user_reports
FOR SELECT USING (reporter_id = auth.uid());

CREATE POLICY "Admins can manage user reports" ON user_reports
FOR ALL USING (true);

-- Create admin messages table
CREATE TABLE IF NOT EXISTS admin_user_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_from_admin boolean DEFAULT true,
  reaction text,
  created_at timestamp with time zone DEFAULT now(),
  read_at timestamp with time zone
);

ALTER TABLE admin_user_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own admin messages" ON admin_user_messages
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update reactions" ON admin_user_messages
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage messages" ON admin_user_messages
FOR ALL USING (true);

-- Create review requests table
CREATE TABLE IF NOT EXISTS review_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id uuid REFERENCES user_storylines(id) ON DELETE CASCADE,
  request_type text NOT NULL CHECK (request_type IN ('story_suspension', 'account_suspension')),
  message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone,
  admin_notes text
);

ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create review requests" ON review_requests
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own requests" ON review_requests
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage requests" ON review_requests
FOR ALL USING (true);

-- Function to process story view and star payment
CREATE OR REPLACE FUNCTION process_story_view(
  p_story_id uuid,
  p_viewer_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_star_price integer;
  v_uploader_id uuid;
  v_viewer_balance integer;
  v_uploader_earn numeric;
  v_viewer_earn numeric;
  v_platform_earn numeric;
  v_star_value numeric := 500; -- ₦500 per star
BEGIN
  -- Get story details
  SELECT star_price, user_id INTO v_star_price, v_uploader_id
  FROM user_storylines
  WHERE id = p_story_id AND status = 'active';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Story not found');
  END IF;

  -- Check if already viewed
  IF EXISTS (SELECT 1 FROM story_views WHERE story_id = p_story_id AND viewer_id = p_viewer_id) THEN
    RETURN jsonb_build_object('success', true, 'already_viewed', true);
  END IF;

  -- If free story (0 stars)
  IF v_star_price = 0 THEN
    INSERT INTO story_views (story_id, viewer_id, stars_spent)
    VALUES (p_story_id, p_viewer_id, 0);
    
    UPDATE user_storylines SET view_count = view_count + 1 WHERE id = p_story_id;
    
    RETURN jsonb_build_object('success', true, 'free', true);
  END IF;

  -- Check viewer balance
  SELECT star_balance INTO v_viewer_balance
  FROM user_profiles WHERE id = p_viewer_id;

  IF v_viewer_balance < v_star_price THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient stars');
  END IF;

  -- Calculate earnings (star_value is ₦500 per star)
  v_uploader_earn := (v_star_price * v_star_value * 0.60); -- 60%
  v_viewer_earn := (v_star_price * v_star_value * 0.20);   -- 20%
  v_platform_earn := (v_star_price * v_star_value * 0.20); -- 20%

  -- Deduct stars from viewer
  UPDATE user_profiles
  SET star_balance = star_balance - v_star_price
  WHERE id = p_viewer_id;

  -- Add earnings to uploader wallet
  UPDATE user_profiles
  SET wallet_balance = COALESCE(wallet_balance, 0) + v_uploader_earn
  WHERE id = v_uploader_id;

  -- Add cashback to viewer wallet
  UPDATE user_profiles
  SET wallet_balance = COALESCE(wallet_balance, 0) + v_viewer_earn
  WHERE id = p_viewer_id;

  -- Record view
  INSERT INTO story_views (story_id, viewer_id, stars_spent)
  VALUES (p_story_id, p_viewer_id, v_star_price);

  -- Record transaction
  INSERT INTO story_transactions (story_id, uploader_id, viewer_id, stars_spent, uploader_earn, viewer_earn, platform_earn)
  VALUES (p_story_id, v_uploader_id, p_viewer_id, v_star_price, v_uploader_earn, v_viewer_earn, v_platform_earn);

  -- Update view count
  UPDATE user_storylines SET view_count = view_count + 1 WHERE id = p_story_id;

  -- Notify uploader
  INSERT INTO user_notifications (user_id, title, message, type, notification_category, action_data)
  VALUES (
    v_uploader_id,
    'Story View Earned! ⭐',
    format('You earned ₦%s from your story! %s stars spent.', v_uploader_earn, v_star_price),
    'success',
    'story_earn',
    jsonb_build_object('story_id', p_story_id, 'viewer_id', p_viewer_id, 'amount', v_uploader_earn, 'stars', v_star_price)
  );

  -- Notify viewer
  INSERT INTO user_notifications (user_id, title, message, type, notification_category, action_data)
  VALUES (
    p_viewer_id,
    'Story Cashback! 💰',
    format('You earned ₦%s cashback from viewing this story!', v_viewer_earn),
    'success',
    'story_cashback',
    jsonb_build_object('story_id', p_story_id, 'amount', v_viewer_earn)
  );

  RETURN jsonb_build_object('success', true, 'uploader_earn', v_uploader_earn, 'viewer_earn', v_viewer_earn);
END;
$$;