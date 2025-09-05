-- Multi-Tenancy Setup for Restaurant Isolation
-- This script adds restaurant isolation to the entire database
-- Run this in your Supabase SQL editor

-- =====================================================
-- 1. CREATE RESTAURANTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.restaurants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  slug character varying UNIQUE NOT NULL, -- URL-friendly identifier
  description text,
  address text,
  phone character varying,
  email character varying,
  website text,
  logo_url text,
  settings jsonb DEFAULT '{}'::jsonb, -- Store restaurant-specific settings
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT restaurants_pkey PRIMARY KEY (id),
  CONSTRAINT restaurants_slug_key UNIQUE (slug)
);

-- =====================================================
-- 2. ADD RESTAURANT_ID TO ALL RELEVANT TABLES
-- =====================================================

-- Add restaurant_id to menu_items
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE;

-- Add restaurant_id to tables
ALTER TABLE public.tables 
ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE;

-- Add restaurant_id to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE;

-- Add restaurant_id to cart_items
ALTER TABLE public.cart_items 
ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE;

-- Add restaurant_id to table_sessions
ALTER TABLE public.table_sessions 
ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE;

-- Add restaurant_id to customers
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE;

-- =====================================================
-- 3. UPDATE USER_PROFILES TO LINK TO RESTAURANT
-- =====================================================

-- Add restaurant_id to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE SET NULL;

-- =====================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes on restaurant_id columns for better query performance
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON public.menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_tables_restaurant_id ON public.tables(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_restaurant_id ON public.cart_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_table_sessions_restaurant_id ON public.table_sessions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_customers_restaurant_id ON public.customers(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_restaurant_id ON public.user_profiles(restaurant_id);

-- =====================================================
-- 5. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to get current user's restaurant_id
CREATE OR REPLACE FUNCTION get_current_restaurant_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT restaurant_id 
  FROM public.user_profiles 
  WHERE id = auth.uid();
$$;

-- Function to create a new restaurant and link it to a user
CREATE OR REPLACE FUNCTION create_restaurant_for_user(
  p_restaurant_name text,
  p_restaurant_slug text,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_restaurant_id uuid;
BEGIN
  -- Create the restaurant
  INSERT INTO public.restaurants (name, slug)
  VALUES (p_restaurant_name, p_restaurant_slug)
  RETURNING id INTO v_restaurant_id;
  
  -- Link the user to the restaurant
  UPDATE public.user_profiles 
  SET restaurant_id = v_restaurant_id
  WHERE id = p_user_id;
  
  RETURN v_restaurant_id;
END;
$$;

-- Function to get restaurant data for current user
CREATE OR REPLACE FUNCTION get_current_restaurant()
RETURNS TABLE (
  id uuid,
  name character varying,
  slug character varying,
  description text,
  address text,
  phone character varying,
  email character varying,
  website text,
  logo_url text,
  settings jsonb,
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT r.*
  FROM public.restaurants r
  JOIN public.user_profiles up ON r.id = up.restaurant_id
  WHERE up.id = auth.uid();
$$;

-- =====================================================
-- 6. UPDATE ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on restaurants table
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- Restaurants: Users can only see their own restaurant
CREATE POLICY "Users can view their own restaurant" ON public.restaurants
  FOR SELECT USING (
    id IN (
      SELECT restaurant_id 
      FROM public.user_profiles 
      WHERE id = auth.uid()
    )
  );

-- Restaurants: Users can update their own restaurant
CREATE POLICY "Users can update their own restaurant" ON public.restaurants
  FOR UPDATE USING (
    id IN (
      SELECT restaurant_id 
      FROM public.user_profiles 
      WHERE id = auth.uid()
    )
  );

-- Menu Items: Users can only see menu items from their restaurant
CREATE POLICY "Users can view menu items from their restaurant" ON public.menu_items
  FOR SELECT USING (
    restaurant_id IN (
      SELECT restaurant_id 
      FROM public.user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert menu items to their restaurant" ON public.menu_items
  FOR INSERT WITH CHECK (
    restaurant_id IN (
      SELECT restaurant_id 
      FROM public.user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update menu items from their restaurant" ON public.menu_items
  FOR UPDATE USING (
    restaurant_id IN (
      SELECT restaurant_id 
      FROM public.user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete menu items from their restaurant" ON public.menu_items
  FOR DELETE USING (
    restaurant_id IN (
      SELECT restaurant_id 
      FROM public.user_profiles 
      WHERE id = auth.uid()
    )
  );

-- Tables: Users can only see tables from their restaurant
CREATE POLICY "Users can view tables from their restaurant" ON public.tables
  FOR SELECT USING (
    restaurant_id IN (
      SELECT restaurant_id 
      FROM public.user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tables to their restaurant" ON public.tables
  FOR INSERT WITH CHECK (
    restaurant_id IN (
      SELECT restaurant_id 
      FROM public.user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update tables from their restaurant" ON public.tables
  FOR UPDATE USING (
    restaurant_id IN (
      SELECT restaurant_id 
      FROM public.user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tables from their restaurant" ON public.tables
  FOR DELETE USING (
    restaurant_id IN (
      SELECT restaurant_id 
      FROM public.user_profiles 
      WHERE id = auth.uid()
    )
  );

-- Orders: Users can only see orders from their restaurant
CREATE POLICY "Users can view orders from their restaurant" ON public.orders
  FOR SELECT USING (
    restaurant_id IN (
      SELECT restaurant_id 
      FROM public.user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert orders to their restaurant" ON public.orders
  FOR INSERT WITH CHECK (
    restaurant_id IN (
      SELECT restaurant_id 
      FROM public.user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update orders from their restaurant" ON public.orders
  FOR UPDATE USING (
    restaurant_id IN (
      SELECT restaurant_id 
      FROM public.user_profiles 
      WHERE id = auth.uid()
    )
  );

-- Cart Items: Users can only see cart items from their restaurant
CREATE POLICY "Users can view cart items from their restaurant" ON public.cart_items
  FOR SELECT USING (
    restaurant_id IN (
      SELECT restaurant_id 
      FROM public.user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert cart items to their restaurant" ON public.cart_items
  FOR INSERT WITH CHECK (
    restaurant_id IN (
      SELECT restaurant_id 
      FROM public.user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update cart items from their restaurant" ON public.cart_items
  FOR UPDATE USING (
    restaurant_id IN (
      SELECT restaurant_id 
      FROM public.user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete cart items from their restaurant" ON public.cart_items
  FOR DELETE USING (
    restaurant_id IN (
      SELECT restaurant_id 
      FROM public.user_profiles 
      WHERE id = auth.uid()
    )
  );

-- Table Sessions: Users can only see sessions from their restaurant
CREATE POLICY "Users can view table sessions from their restaurant" ON public.table_sessions
  FOR SELECT USING (
    restaurant_id IN (
      SELECT restaurant_id 
      FROM public.user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert table sessions to their restaurant" ON public.table_sessions
  FOR INSERT WITH CHECK (
    restaurant_id IN (
      SELECT restaurant_id 
      FROM public.user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update table sessions from their restaurant" ON public.table_sessions
  FOR UPDATE USING (
    restaurant_id IN (
      SELECT restaurant_id 
      FROM public.user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete table sessions from their restaurant" ON public.table_sessions
  FOR DELETE USING (
    restaurant_id IN (
      SELECT restaurant_id 
      FROM public.user_profiles 
      WHERE id = auth.uid()
    )
  );

-- Customers: Users can only see customers from their restaurant
CREATE POLICY "Users can view customers from their restaurant" ON public.customers
  FOR SELECT USING (
    restaurant_id IN (
      SELECT restaurant_id 
      FROM public.user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert customers to their restaurant" ON public.customers
  FOR INSERT WITH CHECK (
    restaurant_id IN (
      SELECT restaurant_id 
      FROM public.user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update customers from their restaurant" ON public.customers
  FOR UPDATE USING (
    restaurant_id IN (
      SELECT restaurant_id 
      FROM public.user_profiles 
      WHERE id = auth.uid()
    )
  );

-- =====================================================
-- 7. UPDATE EXISTING FUNCTIONS FOR RESTAURANT ISOLATION
-- =====================================================

-- Update start_terminal_session function to include restaurant_id
CREATE OR REPLACE FUNCTION start_terminal_session(
  p_table_id text,
  p_customer_name text,
  p_customer_phone text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_code text;
  v_customer_id uuid;
  v_restaurant_id uuid;
BEGIN
  -- Get the restaurant_id from the table
  SELECT restaurant_id INTO v_restaurant_id
  FROM public.tables
  WHERE table_id = p_table_id;
  
  IF v_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'Table not found or not associated with a restaurant';
  END IF;
  
  -- Generate session code
  v_session_code := 'TERM_' || substring(md5(random()::text) from 1 for 8);
  
  -- Create or update customer
  INSERT INTO public.customers (name, phone, table_id, session_code, restaurant_id)
  VALUES (p_customer_name, p_customer_phone, p_table_id, v_session_code, v_restaurant_id)
  ON CONFLICT (session_code) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    updated_at = NOW()
  RETURNING id INTO v_customer_id;
  
  -- Create or update table session
  INSERT INTO public.table_sessions (table_id, session_code, is_active, restaurant_id)
  VALUES (p_table_id, v_session_code, true, v_restaurant_id)
  ON CONFLICT (session_code) DO UPDATE SET
    is_active = true,
    updated_at = NOW();
  
  RETURN jsonb_build_object(
    'session_code', v_session_code,
    'customer_id', v_customer_id,
    'restaurant_id', v_restaurant_id
  );
END;
$$;

-- Update get_customer_by_session function to include restaurant isolation
CREATE OR REPLACE FUNCTION get_customer_by_session(p_session_code text)
RETURNS TABLE (
  id uuid,
  name character varying,
  phone character varying,
  table_id character varying,
  session_code character varying,
  restaurant_id uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT c.*
  FROM public.customers c
  JOIN public.user_profiles up ON c.restaurant_id = up.restaurant_id
  WHERE c.session_code = p_session_code
  AND up.id = auth.uid();
$$;

-- =====================================================
-- 8. MIGRATION HELPER FOR EXISTING DATA
-- =====================================================

-- Function to migrate existing data to a default restaurant
-- This should be run once after setting up multi-tenancy
CREATE OR REPLACE FUNCTION migrate_existing_data_to_restaurant(
  p_restaurant_name text DEFAULT 'Default Restaurant',
  p_restaurant_slug text DEFAULT 'default-restaurant'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_restaurant_id uuid;
BEGIN
  -- Create default restaurant
  INSERT INTO public.restaurants (name, slug)
  VALUES (p_restaurant_name, p_restaurant_slug)
  RETURNING id INTO v_restaurant_id;
  
  -- Update all existing data to belong to this restaurant
  UPDATE public.menu_items SET restaurant_id = v_restaurant_id WHERE restaurant_id IS NULL;
  UPDATE public.tables SET restaurant_id = v_restaurant_id WHERE restaurant_id IS NULL;
  UPDATE public.orders SET restaurant_id = v_restaurant_id WHERE restaurant_id IS NULL;
  UPDATE public.cart_items SET restaurant_id = v_restaurant_id WHERE restaurant_id IS NULL;
  UPDATE public.table_sessions SET restaurant_id = v_restaurant_id WHERE restaurant_id IS NULL;
  UPDATE public.customers SET restaurant_id = v_restaurant_id WHERE restaurant_id IS NULL;
  
  -- Link all existing users to this restaurant
  UPDATE public.user_profiles SET restaurant_id = v_restaurant_id WHERE restaurant_id IS NULL;
  
  RETURN v_restaurant_id;
END;
$$;

-- =====================================================
-- 9. CREATE TRIGGERS FOR AUTOMATIC RESTAURANT_ID ASSIGNMENT
-- =====================================================

-- Function to automatically assign restaurant_id based on current user
CREATE OR REPLACE FUNCTION assign_restaurant_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_restaurant_id uuid;
BEGIN
  -- Get restaurant_id from current user
  SELECT restaurant_id INTO v_restaurant_id
  FROM public.user_profiles
  WHERE id = auth.uid();
  
  -- Assign restaurant_id to the new record
  NEW.restaurant_id = v_restaurant_id;
  
  RETURN NEW;
END;
$$;

-- Create triggers for automatic restaurant_id assignment
CREATE TRIGGER assign_restaurant_id_menu_items
  BEFORE INSERT ON public.menu_items
  FOR EACH ROW
  EXECUTE FUNCTION assign_restaurant_id();

CREATE TRIGGER assign_restaurant_id_tables
  BEFORE INSERT ON public.tables
  FOR EACH ROW
  EXECUTE FUNCTION assign_restaurant_id();

CREATE TRIGGER assign_restaurant_id_orders
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION assign_restaurant_id();

CREATE TRIGGER assign_restaurant_id_cart_items
  BEFORE INSERT ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION assign_restaurant_id();

CREATE TRIGGER assign_restaurant_id_table_sessions
  BEFORE INSERT ON public.table_sessions
  FOR EACH ROW
  EXECUTE FUNCTION assign_restaurant_id();

CREATE TRIGGER assign_restaurant_id_customers
  BEFORE INSERT ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION assign_restaurant_id();

-- =====================================================
-- 10. COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.restaurants IS 'Restaurant entities for multi-tenancy isolation';
COMMENT ON COLUMN public.restaurants.slug IS 'URL-friendly identifier for the restaurant';
COMMENT ON COLUMN public.restaurants.settings IS 'JSON object storing restaurant-specific configuration';

COMMENT ON FUNCTION get_current_restaurant_id() IS 'Returns the restaurant_id for the currently authenticated user';
COMMENT ON FUNCTION create_restaurant_for_user(text, text, uuid) IS 'Creates a new restaurant and links it to a user';
COMMENT ON FUNCTION get_current_restaurant() IS 'Returns the complete restaurant data for the current user';
COMMENT ON FUNCTION migrate_existing_data_to_restaurant(text, text) IS 'Migrates existing data to a default restaurant (run once after setup)';

-- =====================================================
-- SETUP INSTRUCTIONS
-- =====================================================

/*
SETUP INSTRUCTIONS:

1. Run this entire script in your Supabase SQL editor
2. After running, execute this command to migrate existing data:
   SELECT migrate_existing_data_to_restaurant('Your Restaurant Name', 'your-restaurant-slug');

3. Update your frontend code to:
   - Filter all queries by restaurant_id
   - Create restaurant on user signup
   - Handle restaurant selection in UI

4. Test the setup by:
   - Creating a new user account
   - Verifying they only see their restaurant's data
   - Testing that data is properly isolated between restaurants

IMPORTANT NOTES:
- This setup provides complete data isolation between restaurants
- All existing data will be migrated to a default restaurant
- New users will need to create their own restaurant
- RLS policies ensure users can only access their own restaurant's data
*/
