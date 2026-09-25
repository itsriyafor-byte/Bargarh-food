-- ==============================================================================
-- Bargarh Food - Supabase PostgreSQL Schema & Row Level Security (RLS)
-- Location: Bargarh City, Odisha, India
-- Business Model: Local food marketplace with individual restaurant fulfillment (COD only)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'owner', 'customer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. RESTAURANTS
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- 'Biryani', 'Fast Food', 'Indian Food', 'Tiffin', 'Chinese', 'Momo', 'Sweets', 'Cafe', 'Pizza'
    address TEXT NOT NULL, -- e.g. 'Main Road, Near Bhatli Chowk, Bargarh'
    phone TEXT NOT NULL,
    city_id TEXT NOT NULL DEFAULT 'bargarh_city',
    cover_image_url TEXT,
    logo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE, -- Admin approval / toggle
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    delivery_available BOOLEAN NOT NULL DEFAULT TRUE,
    pickup_available BOOLEAN NOT NULL DEFAULT TRUE,
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 30.00,
    min_order_amount NUMERIC(10, 2) NOT NULL DEFAULT 100.00,
    opening_hours TEXT NOT NULL DEFAULT '10:00 AM - 10:30 PM',
    commission_percentage NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. RESTAURANT OWNERS (Junction table linking auth profile to assigned restaurant)
CREATE TABLE IF NOT EXISTS public.restaurant_owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_restaurant_owner UNIQUE (restaurant_id, user_id)
);

-- 4. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    icon TEXT,
    display_order INT NOT NULL DEFAULT 0
);

-- 5. MENU ITEMS (Food items per restaurant)
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category_name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    is_veg BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. ORDERS (Guest customer orders - COD only)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY, -- Human-readable Order ID e.g., 'BF-10948'
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_address TEXT NOT NULL, -- Delivery location in Bargarh
    delivery_notes TEXT,
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    payment_method TEXT NOT NULL DEFAULT 'CASH_ON_DELIVERY', -- Strictly COD for V1
    order_status TEXT NOT NULL DEFAULT 'NEW' CHECK (order_status IN (
        'NEW',
        'ACCEPTED',
        'PREPARING',
        'READY',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'REJECTED',
        'CANCELLED'
    )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. ORDER ITEMS (Immutable snapshot of purchased item name and price at checkout)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL, -- Frozen name at order time
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0), -- Frozen price at order time
    quantity INT NOT NULL CHECK (quantity > 0),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0)
);

-- 8. AUDIT LOGS (Tracks administrative events)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Get restaurant_id assigned to current authenticated owner
CREATE OR REPLACE FUNCTION public.get_owner_restaurant_ids()
RETURNS TABLE (restaurant_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT ro.restaurant_id
    FROM public.restaurant_owners ro
    WHERE ro.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- PROFILES POLICIES ---
CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_admin() OR auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- --- RESTAURANTS POLICIES ---
-- 1. Public can view only ACTIVE restaurants
CREATE POLICY "Public can view active restaurants"
    ON public.restaurants FOR SELECT
    USING (is_active = TRUE OR public.is_admin() OR id IN (SELECT get_owner_restaurant_ids()));

-- 2. Only Admins can insert/update/delete restaurants
CREATE POLICY "Admins can insert restaurants"
    ON public.restaurants FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update restaurants"
    ON public.restaurants FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete restaurants"
    ON public.restaurants FOR DELETE
    USING (public.is_admin());

-- --- RESTAURANT OWNERS POLICIES ---
CREATE POLICY "Admins have full access to owner assignments"
    ON public.restaurant_owners FOR ALL
    USING (public.is_admin());

CREATE POLICY "Owners can see their own assignment"
    ON public.restaurant_owners FOR SELECT
    USING (user_id = auth.uid());

-- --- CATEGORIES POLICIES ---
CREATE POLICY "Public can view categories"
    ON public.categories FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins manage categories"
    ON public.categories FOR ALL
    USING (public.is_admin());

-- --- MENU ITEMS POLICIES ---
-- 1. Public can view available items of active restaurants
CREATE POLICY "Public can view available menu items"
    ON public.menu_items FOR SELECT
    USING (
        (is_available = TRUE AND EXISTS (
            SELECT 1 FROM public.restaurants r WHERE r.id = menu_items.restaurant_id AND r.is_active = TRUE
        ))
        OR public.is_admin()
        OR restaurant_id IN (SELECT get_owner_restaurant_ids())
    );

-- 2. Restaurant owners can manage ONLY their own restaurant's items
CREATE POLICY "Owners can insert their restaurant menu items"
    ON public.menu_items FOR INSERT
    WITH CHECK (restaurant_id IN (SELECT get_owner_restaurant_ids()) OR public.is_admin());

CREATE POLICY "Owners can update their restaurant menu items"
    ON public.menu_items FOR UPDATE
    USING (restaurant_id IN (SELECT get_owner_restaurant_ids()) OR public.is_admin());

CREATE POLICY "Owners can delete their restaurant menu items"
    ON public.menu_items FOR DELETE
    USING (restaurant_id IN (SELECT get_owner_restaurant_ids()) OR public.is_admin());

-- --- ORDERS POLICIES ---
-- 1. Guest customer can insert a new order
CREATE POLICY "Anyone can place an order"
    ON public.orders FOR INSERT
    WITH CHECK (payment_method = 'CASH_ON_DELIVERY');

-- 2. Guest customer can view their order by Order ID
CREATE POLICY "Public can view order by ID"
    ON public.orders FOR SELECT
    USING (
        TRUE -- Filtered by ID at query level for guest customer lookup
    );

-- 3. Restaurant owners can ONLY view and update orders for their assigned restaurant
CREATE POLICY "Owners can update their restaurant orders"
    ON public.orders FOR UPDATE
    USING (restaurant_id IN (SELECT get_owner_restaurant_ids()) OR public.is_admin());

-- --- ORDER ITEMS POLICIES ---
CREATE POLICY "Anyone can insert order items"
    ON public.order_items FOR INSERT
    WITH CHECK (TRUE);

CREATE POLICY "Public can read order items"
    ON public.order_items FOR SELECT
    USING (TRUE);

-- --- AUDIT LOGS POLICIES ---
CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.is_admin());

CREATE POLICY "System/Admins can insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (public.is_admin() OR auth.uid() IS NOT NULL);

-- ==============================================================================
-- SEED DATA (Bargarh City, Odisha Local Restaurants & Menus)
-- ==============================================================================

INSERT INTO public.categories (name, icon, display_order) VALUES
('Biryani', '🍲', 1),
('Fast Food', '🍔', 2),
('Indian Food', '🍛', 3),
('Tiffin', '🥞', 4),
('Chinese', '🍜', 5),
('Momo', '🥟', 6),
('Sweets', '🍮', 7),
('Pizza', '🍕', 8),
('Cafe', '☕', 9)
ON CONFLICT (name) DO NOTHING;

-- Initial authentic restaurants in Bargarh
INSERT INTO public.restaurants (
    id, name, description, category, address, phone, city_id,
    cover_image_url, logo_url, is_active, is_featured, delivery_available,
    pickup_available, delivery_fee, min_order_amount, opening_hours, commission_percentage
) VALUES
(
    'a1111111-1111-1111-1111-111111111111',
    'Bargarh Biryani Mahal',
    'Famous Dum Biryani, Chicken Tikka, and Kebabs of Bargarh',
    'Biryani',
    'Main Road, Near Gandhi Chowk, Bargarh',
    '+91 94370 12345',
    'bargarh_city',
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800',
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200',
    TRUE, TRUE, TRUE, TRUE, 30.00, 150.00, '11:00 AM - 10:30 PM', 10.00
),
(
    'b2222222-2222-2222-2222-222222222222',
    'Maa Samaleswari Tiffin Stall',
    'Authentic Odia Tiffin, Chakuli Tarkari, Bara, Idli, and Puri Sabji',
    'Tiffin',
    'Canal Avenue, Ward 4, Bargarh',
    '+91 98610 23456',
    'bargarh_city',
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800',
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=200',
    TRUE, TRUE, TRUE, TRUE, 20.00, 80.00, '07:00 AM - 01:00 PM & 04:30 PM - 09:30 PM', 8.00
),
(
    'c3333333-3333-3333-3333-333333333333',
    'Bhatli Chowk Fast Food Corner',
    'Crispy Burgers, Veg & Non-Veg Momos, Rolls, and Hakka Chowmein',
    'Fast Food',
    'Bhatli Chowk, Near Overbridge, Bargarh',
    '+91 70081 34567',
    'bargarh_city',
    'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800',
    'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=200',
    TRUE, FALSE, TRUE, TRUE, 25.00, 100.00, '12:00 PM - 10:00 PM', 10.00
),
(
    'd4444444-4444-4444-4444-444444444444',
    'Radha Krishna Sweets & Chaat',
    'Fresh Rasagola, Chenapoda, Kalakand, Samosa Chaat & Dahi Vada',
    'Sweets',
    'Daily Market Road, Ward 8, Bargarh',
    '+91 99372 45678',
    'bargarh_city',
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800',
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=200',
    TRUE, TRUE, TRUE, TRUE, 20.00, 100.00, '08:00 AM - 10:00 PM', 10.00
)
ON CONFLICT (id) DO NOTHING;

-- Initial menu items
INSERT INTO public.menu_items (
    id, restaurant_id, name, description, category_name, price, image_url, is_available, is_veg
) VALUES
(
    'e1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'Special Chicken Dum Biryani',
    'Slow-cooked fragrant basmati rice with tender spiced chicken pieces and raita',
    'Biryani',
    210.00,
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500',
    TRUE,
    FALSE
),
(
    'e2222222-2222-2222-2222-222222222222',
    'a1111111-1111-1111-1111-111111111111',
    'Hyderabadi Veg Biryani',
    'Aromatic rice infused with fresh garden vegetables, saffron and paneer cubes',
    'Biryani',
    160.00,
    'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500',
    TRUE,
    TRUE
),
(
    'e3333333-3333-3333-3333-333333333333',
    'b2222222-2222-2222-2222-222222222222',
    'Bargarh Special Chakuli & Dalma',
    'Soft fermented rice-lentil pancakes served with piping hot Odia dalma & aloo kasa',
    'Tiffin',
    60.00,
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500',
    TRUE,
    TRUE
),
(
    'e4444444-4444-4444-4444-444444444444',
    'c3333333-3333-3333-3333-333333333333',
    'Steamed Veg Darjeeling Momo (8 Pcs)',
    'Thin wrapper stuffed with minced cabbage, onion and paneer with spicy red chutney',
    'Momo',
    80.00,
    'https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=500',
    TRUE,
    TRUE
),
(
    'e5555555-5555-5555-5555-555555555555',
    'd4444444-4444-4444-4444-444444444444',
    'Authentic Chenapoda (250g)',
    'Traditional Odisha baked cottage cheese dessert caramelized to perfection',
    'Sweets',
    120.00,
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500',
    TRUE,
    TRUE
)
ON CONFLICT (id) DO NOTHING;
