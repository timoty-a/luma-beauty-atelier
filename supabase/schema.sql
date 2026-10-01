-- Run once in your Supabase SQL editor. All access is through server routes.
create table public.products(id text primary key,name text not null,category text not null,description text not null,price integer not null check(price>0),size text not null,image text not null,tag text not null,position integer not null,active boolean not null default true);
create table public.carts(session_id uuid primary key,user_id uuid references auth.users(id),revision integer not null default 0,updated_at timestamptz not null default now());
create table public.cart_items(session_id uuid references public.carts(session_id) on delete cascade,product_id text references public.products(id),quantity integer not null check(quantity between 1 and 10),primary key(session_id,product_id));
create table public.orders(id uuid primary key default gen_random_uuid(),session_id uuid not null,cart_revision integer not null,user_id uuid references auth.users(id),email text not null,customer_name text not null,shipping_address jsonb not null,items jsonb not null,total integer not null check(total>0),status text not null default 'confirmed',payment_status text not null default 'due_on_delivery',email_status text not null default 'pending' check(email_status in ('pending','sending','sent','failed')),created_at timestamptz not null default now(),unique(session_id,cart_revision));
alter table public.products enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
-- No anonymous/authenticated direct policies: service-role server only.
create function public.update_cart(p_session uuid,p_product text,p_quantity integer) returns jsonb language plpgsql security definer set search_path=public as $$
begin
 if p_quantity<0 or p_quantity>10 then raise exception 'Invalid quantity'; end if;
 if not exists(select 1 from products where id=p_product and active) then raise exception 'Product unavailable'; end if;
 insert into carts(session_id) values(p_session) on conflict do nothing;
 perform 1 from carts where session_id=p_session for update;
 if p_quantity=0 then delete from cart_items where session_id=p_session and product_id=p_product;
 else insert into cart_items values(p_session,p_product,p_quantity) on conflict(session_id,product_id) do update set quantity=excluded.quantity; end if;
 update carts set revision=revision+1,updated_at=now() where session_id=p_session;
 return coalesce((select jsonb_agg(jsonb_build_object('product_id',product_id,'quantity',quantity)) from cart_items where session_id=p_session),'[]'::jsonb);
end $$;
create function public.claim_cart(p_session uuid,p_user uuid) returns void language plpgsql security definer set search_path=public as $$
begin
 insert into carts(session_id,user_id) values(p_session,p_user) on conflict(session_id) do update set user_id=p_user;
end $$;
create function public.place_order(p_session uuid,p_customer jsonb,p_user uuid default null) returns jsonb language plpgsql security definer set search_path=public as $$
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
 return to_jsonb(result);
end $$;
revoke all on function public.update_cart(uuid,text,integer) from public,anon,authenticated;
revoke all on function public.claim_cart(uuid,uuid) from public,anon,authenticated;
revoke all on function public.place_order(uuid,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.update_cart(uuid,text,integer) to service_role;
grant execute on function public.claim_cart(uuid,uuid) to service_role;
grant execute on function public.place_order(uuid,jsonb,uuid) to service_role;
insert into public.products values
('dew-serum','The Daily Dew','Skincare','A lightweight hydrating serum for a fresh, dewy finish. Make a little room for it in your morning ritual.',2800,'30 ml / 1 fl oz','/serum.png','DAILY ESSENTIAL',1,true),
('cloud-cream','Cloud Comfort','Skincare','A soft, comforting face cream that leaves skin feeling beautifully moisturised. Your last step, morning and night.',3400,'50 ml / 1.7 fl oz','/cream.png','THE SOFT TOUCH',2,true),
('lip-veil','The Lip Veil','Makeup','An effortless wash of rose with a glossy, cushion-soft finish. Keep one close, wherever the day takes you.',1800,'10 ml / 0.34 fl oz','/lip.png','A LITTLE COLOUR',3,true);
