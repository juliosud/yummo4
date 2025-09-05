-- Debug and fix the start_terminal_session function
-- Run this in Supabase SQL editor

-- First, let's see what functions exist
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name LIKE '%terminal_session%';

-- Check if customers table exists
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customers'
ORDER BY ordinal_position;

-- Drop ALL existing versions of the function
DROP FUNCTION IF EXISTS start_terminal_session();
DROP FUNCTION IF EXISTS start_terminal_session(VARCHAR);
DROP FUNCTION IF EXISTS start_terminal_session(VARCHAR(10));
DROP FUNCTION IF EXISTS start_terminal_session(VARCHAR(10), VARCHAR(255), VARCHAR(20));
DROP FUNCTION IF EXISTS start_terminal_session(TEXT);
DROP FUNCTION IF EXISTS start_terminal_session(TEXT, TEXT, TEXT);

-- Create the function with a simple signature
CREATE OR REPLACE FUNCTION start_terminal_session(
  p_table_id TEXT,
  p_customer_name TEXT,
  p_customer_phone TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_code TEXT;
  customer_id UUID;
BEGIN
  -- Generate unique session code
  session_code := p_table_id || '-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 8);
  
  -- Insert customer data
  INSERT INTO customers (name, phone, table_id, session_code)
  VALUES (p_customer_name, p_customer_phone, p_table_id, session_code)
  RETURNING id INTO customer_id;
  
  -- Create or update table session
  INSERT INTO table_sessions (table_id, session_code, is_active)
  VALUES (p_table_id, session_code, true)
  ON CONFLICT (session_code) 
  DO UPDATE SET 
    is_active = true,
    updated_at = NOW();
  
  -- Return the session code
  RETURN session_code;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION start_terminal_session(TEXT, TEXT, TEXT) TO anon, authenticated;

-- Test the function
SELECT start_terminal_session('TEST-01', 'John Doe', '5551234567') as test_result;
