# Bargarh Food - Local Food Marketplace

Production-ready food ordering marketplace application exclusively for **Bargarh City, Odisha, India**.

## Architecture & Technology Stack
- **Web App**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide Icons
- **Database & Backend**: Supabase PostgreSQL, Supabase Row Level Security (RLS), Supabase Auth, Supabase Storage
- **Deployment**: Vercel-ready with zero-config (`vercel.json`)
- **Android App**: Native Jetpack Compose Android client with zero Firebase/Firestore dependencies, pure local repository & Supabase REST integration.

---

## Business Model
- **Local Marketplace Model**: Customers place food orders directly with local Bargarh restaurants.
- **Restaurant Direct Delivery / Pickup**: Each individual restaurant prepares food and dispatches delivery or prepares pickup.
- **Payment Method**: Strictly **Cash on Delivery (COD)** for Version 1. No online payments required.
- **Price Freeze Guarantee**: When an order is placed, unit price snapshots are permanently stored in `order_items` so that future menu price adjustments never change historical orders.
- **Multi-Tenant Isolation**: Restaurant Owner A can never view or modify Owner B's orders, menu items, or sales. Enforced at PostgreSQL Row Level Security (RLS) level.

---

## Database Setup (Supabase PostgreSQL)
1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase project dashboard.
3. Paste and run the entire script from `/supabase/schema.sql`.
   - Sets up all relational tables (`profiles`, `restaurants`, `restaurant_owners`, `categories`, `menu_items`, `orders`, `order_items`, `audit_logs`).
   - Configures comprehensive **Row Level Security (RLS)** policies.
   - Populates initial Bargarh restaurants (*Bargarh Biryani Mahal, Maa Samaleswari Tiffin Stall, Bhatli Chowk Fast Food Corner, Radha Krishna Sweets*).

---

## Deploy to Vercel
1. Import the repository into [Vercel](https://vercel.com).
2. Set Root Directory to `web` (or leave at root with `cd web`).
3. Add the following Environment Variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL (`https://xyz.supabase.co`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon public key
4. Click **Deploy**.
