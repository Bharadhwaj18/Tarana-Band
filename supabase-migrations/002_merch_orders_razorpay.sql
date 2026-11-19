-- Razorpay payments for merch orders.
-- Run this once in Supabase Dashboard -> SQL Editor (website project).
-- Select nothing in the editor before running, so the whole script runs.

-- Orders paid through Razorpay have no payment screenshot
ALTER TABLE merch_orders ALTER COLUMN payment_proof_url DROP NOT NULL;
ALTER TABLE merch_orders ALTER COLUMN payment_proof_path DROP NOT NULL;

ALTER TABLE merch_orders
  ADD COLUMN IF NOT EXISTS razorpay_order_id text,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS merch_orders_razorpay_order_id_key
  ON merch_orders (razorpay_order_id)
  WHERE razorpay_order_id IS NOT NULL;

-- Orders now start as 'pending_payment' until Razorpay confirms the payment.
-- Remove any existing check rule on status that would reject the new value.
DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.merch_orders'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.merch_orders DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;
