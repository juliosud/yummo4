-- Test script to check if comments are being stored and retrieved correctly
-- Run this in Supabase SQL editor to test the comments functionality

-- 1. Check if the comments column exists in order_items table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'order_items' 
AND column_name = 'comments';

-- 2. Check if there are any existing orders with comments
SELECT 
    o.id as order_id,
    o.table_number,
    o.created_at,
    oi.item_name,
    oi.quantity,
    oi.price,
    oi.comments
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
WHERE oi.comments IS NOT NULL 
AND oi.comments != ''
ORDER BY o.created_at DESC
LIMIT 10;

-- 3. Check recent orders to see their structure
SELECT 
    o.id,
    o.table_number,
    o.status,
    o.created_at,
    COUNT(oi.id) as item_count,
    STRING_AGG(oi.item_name, ', ') as items,
    STRING_AGG(COALESCE(oi.comments, ''), ' | ') as comments
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.created_at >= NOW() - INTERVAL '7 days'
GROUP BY o.id, o.table_number, o.status, o.created_at
ORDER BY o.created_at DESC
LIMIT 5;

-- 4. Test the AdminOrderContext query structure
-- This simulates what the frontend query should return
SELECT 
    o.*,
    json_agg(
        json_build_object(
            'id', oi.menu_item_id,
            'quantity', oi.quantity,
            'price', oi.price,
            'item_name', oi.item_name,
            'comments', oi.comments,
            'menu_item', json_build_object(
                'id', mi.id,
                'name', mi.name,
                'image', mi.image
            )
        )
    ) as order_items
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
WHERE o.created_at >= NOW() - INTERVAL '1 day'
GROUP BY o.id
ORDER BY o.created_at DESC
LIMIT 3;
