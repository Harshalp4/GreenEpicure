-- Green Epicure Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE (extends Supabase Auth users)
-- ============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  user_type TEXT DEFAULT 'b2c' CHECK (user_type IN ('b2c', 'b2b')),
  business_name TEXT,
  gst_number TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- ADDRESSES TABLE
-- ============================================
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  label TEXT DEFAULT 'Home',
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Addresses policies
CREATE POLICY "Users can manage own addresses" ON addresses
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('dairy', 'grains', 'oils')),
  price DECIMAL(10,2) NOT NULL,
  b2b_price DECIMAL(10,2),
  moq INTEGER DEFAULT 1,
  unit TEXT DEFAULT 'kg',
  image_url TEXT,
  certifications TEXT[] DEFAULT '{}',
  in_stock BOOLEAN DEFAULT TRUE,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Products are publicly readable
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (TRUE);

-- Only admins can modify products
CREATE POLICY "Admins can manage products" ON products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ============================================
-- CART ITEMS TABLE
-- ============================================
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Cart policies
CREATE POLICY "Users can manage own cart" ON cart_items
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  address_id UUID REFERENCES addresses(id),
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('razorpay', 'cod')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  order_status TEXT DEFAULT 'placed' CHECK (order_status IN ('placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Orders policies
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all orders" ON orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ============================================
-- ORDER ITEMS TABLE
-- ============================================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL
);

-- Enable RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Order items policies
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

CREATE POLICY "Admins can view all order items" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ============================================
-- SEED DATA: PRODUCTS
-- ============================================
INSERT INTO products (name, slug, description, category, price, b2b_price, moq, unit, image_url, certifications, in_stock, featured) VALUES
-- A2 Dairy Products
('A2 Gir Cow Milk', 'a2-gir-cow-milk', 'Pure A2 milk from indigenous Gir cows, naturally rich in nutrients and easy to digest.', 'dairy', 80, 70, 1, 'litre', '/assets/images/products/a2-milk.jpg', ARRAY['organic', 'a2'], TRUE, TRUE),
('A2 Gir Cow Ghee', 'a2-gir-cow-ghee', 'Traditional bilona method ghee from A2 Gir cow milk, golden and aromatic.', 'dairy', 2200, 2000, 1, 'kg', '/assets/images/products/a2-ghee.jpg', ARRAY['organic', 'a2', 'fssai'], TRUE, TRUE),
('Fresh Paneer', 'fresh-paneer', 'Soft and fresh paneer made from pure A2 milk, perfect for cooking.', 'dairy', 450, 400, 1, 'kg', '/assets/images/products/paneer.jpg', ARRAY['organic', 'fssai'], TRUE, FALSE),

-- Grains & Staples
('Organic Finger Millet (Ragi)', 'organic-ragi', 'Nutrient-rich finger millet, excellent source of calcium and iron.', 'grains', 120, 100, 5, 'kg', '/assets/images/products/ragi.jpg', ARRAY['organic', 'fssai'], TRUE, TRUE),
('Organic Foxtail Millet', 'organic-foxtail-millet', 'Light and healthy foxtail millet, rich in dietary fiber.', 'grains', 140, 120, 5, 'kg', '/assets/images/products/foxtail-millet.jpg', ARRAY['organic'], TRUE, FALSE),
('Organic Brown Rice', 'organic-brown-rice', 'Unpolished brown rice with bran intact, high in fiber.', 'grains', 110, 95, 5, 'kg', '/assets/images/products/brown-rice.jpg', ARRAY['organic', 'fssai'], TRUE, TRUE),
('Organic Whole Wheat', 'organic-whole-wheat', 'Stone-ground whole wheat flour, preserving natural nutrients.', 'grains', 65, 55, 5, 'kg', '/assets/images/products/wheat.jpg', ARRAY['organic'], TRUE, FALSE),

-- Oils & More
('Cold Pressed Coconut Oil', 'cold-pressed-coconut-oil', 'Virgin coconut oil extracted without heat, retaining natural benefits.', 'oils', 550, 480, 1, 'litre', '/assets/images/products/coconut-oil.jpg', ARRAY['organic', 'cold-pressed'], TRUE, TRUE),
('Cold Pressed Groundnut Oil', 'cold-pressed-groundnut-oil', 'Traditional wood-pressed groundnut oil, rich and flavorful.', 'oils', 380, 340, 1, 'litre', '/assets/images/products/groundnut-oil.jpg', ARRAY['organic', 'cold-pressed'], TRUE, FALSE),
('Organic Jaggery', 'organic-jaggery', 'Unrefined cane jaggery, natural sweetener with minerals.', 'oils', 120, 100, 1, 'kg', '/assets/images/products/jaggery.jpg', ARRAY['organic'], TRUE, TRUE),
('Wild Forest Honey', 'wild-forest-honey', 'Raw, unprocessed honey from wild bee colonies in forests.', 'oils', 650, 580, 1, 'kg', '/assets/images/products/honey.jpg', ARRAY['organic', 'raw'], TRUE, FALSE);

-- ============================================
-- CREATE ADMIN USER (run after first signup)
-- ============================================
-- UPDATE profiles SET is_admin = TRUE WHERE email = 'admin@greenepicure.com';

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_featured ON products(featured);
CREATE INDEX idx_products_in_stock ON products(in_stock);
CREATE INDEX idx_cart_items_user ON cart_items(user_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ============================================
-- STORAGE BUCKET FOR PRODUCT IMAGES
-- ============================================
-- Run this in Supabase Dashboard -> Storage -> Create Bucket
-- Bucket name: products
-- Public: Yes (for product images to be publicly accessible)

-- Storage policies (run in SQL Editor)
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view product images
CREATE POLICY "Public read access for product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

-- Allow admins to upload/delete product images
CREATE POLICY "Admin upload access for product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'products'
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

CREATE POLICY "Admin delete access for product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'products'
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
