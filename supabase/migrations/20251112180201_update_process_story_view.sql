alter table wallet_history add column star_balance integer;

create or replace function process_story_view (p_story_id bigint, p_viewer_id uuid)
returns table (success boolean, error text, viewer_earn numeric) as $$
declare
  story_owner_id uuid;
  story_star_price integer;
  viewer_star_balance integer;
begin
  select user_id, star_price into story_owner_id, story_star_price from user_storylines where id = p_story_id;
  select star_balance into viewer_star_balance from user_profiles where id = p_viewer_id;

  if story_star_price > 0 and story_owner_id <> p_viewer_id then
    if viewer_star_balance >= story_star_price then
      update user_profiles set star_balance = star_balance - story_star_price where id = p_viewer_id;
      update user_profiles set star_balance = star_balance + story_star_price where id = story_owner_id;

      insert into wallet_history (user_id, type, amount, star_balance)
      values (p_viewer_id, 'story_view_fee', -story_star_price, (select star_balance from user_profiles where id = p_viewer_id)),
             (story_owner_id, 'story_view_earn', story_star_price, (select star_balance from user_profiles where id = story_owner_id));

      viewer_earn := story_star_price * 500 * 0.2;

      return query select true, null, viewer_earn;
    else
      return query select false, 'Insufficient stars', 0;
    end if;
  else
    return query select true, null, 0;
  end if;
end;
$$ language plpgsql;
