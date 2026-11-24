-- Link the shop to Rigly (the band's Setlist Manager), which now owns merch stock and records the money.
--   merchandise.rigly_item_id  the Rigly item a shop product sells; sizes and stock come from there.
--                              A product shows in the shop only when it's active and linked.
--   merch_orders.rigly_sync    'done' once Rigly has the paid order, 'pending' while it couldn't be sent yet
--                              (retried on the next checkout), 'skipped' if it was cancelled before it got there.
--   merch_orders.rigly_error   the last problem talking to Rigly about this order, for the admin page.
-- merchandise.size_stock stays as the shop's fallback copy of Rigly's stock (written by the server only).
-- Also links the two shirts already in the shop to their Rigly items. Safe to re-run.

alter table merchandise add column if not exists rigly_item_id uuid;
create unique index if not exists merchandise_rigly_item_idx on merchandise (rigly_item_id) where rigly_item_id is not null;

alter table merch_orders add column if not exists rigly_sync text;
alter table merch_orders add column if not exists rigly_error text;

-- Kaledhode Oversized T Shirt -> Rigly "Kaledhode T Shirt"; Aandhi Oversized T Shirt -> Rigly "Aandhi T Shirt"
update merchandise set rigly_item_id = '3037736e-11dc-4324-b7ef-bfbb05419ad7' where id = '830cd699-a65a-4b57-a7dd-1d5dcbfee6b9';
update merchandise set rigly_item_id = '2fbffc83-f333-4e75-889d-7c7e7c94cf28' where id = 'c3e081a8-2448-4ded-98a9-8da4fc94d541';
