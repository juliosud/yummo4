# Yummo4 - Restaurant Management System

A modern restaurant management system built with React, TypeScript, and Supabase. Features include QR code ordering, real-time order management, AI-powered menu insights, and customer analytics.

## Features

- 🍽️ **QR Code Ordering** - Customers scan QR codes to access digital menus
- 📱 **Mobile-First Design** - Optimized for both customers and staff
- 🤖 **AI Menu Analysis** - Intelligent recommendations and nutritional insights
- 📊 **Real-time Analytics** - Order tracking and customer insights
- 🏪 **Multi-tenant** - Support for multiple restaurants
- 💳 **Cart Management** - Session-based shopping cart
- 📋 **Order Management** - Kitchen dashboard for order processing

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, Radix UI, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Deployment**: Vercel

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Vercel account (for deployment)

### Local Development

1. **Clone and install dependencies**
   ```bash
   git clone <your-repo>
   cd yummo4
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

### Production Deployment to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Connect your GitHub repo to Vercel
   - Set environment variables in Vercel dashboard
   - Deploy automatically on push

## Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Database Setup

Run the SQL files in `src/lib/` in your Supabase SQL editor:
1. `database-setup.sql` - Core tables and functions
2. `customer-setup-clean.sql` - Customer management
3. `multi-tenancy-setup.sql` - Restaurant isolation

## Project Structure

```
src/
├── components/          # React components
├── contexts/           # React contexts for state management
├── hooks/              # Custom React hooks
├── lib/                # Utilities and database setup
├── pages/              # Page components
└── supabase/           # Supabase edge functions
```

## Key Components

- **CustomerMenu** - QR code menu interface
- **AdminOrderContext** - Order management for staff
- **AIInsightsChat** - AI-powered menu recommendations
- **SessionGuard** - Session validation and routing
