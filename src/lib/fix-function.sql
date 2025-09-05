-- Fix the start_terminal_session function
-- Run this in Supabase SQL editor

-- Drop the existing function
DROP FUNCTION IF EXISTS start_terminal_session(VARCHAR(10), VARCHAR(255), VARCHAR(20));

-- Create the function with TEXT parameters (more compatible)
CREATE FUNCTION start_terminal_session(
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

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION start_terminal_session TO anon, authenticated;
