-- Columns needed to cancel a merch order (refund proof + reason).
-- Run this once in Supabase Dashboard -> SQL Editor.

ALTER TABLE merch_orders
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS refund_proof_url text,
  ADD COLUMN IF NOT EXISTS refund_proof_path text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
