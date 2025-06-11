-- Create tables for CarShop in Supabase

-- Create Brands table
CREATE TABLE IF NOT EXISTS "Brands" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  country VARCHAR(255),
  "foundedYear" INTEGER,
  logo VARCHAR(255),
  description TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Users table
CREATE TABLE IF NOT EXISTS "Users" (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(5) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  "lastLogin" TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Cars table
CREATE TABLE IF NOT EXISTS "Cars" (
  id SERIAL PRIMARY KEY,
  make VARCHAR(255),
  model VARCHAR(255) NOT NULL,
  year INTEGER NOT NULL,
  keywords VARCHAR(255),
  description TEXT,
  "fuelType" VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  img TEXT,
  "imgType" VARCHAR(255) DEFAULT 'image/jpeg',
  "brandId" INTEGER REFERENCES "Brands"(id),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create MonitoredUsers table
CREATE TABLE IF NOT EXISTS "MonitoredUsers" (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "Users"(id),
  "lastActive" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create UserLogs table
CREATE TABLE IF NOT EXISTS "UserLogs" (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "Users"(id),
  action VARCHAR(255),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  details TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cars_brandid ON "Cars"("brandId");
CREATE INDEX IF NOT EXISTS idx_cars_year ON "Cars"(year);
CREATE INDEX IF NOT EXISTS idx_userlogs_userid ON "UserLogs"("userId");
CREATE INDEX IF NOT EXISTS idx_monitoredusers_userid ON "MonitoredUsers"("userId");

-- Add trigger to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables
CREATE TRIGGER update_brands_modtime
    BEFORE UPDATE ON "Brands"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_modtime
    BEFORE UPDATE ON "Users"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cars_modtime
    BEFORE UPDATE ON "Cars"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monitoredusers_modtime
    BEFORE UPDATE ON "MonitoredUsers"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
