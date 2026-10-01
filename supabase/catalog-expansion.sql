-- Run after schema.sql. Safe to run again; existing product edits are preserved.
begin;
alter table public.products add column if not exists brand text;
alter table public.products add column if not exists source_url text;
insert into public.products (id,brand,name,category,description,price,size,image,tag,position,active,source_url) values
('niacinamide','The Ordinary','Niacinamide 10% + Zinc 1%','Skincare','A lightweight water-based serum with niacinamide and zinc for smoother-looking, more balanced skin.',600,'30 mL','/products/niacinamide.png','BALANCE & CARE',4,true,'https://theordinary.com/en-us/niacinamide-10-zinc-1-serum-100436.html'),
('hyaluronic','The Ordinary','Hyaluronic Acid 2% + B5 (with Ceramides)','Skincare','Daily hydration with hyaluronic acid, vitamin B5 and ceramides in a lightweight serum.',990,'30 mL','/products/hyaluronic.png','DAILY HYDRATION',5,true,'https://theordinary.com/en-us/hyaluronic-acid-2-b5-serum-with-ceramides-100637.html'),
('natural','The Ordinary','Natural Moisturizing Factors + HA','Skincare','An everyday cream with amino acids and hyaluronic acid to help keep skin comfortably hydrated.',670,'30 mL','/products/natural.png','EVERYDAY MOISTURE',6,true,'https://theordinary.com/en-us/natural-moisturizing-factors-ha-moisturizer-100435.html'),
('soft-pinch-liquid-blush','Rare Beauty','Soft Pinch Liquid Blush','Makeup','A blendable liquid blush in a soft nude mauve, with a fresh dewy finish.',2500,'Hope','/products/soft-pinch-liquid-blush.jpg','A TOUCH OF BLUSH',7,true,'https://www.rarebeauty.com/products/soft-pinch-liquid-blush?variant=43734829695111'),
('soft-pinch-tinted-lip-oil','Rare Beauty','Soft Pinch Tinted Lip Oil','Makeup','A glossy lip jelly that transforms into a lightweight oil, leaving a soft wash of nude mauve.',2400,'3 mL · Hope','/products/soft-pinch-tinted-lip-oil.jpg','SHEER COLOUR',8,true,'https://www.rarebeauty.com/products/soft-pinch-tinted-lip-oil?variant=43734835069063'),
('positive-light-liquid-luminizer-1','Rare Beauty','Positive Light Liquid Luminizer','Makeup','A liquid highlighter in cool champagne for a soft, buildable glow.',2800,'15 mL · Enlighten','/products/positive-light-liquid-luminizer-1.jpg','YOUR DAILY GLOW',9,true,'https://www.rarebeauty.com/products/positive-light-liquid-luminizer-1?variant=43734829203591')
on conflict (id) do nothing;
commit;
