# Multi-Tenancy Migration Guide

This guide explains how to migrate your existing Yummo application to support multiple restaurants with complete data isolation.

## 🏗️ Architecture Overview

The new multi-tenancy system adds:
- **Restaurant entities** - Each restaurant is a separate tenant
- **Restaurant isolation** - All data is filtered by `restaurant_id`
- **Row Level Security (RLS)** - Database-level data isolation
- **Automatic restaurant creation** - New users create their own restaurant

## 📋 Migration Steps

### 1. Database Setup

Run the complete SQL script in your Supabase SQL editor:

```sql
-- Run the entire multi-tenancy-setup.sql script
-- This will:
-- - Create restaurants table
-- - Add restaurant_id to all relevant tables
-- - Set up RLS policies
-- - Create helper functions
-- - Add automatic triggers
```

### 2. Migrate Existing Data

After running the setup script, migrate your existing data to a default restaurant:

```sql
-- Replace with your actual restaurant details
SELECT migrate_existing_data_to_restaurant(
  'Your Restaurant Name', 
  'your-restaurant-slug'
);
```

### 3. Frontend Updates

The frontend has been updated with:
- **RestaurantContext** - Manages restaurant data
- **RestaurantSetup** - Component for new restaurant creation
- **RestaurantGuard** - Ensures users have a restaurant
- **Updated App.tsx** - Includes RestaurantProvider

### 4. Test the Migration

1. **Verify existing data** - Check that your existing menu items, orders, and tables are still visible
2. **Test new user flow** - Create a new user account and verify they go through restaurant setup
3. **Test data isolation** - Ensure users only see their own restaurant's data

## 🔧 Key Changes

### Database Schema

**New Tables:**
- `restaurants` - Restaurant entities with settings and metadata

**Updated Tables:**
- All tables now have `restaurant_id` foreign key
- RLS policies ensure data isolation

**New Functions:**
- `get_current_restaurant_id()` - Get user's restaurant ID
- `create_restaurant_for_user()` - Create restaurant for new user
- `get_current_restaurant()` - Get complete restaurant data
- `migrate_existing_data_to_restaurant()` - Migrate existing data

### Frontend Changes

**New Contexts:**
- `RestaurantContext` - Manages restaurant state and operations

**New Components:**
- `RestaurantSetup` - Restaurant creation form
- `RestaurantGuard` - Ensures restaurant exists

**Updated Components:**
- `App.tsx` - Includes RestaurantProvider and RestaurantGuard
- All contexts now filter by restaurant_id (automatic via RLS)

## 🚀 New User Flow

1. **User signs up** → Creates auth account
2. **Restaurant setup** → Creates restaurant profile
3. **Dashboard access** → Can now manage their restaurant

## 🔒 Security Features

- **Row Level Security (RLS)** - Database-level isolation
- **Automatic filtering** - All queries filtered by restaurant_id
- **User-restaurant linking** - Users can only access their restaurant
- **Secure functions** - All database functions use SECURITY DEFINER

## 📊 Data Isolation

Each restaurant will only see:
- Their own menu items
- Their own tables
- Their own orders
- Their own customers
- Their own cart items
- Their own table sessions

## 🛠️ Troubleshooting

### Common Issues

1. **"No restaurant found"** - User needs to complete restaurant setup
2. **"Permission denied"** - RLS policies are working (this is good!)
3. **Missing data** - Check if restaurant_id was properly assigned

### Debugging Queries

```sql
-- Check if user has a restaurant
SELECT * FROM user_profiles WHERE id = auth.uid();

-- Check restaurant data
SELECT * FROM restaurants WHERE id = (
  SELECT restaurant_id FROM user_profiles WHERE id = auth.uid()
);

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'menu_items';
```

## 🔄 Rollback Plan

If you need to rollback:

1. **Disable RLS** on all tables
2. **Remove restaurant_id columns** (data will be lost)
3. **Drop restaurants table**
4. **Remove new functions and triggers**

⚠️ **Warning**: Rolling back will result in data loss for the restaurant_id columns.

## 📈 Benefits

- **Complete data isolation** between restaurants
- **Scalable architecture** for multiple restaurants
- **Secure by default** with RLS policies
- **Easy restaurant management** with dedicated UI
- **Future-ready** for restaurant chains and franchises

## 🎯 Next Steps

After migration:
1. **Test thoroughly** with multiple user accounts
2. **Update documentation** for your team
3. **Consider restaurant settings** (themes, branding, etc.)
4. **Plan for restaurant management** features (staff roles, permissions)

## 📞 Support

If you encounter issues during migration:
1. Check the Supabase logs for RLS policy violations
2. Verify that all foreign key constraints are satisfied
3. Ensure the migration script ran completely
4. Test with a fresh user account to verify the flow

The multi-tenancy system provides a solid foundation for scaling your restaurant management platform!
