-- Initial Seed Data for The Royal Palette InsForge Database

-- Categories
INSERT INTO categories (id, name, slug, description, icon_name, sort_order) VALUES
('cat-1', 'Chef''s Royal Signatures', 'signatures', 'Mastercrafted culinary masterpieces infused with rare saffron & spices', 'Crown', 1),
('cat-2', 'Kacchi & Biryani Heritage', 'biryani', 'Dum-cooked aromatic basmati rice layered with tender marinated meats', 'Flame', 2),
('cat-3', 'Royal Kebabs & Grills', 'kebabs', 'Charcoal-smoked tender cuts marinated in royal Mughal aromatics', 'UtensilsCrossed', 3),
('cat-4', 'Nawabi Curries & Gravies', 'curries', 'Slow-simmered rich cashew and cream infused gravies', 'Soup', 4),
('cat-5', 'Tandoori Breads & Rice', 'breads-rice', 'Fresh clay-oven baked naans, parathas, and zafrani polao', 'Wheat', 5),
('cat-6', 'Royal Starters & Salads', 'starters', 'Crisp, refreshing appetizers to ignite your royal banquet', 'Sparkles', 6),
('cat-7', 'Elixirs & Gourmet Mocktails', 'beverages', 'Artisanal refreshments, saffron coolers, and royal blends', 'GlassWater', 7),
('cat-8', 'Sweet Extravaganza', 'desserts', 'Exquisite desserts crowned with edible silver and pistachio', 'CakeSlice', 8)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- Dining Tables
INSERT INTO dining_tables (id, table_number, capacity, section, status) VALUES
('tbl-1', 'T-01', 2, 'INDOOR', 'AVAILABLE'),
('tbl-2', 'T-02', 4, 'INDOOR', 'OCCUPIED'),
('tbl-3', 'T-03', 4, 'INDOOR', 'AVAILABLE'),
('tbl-4', 'T-04', 6, 'INDOOR', 'BILLING'),
('tbl-5', 'VIP-01', 8, 'VIP_ROYAL', 'RESERVED'),
('tbl-6', 'VIP-02', 12, 'VIP_ROYAL', 'AVAILABLE'),
('tbl-7', 'TR-01', 4, 'TERRACE', 'AVAILABLE'),
('tbl-8', 'TR-02', 4, 'TERRACE', 'OCCUPIED'),
('tbl-9', 'GDN-01', 6, 'GARDEN', 'AVAILABLE'),
('tbl-10', 'GDN-02', 6, 'GARDEN', 'AVAILABLE')
ON CONFLICT (id) DO UPDATE SET table_number = EXCLUDED.table_number, capacity = EXCLUDED.capacity;

-- Customers (VIP Members)
INSERT INTO customers (id, name, phone, email, tier, points_balance, total_spent, visit_count, notes) VALUES
('cust-1', 'Farhan Rahman', '01711223344', 'farhan.r@gmail.com', 'ROYAL', 1250, 92400.00, 28, 'Prefers VIP-01, allergic to shellfish. VIP Guest.'),
('cust-2', 'Nusrat Jahan', '01819876543', 'nusrat.jahan@hotmail.com', 'GOLD', 580, 42000.00, 14, 'Loves Shahi Tukda and extra spicy grill.'),
('cust-3', 'Tanvir Ahmed', '01912345678', 'tanvir.ahmed@yahoo.com', 'SILVER', 240, 16500.00, 6, NULL),
('cust-4', 'Sadia Islam', '01678123456', 'sadia.islam@gmail.com', 'BRONZE', 85, 4800.00, 2, NULL)
ON CONFLICT (id) DO UPDATE SET points_balance = EXCLUDED.points_balance, total_spent = EXCLUDED.total_spent;

-- Products
INSERT INTO products (id, name, bangla_name, description, category_id, price, cost_price, image_url, dietary_tags, preparation_time_minutes, sort_order) VALUES
('prod-1', 'Grand Shahi Mutton Kacchi', 'গ্র্যান্ড শাহী খাসির কাচ্চি', 'Aged basmati rice, tender young mutton chops slow dum-cooked with saffron, aloo bukhara, and mawa.', 'cat-2', 680.00, 380.00, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80', '["CHEF_SPECIAL", "POPULAR", "HALAL"]'::jsonb, 15, 1),
('prod-2', 'Saffron Grilled King Prawns Platter', 'জাফরানি গ্রিলড গলদা চিংড়ি', 'Jumbo bay of Bengal king prawns brushed with saffron garlic butter and charred over live charcoal.', 'cat-1', 1450.00, 750.00, 'https://images.unsplash.com/photo-1559742811-822873691df8?w=800&auto=format&fit=crop&q=80', '["CHEF_SPECIAL", "HALAL", "GLUTEN_FREE"]'::jsonb, 20, 2),
('prod-3', 'Nawabi Mutton Rezala', 'নওয়াবি মাটন রেজালা', 'Classic Dhaka Mughal curry made with white cashew paste, poppy seeds, mawa, and subtle kewra water aroma.', 'cat-4', 620.00, 340.00, 'https://images.unsplash.com/photo-1545247181-516773cae7be?w=800&auto=format&fit=crop&q=80', '["HALAL", "POPULAR"]'::jsonb, 12, 3),
('prod-4', 'Smoked Reshmi Malai Tikka', 'রেশমি মালাই টিক্কা', 'Boneless chicken breast soaked in hung curd, green cardamom, cheese, and melted cream, charcoal smoked.', 'cat-3', 520.00, 260.00, 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=80', '["HALAL", "POPULAR"]'::jsonb, 18, 4),
('prod-5', 'The Royal Palette Signature Platter', 'রয়্যাল প্যালেট সিগনেচার প্ল্যাটার', 'Grand assortment of Reshmi Tikka, Galawati Kebab, Zafrani Jheenga, Mutton Seekh, Butter Naan, and signature dips.', 'cat-1', 2450.00, 1250.00, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&auto=format&fit=crop&q=80', '["CHEF_SPECIAL", "HALAL"]'::jsonb, 25, 5),
('prod-6', 'Zafrani Butter Chicken', 'জাফরানি বাটার চিকেন', 'Tandoori roasted chicken pieces simmered in a velvety tomato-fenugreek gravy finished with pure butter.', 'cat-4', 580.00, 280.00, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&auto=format&fit=crop&q=80', '["HALAL", "POPULAR"]'::jsonb, 15, 6),
('prod-7', 'Truffle Garlic Butter Naan', 'ট্রাফেল গার্লিক বাটার নান', 'Hand-stretched dough cooked in clay tandoor, brushed with white truffle oil, roasted garlic, and butter.', 'cat-5', 180.00, 50.00, 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=800&auto=format&fit=crop&q=80', '["VEGETARIAN", "HALAL"]'::jsonb, 8, 7),
('prod-8', 'Zafrani Basmati Polao', 'জাফরানি বাসমতী পোলাও', 'Extra-long grain basmati scented with whole spices, Kashmiri saffron, fried golden onions, and toasted cashews.', 'cat-5', 320.00, 110.00, 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&auto=format&fit=crop&q=80', '["VEGETARIAN", "HALAL", "GLUTEN_FREE"]'::jsonb, 10, 8),
('prod-9', 'Crispy Calamari with Naga Tartar', 'ক্রিস্পি কালামারি উইথ নাগা টারটার', 'Tender squid rings coated in spiced batter, flash fried, served with hot Naga chili infused tartar dip.', 'cat-6', 490.00, 220.00, 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=80', '["HALAL", "SPICY"]'::jsonb, 12, 9),
('prod-10', 'Royal Blue Lagoon Mocktail', 'রয়্যাল ব্লু লেগুন মকটেল', 'Blue curacao extract with fresh lemon juice, sparkling tonic, mint sprigs, and edible gold shimmer dust.', 'cat-7', 290.00, 75.00, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80', '["VEGETARIAN", "VEGAN", "GLUTEN_FREE", "POPULAR"]'::jsonb, 5, 10),
('prod-11', 'Traditional Saffron Borhani', 'ঐতিহ্যবাহী জাফরানি বোরহানি', 'Creamy spiced yogurt drink blended with mint, coriander, roasted cumin, black pepper, and saffron.', 'cat-7', 180.00, 60.00, 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=800&auto=format&fit=crop&q=80', '["VEGETARIAN", "HALAL", "POPULAR"]'::jsonb, 3, 11),
('prod-12', '24K Gold Crown Shahi Tukda', '২৪ ক্যারেট গোল্ড শাহী টুকরা', 'Crispy ghee-fried brioche soaked in saffron syrup, layered with thick rabri, pistachios, and pure edible 24K gold leaf.', 'cat-8', 450.00, 180.00, 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=800&auto=format&fit=crop&q=80', '["CHEF_SPECIAL", "VEGETARIAN", "HALAL"]'::jsonb, 10, 12)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;

-- Global System Settings
INSERT INTO system_settings (id, restaurant_name, tagline, currency, currency_code, address, phone, bin_number, vat_percent, service_charge_percent)
VALUES ('GLOBAL_CONFIG', 'The Royal Palette', 'A Symphony of Royal Flavors & Contemporary Elegance', '৳', 'BDT', 'Plot 42, Road 11, Block D, Gulshan-2, Dhaka 1212', '+880 1711-234567', 'BIN-002938471-0102', 5.00, 5.00)
ON CONFLICT (id) DO UPDATE SET restaurant_name = EXCLUDED.restaurant_name;
