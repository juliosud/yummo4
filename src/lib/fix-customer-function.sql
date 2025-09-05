-- Fix get_customer_by_session function overloading issue
-- Run this SQL in your Supabase SQL editor

-- Drop ALL existing versions of the function to resolve overloading
DROP FUNCTION IF EXISTS get_customer_by_session(VARCHAR(255));
DROP FUNCTION IF EXISTS get_customer_by_session(TEXT);
DROP FUNCTION IF EXISTS get_customer_by_session(p_session_code VARCHAR(255));
DROP FUNCTION IF EXISTS get_customer_by_session(p_session_code TEXT);

-- Create a single, clean version of the function
CREATE OR REPLACE FUNCTION get_customer_by_session(p_session_code TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  phone TEXT,
  table_id TEXT,
  session_code TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.name, c.phone, c.table_id, c.session_code, c.created_at
  FROM customers c
  WHERE c.session_code = p_session_code;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_customer_by_session(TEXT) TO anon, authenticated;
