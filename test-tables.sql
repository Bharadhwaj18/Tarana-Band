-- Quick Test: Check if tables exist
-- Run this in Supabase SQL Editor

-- Check band_members table
SELECT COUNT(*) as member_count FROM band_members;

-- Check homepage_config table
SELECT COUNT(*) as config_count FROM homepage_config;

-- If you get errors like "table does not exist", you need to create the tables first!
