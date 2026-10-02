-- Resolve every signed-in device to one cart while preserving anonymous items.
create or replace function public.claim_shared_cart(p_session uuid, p_user uuid)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  target uuid;
  incoming_owner uuid;
begin
  if p_user is null then
    raise exception 'A user is required';
  end if;

  -- Serialize first-time claims for the same account without exposing cart rows.
  perform pg_advisory_xact_lock(hashtextextended(p_user::text, 0));

  select session_id into target
  from carts
  where user_id=p_user
  order by updated_at desc
  limit 1
  for update;

  if target is null then
    select user_id into incoming_owner from carts where session_id=p_session for update;
    if incoming_owner is null then
      insert into carts(session_id,user_id)
      values(p_session,p_user)
      on conflict(session_id) do update set user_id=excluded.user_id,updated_at=now()
      where carts.user_id is null or carts.user_id=excluded.user_id;
      select session_id into target from carts where session_id=p_session and user_id=p_user;
    end if;
    if target is null then
      target=gen_random_uuid();
      insert into carts(session_id,user_id) values(target,p_user);
    end if;
    return target;
  end if;

  if target<>p_session and exists(
    select 1 from carts where session_id=p_session and (user_id is null or user_id=p_user)
  ) then
    insert into cart_items(session_id,product_id,quantity)
    select target,product_id,quantity from cart_items where session_id=p_session
    on conflict(session_id,product_id) do update
    set quantity=least(10,cart_items.quantity+excluded.quantity);
    delete from carts where session_id=p_session and (user_id is null or user_id=p_user);
    update carts set revision=revision+1,updated_at=now() where session_id=target;
  end if;

  return target;
end
$$;

revoke all on function public.claim_shared_cart(uuid,uuid) from public,anon,authenticated;
grant execute on function public.claim_shared_cart(uuid,uuid) to service_role;

create or replace function public.place_order(p_session uuid,p_customer jsonb,p_user uuid default null) returns jsonb language plpgsql security definer set search_path=public as $$
declare rev integer; lines jsonb; subtotal integer; result orders;
begin
 select revision into rev from carts where session_id=p_session for update;
 if rev is null then raise exception 'Cart is empty'; end if;
 select * into result from orders where session_id=p_session and cart_revision=rev;
 if found then return to_jsonb(result); end if;
 if exists(select 1 from cart_items c join products p on p.id=c.product_id where c.session_id=p_session and not p.active) then raise exception 'An item is unavailable'; end if;
 select jsonb_agg(jsonb_build_object('product_id',p.id,'name',p.name,'price',p.price,'quantity',c.quantity)),sum(p.price*c.quantity) into lines,subtotal from cart_items c join products p on p.id=c.product_id where c.session_id=p_session;
 if subtotal is null then raise exception 'Cart is empty'; end if;
 insert into orders(session_id,cart_revision,user_id,email,customer_name,shipping_address,items,total) values(p_session,rev,p_user,p_customer->>'email',p_customer->>'name',p_customer-'email'-'name',lines,subtotal+case when subtotal>=6000 then 0 else 600 end) returning * into result;
 delete from cart_items where session_id=p_session;
 update carts set revision=revision+1,updated_at=now() where session_id=p_session;
 return to_jsonb(result);
end $$;
