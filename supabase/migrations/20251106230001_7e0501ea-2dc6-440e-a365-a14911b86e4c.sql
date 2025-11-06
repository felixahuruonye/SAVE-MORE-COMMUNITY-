-- Align earnings with NGN conversion (₦500 per star) and ensure wallet_history records NGN amounts
-- Update process_post_view and process_story_view to use star_value conversion

-- Update: process_post_view
CREATE OR REPLACE FUNCTION public.process_post_view(p_post_id text, p_viewer_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post RECORD;
  v_view_exists boolean;
  v_viewer_stars bigint;
  v_uploader uuid;
  v_price bigint; -- in stars
  uploader_share numeric;
  viewer_share numeric;
  platform_share numeric;
  star_value numeric := 500; -- ₦500 per star
BEGIN
  SELECT id, user_id, star_price
  INTO v_post
  FROM public.posts
  WHERE id = p_post_id AND status = 'approved';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Post not found');
  END IF;

  v_uploader := v_post.user_id;
  v_price := coalesce(v_post.star_price, 0);

  -- Free or own post: no charge, no earnings
  IF v_price <= 0 OR v_uploader = p_viewer_id THEN
    RETURN json_build_object('success', true, 'viewer_earn', 0, 'charged', false);
  END IF;

  -- Prevent double-charging on repeat views
  SELECT EXISTS (
    SELECT 1 FROM public.post_views WHERE post_id = p_post_id AND user_id = p_viewer_id
  ) INTO v_view_exists;

  IF v_view_exists THEN
    RETURN json_build_object('success', true, 'viewer_earn', 0, 'charged', false);
  END IF;

  -- Check star balance (stars)
  SELECT coalesce(star_balance,0) INTO v_viewer_stars FROM public.user_profiles WHERE id = p_viewer_id;
  IF v_viewer_stars < v_price THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient stars');
  END IF;

  -- Compute NGN earnings from stars
  uploader_share := v_price * star_value * 0.60;
  viewer_share := v_price * star_value * 0.20;
  platform_share := v_price * star_value * 0.20;

  -- Deduct stars from viewer
  UPDATE public.user_profiles
  SET star_balance = star_balance - v_price
  WHERE id = p_viewer_id;

  -- Credit uploader NGN wallet and total earned
  UPDATE public.user_profiles
  SET wallet_balance = coalesce(wallet_balance,0) + uploader_share,
      total_earned = coalesce(total_earned,0) + uploader_share
  WHERE id = v_uploader;

  -- Credit viewer NGN wallet (cashback)
  UPDATE public.user_profiles
  SET wallet_balance = coalesce(wallet_balance,0) + viewer_share
  WHERE id = p_viewer_id;

  -- Record wallet history in NGN
  INSERT INTO public.wallet_history (user_id, type, amount, currency, meta)
  VALUES 
    (v_uploader, 'upload_earn', uploader_share, 'NGN', json_build_object('post_id', p_post_id, 'stars_spent', v_price)),
    (p_viewer_id, 'view_earn', viewer_share, 'NGN', json_build_object('post_id', p_post_id, 'stars_spent', v_price));

  -- Record view transaction (store both stars and NGN breakdown)
  INSERT INTO public.view_transactions (post_id, viewer_id, uploader_id, star_price, uploader_amount, viewer_amount, platform_amount)
  VALUES (p_post_id, p_viewer_id, v_uploader, v_price, uploader_share, viewer_share, platform_share);

  RETURN json_build_object('success', true, 'viewer_earn', viewer_share, 'charged', true);
END;
$$;

-- Update: process_story_view
CREATE OR REPLACE FUNCTION public.process_story_view(p_story_id text, p_viewer_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_story RECORD;
  v_view_exists boolean;
  v_viewer_stars bigint;
  v_uploader uuid;
  v_price bigint; -- in stars
  uploader_share numeric;
  viewer_share numeric;
  platform_share numeric;
  star_value numeric := 500; -- ₦500 per star
BEGIN
  SELECT id, user_id, star_price
  INTO v_story
  FROM public.user_storylines
  WHERE id = p_story_id AND status = 'active';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Story not found');
  END IF;

  v_uploader := v_story.user_id;
  v_price := coalesce(v_story.star_price, 0);

  IF v_price <= 0 OR v_uploader = p_viewer_id THEN
    RETURN json_build_object('success', true, 'viewer_earn', 0, 'charged', false);
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.story_views WHERE story_id = p_story_id AND viewer_id = p_viewer_id
  ) INTO v_view_exists;

  IF v_view_exists THEN
    RETURN json_build_object('success', true, 'viewer_earn', 0, 'charged', false);
  END IF;

  SELECT coalesce(star_balance,0) INTO v_viewer_stars FROM public.user_profiles WHERE id = p_viewer_id;
  IF v_viewer_stars < v_price THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient stars');
  END IF;

  -- Compute NGN earnings
  uploader_share := v_price * star_value * 0.60;
  viewer_share := v_price * star_value * 0.20;
  platform_share := v_price * star_value * 0.20;

  -- Deduct stars and record view
  UPDATE public.user_profiles
  SET star_balance = star_balance - v_price
  WHERE id = p_viewer_id;

  INSERT INTO public.story_views (story_id, viewer_id, stars_spent)
  VALUES (p_story_id, p_viewer_id, v_price);

  -- Credit wallets
  UPDATE public.user_profiles
  SET wallet_balance = coalesce(wallet_balance,0) + uploader_share,
      total_earned = coalesce(total_earned,0) + uploader_share
  WHERE id = v_uploader;

  UPDATE public.user_profiles
  SET wallet_balance = coalesce(wallet_balance,0) + viewer_share
  WHERE id = p_viewer_id;

  -- Record wallet history in NGN
  INSERT INTO public.wallet_history (user_id, type, amount, currency, meta)
  VALUES 
    (v_uploader, 'story_earn', uploader_share, 'NGN', json_build_object('story_id', p_story_id, 'stars_spent', v_price)),
    (p_viewer_id, 'story_cashback', viewer_share, 'NGN', json_build_object('story_id', p_story_id, 'stars_spent', v_price));

  -- Record transaction
  INSERT INTO public.story_transactions (story_id, uploader_id, viewer_id, stars_spent, uploader_earn, viewer_earn, platform_earn)
  VALUES (p_story_id, v_uploader, p_viewer_id, v_price, uploader_share, viewer_share, platform_share);

  RETURN json_build_object('success', true, 'viewer_earn', viewer_share, 'charged', true);
END;
$$;