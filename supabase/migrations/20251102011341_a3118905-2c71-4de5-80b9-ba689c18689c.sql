-- Update existing old posts to 'viewed' status
UPDATE posts
SET post_status = 'viewed'
WHERE post_status = 'new'
  AND created_at < NOW() - INTERVAL '48 hours'
  AND status = 'approved';