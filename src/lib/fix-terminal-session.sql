-- Fix start_terminal_session function - remove table_sessions dependency
-- Run this SQL in your Supabase SQL editor

-- Drop the existing function
DROP FUNCTION IF EXISTS start_terminal_session(VARCHAR(10), VARCHAR(255), VARCHAR(20));
DROP FUNCTION IF EXISTS start_terminal_session(TEXT, TEXT, TEXT);

-- Create the fixed function without table_sessions dependency
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
  v_session_code TEXT;
  v_customer_id UUID;
BEGIN
  -- Generate unique session code
  v_session_code := p_table_id || '-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 8);
  
  -- Insert customer data (this should work fine)
  INSERT INTO customers (name, phone, table_id, session_code)
  VALUES (p_customer_name, p_customer_phone, p_table_id, v_session_code)
  RETURNING id INTO v_customer_id;
  
  -- Return the session code (no table_sessions interaction)
  RETURN v_session_code;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION start_terminal_session(TEXT, TEXT, TEXT) TO anon, authenticated;

-- Test the function
SELECT start_terminal_session('T-01', 'Test User', '1234567890') as test_result;
