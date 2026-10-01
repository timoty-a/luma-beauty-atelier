-- Apply this once to projects created before the service-role table grants were
-- added to schema.sql.
grant usage on schema public to service_role;
grant select, insert, update, delete on table
  public.products,
  public.carts,
  public.cart_items,
  public.orders
to service_role;
