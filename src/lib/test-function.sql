-- Test function to debug the start_terminal_session issue
-- Run this in Supabase SQL editor

-- First, let's check what functions exist
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'start_terminal_session';

-- Let's also check the customers table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'customers';

-- Create a simple test function to see if the issue is with parameters
CREATE OR REPLACE FUNCTION test_start_terminal_session(
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
BEGIN
  -- Generate unique session code
  session_code := p_table_id || '-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 8);
  
  -- Insert customer data
  INSERT INTO customers (name, phone, table_id, session_code)
  VALUES (p_customer_name, p_customer_phone, p_table_id, session_code);
  
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
GRANT EXECUTE ON FUNCTION test_start_terminal_session TO anon, authenticated;
