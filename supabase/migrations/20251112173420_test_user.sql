insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_sent_at, confirmed_at, email_change_token_current, email_change_token_new, recovery_token_iv, recovery_token_key_id)
values ('00000000-0000-0000-0000-000000000000', 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6', 'authenticated', 'authenticated', 'test@example.com', crypt('password', gen_salt('bf')), now(), '', now(), now(), '{"provider":"email","providers":["email"]}', '{"username":"testuser"}', now(), now(), '', '', now(), now(), '', '', '', '');

insert into public.user_profiles (id, username, avatar_url, vip)
values ('a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6', 'testuser', '', false);
