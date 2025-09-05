-- Customer data storage setup for terminal scanning
-- Run this SQL in your Supabase SQL editor

-- First, drop ALL existing versions of the function (to avoid conflicts)
DROP FUNCTION IF EXISTS start_terminal_session();
DROP FUNCTION IF EXISTS start_terminal_session(VARCHAR);
DROP FUNCTION IF EXISTS start_terminal_session(VARCHAR(10));
DROP FUNCTION IF EXISTS start_terminal_session(VARCHAR(10), VARCHAR(255), VARCHAR(20));
DROP FUNCTION IF EXISTS start_terminal_session(TEXT);
DROP FUNCTION IF EXISTS start_terminal_session(TEXT, TEXT, TEXT);

-- Create customers table to store customer information from terminal scans
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  table_id VARCHAR(10) NOT NULL,
  session_code VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_table_id ON customers(table_id);
CREATE INDEX IF NOT EXISTS idx_customers_session_code ON customers(session_code);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow customer data insertion" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to view customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to update customers" ON customers;

-- RLS Policies for customers table
-- Allow anyone to insert customer data (for terminal scanning)
CREATE POLICY "Allow customer data insertion" ON customers
  FOR INSERT WITH CHECK (true);

-- Allow authenticated users to view customer data
CREATE POLICY "Allow authenticated users to view customers" ON customers
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to update customer data
CREATE POLICY "Allow authenticated users to update customers" ON customers
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Create RPC function to start terminal session and store customer data
CREATE FUNCTION start_terminal_session(
  p_table_id VARCHAR(10),
  p_customer_name VARCHAR(255),
  p_customer_phone VARCHAR(20)
)
RETURNS VARCHAR(255)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_code VARCHAR(255);
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

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_customer_by_session(VARCHAR(255));
DROP FUNCTION IF EXISTS get_customer_by_phone(VARCHAR(20));

-- Create function to get customer by session code
CREATE FUNCTION get_customer_by_session(p_session_code VARCHAR(255))
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  phone VARCHAR(20),
  table_id VARCHAR(10),
  session_code VARCHAR(255),
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

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_customer_by_session TO anon, authenticated;

-- Create function to get customer by phone number (for future SMS notifications)
CREATE FUNCTION get_customer_by_phone(p_phone VARCHAR(20))
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  phone VARCHAR(20),
  table_id VARCHAR(10),
  session_code VARCHAR(255),
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.name, c.phone, c.table_id, c.session_code, c.created_at
  FROM customers c
  WHERE c.phone = p_phone
  ORDER BY c.created_at DESC;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_customer_by_phone TO anon, authenticated;
