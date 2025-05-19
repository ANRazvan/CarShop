-- SQL script to drop all custom indices from the CarShop database
-- Run this directly in your PostgreSQL client or using psql

-- Drop indices on Cars table
DROP INDEX IF EXISTS idx_cars_brand_id;
DROP INDEX IF EXISTS idx_cars_fuel_type;
DROP INDEX IF EXISTS idx_cars_year;
DROP INDEX IF EXISTS idx_cars_price;
DROP INDEX IF EXISTS idx_cars_make;
DROP INDEX IF EXISTS idx_cars_keywords;
DROP INDEX IF EXISTS idx_cars_brand_fuel_price;
DROP INDEX IF EXISTS idx_cars_make_model;
DROP INDEX IF EXISTS idx_cars_year_price;

-- Drop indices on Brands table
DROP INDEX IF EXISTS idx_brands_name;
DROP INDEX IF EXISTS idx_brands_country;

-- You can verify remaining indices with:
-- SELECT indexname, tablename, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;
