-- Fixed start_terminal_session function
-- Run this in Supabase SQL editor

-- Drop the existing function
DROP FUNCTION IF EXISTS start_terminal_session(TEXT, TEXT, TEXT);

-- Create the function with renamed variables to avoid ambiguity
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
  
  -- Insert customer data
  INSERT INTO customers (name, phone, table_id, session_code)
  VALUES (p_customer_name, p_customer_phone, p_table_id, v_session_code)
  RETURNING id INTO v_customer_id;
  
  -- Create or update table session
  INSERT INTO table_sessions (table_id, session_code, is_active)
  VALUES (p_table_id, v_session_code, true)
  ON CONFLICT (session_code) 
  DO UPDATE SET 
    is_active = true,
    updated_at = NOW();
  
  -- Return the session code
  RETURN v_session_code;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION start_terminal_session(TEXT, TEXT, TEXT) TO anon, authenticated;

-- Test the function
SELECT start_terminal_session('TEST-01', 'John Doe', '5551234567') as test_result;
