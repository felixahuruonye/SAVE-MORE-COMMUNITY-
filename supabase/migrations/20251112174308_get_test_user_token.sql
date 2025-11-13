create or replace function get_test_user_token()
returns text as $$
declare
  token text;
begin
  select sign(
    payload := json_build_object(
      'sub', 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
      'role', 'authenticated'
    ),
    secret := current_setting('app.settings.jwt_secret')
  ) into token;
  return token;
end;
$$ language plpgsql;
