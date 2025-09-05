# Customer Data Storage Setup

This document explains how to set up and use the customer data storage system for terminal scanning.

## Overview

When customers scan a terminal QR code, they now provide their name and phone number. This information is stored in a database table for future use, such as sending SMS notifications about order status.

## Database Setup

1. **Run the SQL setup script** in your Supabase SQL editor:
   ```sql
   -- Run the contents of src/lib/customer-setup.sql
   ```

   This creates:
   - `customers` table to store customer information
   - `start_terminal_session` RPC function to create sessions and store customer data
   - `get_customer_by_session` function to retrieve customer data by session
   - `get_customer_by_phone` function to search customers by phone number
   - Proper indexes and RLS policies

## How It Works

### Terminal Scanning Flow

1. **Customer scans QR code** → Redirected to `/term/{table_id}`
2. **Customer enters name and phone** → Data validated
3. **Customer clicks "Start Ordering"** → `start_terminal_session` RPC called with:
   - `p_table_id`: Table identifier
   - `p_customer_name`: Customer's full name
   - `p_customer_phone`: Customer's phone number (digits only)
4. **Database stores customer data** → Creates session and customer record
5. **Customer redirected to menu** → With session and customer info in URL

### Data Storage

Customer data is stored in the `customers` table with:
- `id`: Unique UUID
- `name`: Customer's full name
- `phone`: Phone number (digits only)
- `table_id`: Table identifier
- `session_code`: Unique session code
- `created_at`: Timestamp when data was collected

## Components

### CustomerContext
- Manages customer state throughout the application
- Provides functions to fetch customer data by session or phone
- Automatically loads customer data from URL parameters

### TerminalEntry
- Updated to pass customer data to the RPC function
- Validates phone number format
- Stores customer data in database when session starts

### CustomerMenu
- Displays customer name in the header
- Uses customer context to show personalized welcome message

### CustomerDataView
- Admin interface to view all customer data
- Search customers by phone number
- Accessible at `/customers` route (requires authentication)

## Usage Examples

### View Customer Data
Navigate to `/customers` in your admin dashboard to see all customer data collected from terminal scans.

### Search Customers by Phone
Use the search functionality in CustomerDataView to find specific customers by phone number.

### Access Customer Data in Components
```typescript
import { useCustomer } from '@/contexts/CustomerContext';

const MyComponent = () => {
  const { customer, getCustomerByPhone } = useCustomer();
  
  // Customer data is automatically available
  console.log(customer?.name, customer?.phone);
  
  // Search for customers by phone
  const searchCustomers = async (phone: string) => {
    const customers = await getCustomerByPhone(phone);
    console.log(customers);
  };
};
```

## Future SMS Integration

The customer phone numbers are stored in a standardized format (digits only) making it easy to integrate with SMS services like:
- Twilio
- AWS SNS
- SendGrid
- Other SMS providers

Example query to get customers for SMS notifications:
```sql
SELECT name, phone, table_id, created_at 
FROM customers 
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

## Security

- Row Level Security (RLS) is enabled on the customers table
- Anonymous users can insert customer data (for terminal scanning)
- Authenticated users can view and update customer data
- Customer data is not exposed in client-side code unless explicitly needed

## Testing

1. **Set up a terminal table** in your admin dashboard
2. **Generate QR code** for the terminal
3. **Scan QR code** with a mobile device
4. **Enter customer information** and start ordering
5. **Check `/customers` page** to verify data was stored
6. **Search by phone number** to test search functionality
