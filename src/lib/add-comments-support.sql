-- Add comments/modifications support to cart and order items
-- Run this SQL in your Supabase SQL editor

-- Add comments field to cart_items table
ALTER TABLE cart_items 
ADD COLUMN IF NOT EXISTS comments TEXT;

-- Add comments field to order_items table  
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS comments TEXT;

-- Add indexes for better performance (optional)
CREATE INDEX IF NOT EXISTS idx_cart_items_comments ON cart_items(comments) WHERE comments IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_comments ON order_items(comments) WHERE comments IS NOT NULL;

-- Update existing records to have empty comments (optional)
UPDATE cart_items SET comments = '' WHERE comments IS NULL;
UPDATE order_items SET comments = '' WHERE comments IS NULL;

-- Verify the changes
SELECT 
    'cart_items' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'cart_items' AND column_name = 'comments'

UNION ALL

SELECT 
    'order_items' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'order_items' AND column_name = 'comments';
