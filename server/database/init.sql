-- Create schema "expenses_tracker" if it doesn't exist
CREATE SCHEMA IF NOT EXISTS "expenses_tracker";

-- Set search path to use the "expenses_tracker" schema
SET search_path TO "expenses_tracker", public;

-- Create users table
CREATE TABLE IF NOT EXISTS "expenses_tracker".users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    full_name VARCHAR(100),
    profile_image_url VARCHAR(255),
    subscription_tier VARCHAR(50) DEFAULT 'free',
    public_key TEXT,
    is_online BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    last_seen_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create accounts table
CREATE TABLE IF NOT EXISTS "expenses_tracker".accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL
        CHECK (type IN ('cash', 'bank', 'card', 'other')),
    opening_balance DECIMAL(10, 2) DEFAULT 0,
    opening_balance_date DATE,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_account_user FOREIGN KEY (user_id) 
        REFERENCES "expenses_tracker".users(id) 
        ON DELETE CASCADE
);

-- Create categories table
CREATE TABLE IF NOT EXISTS "expenses_tracker".categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(7) DEFAULT '#6366f1',
    user_id INTEGER NOT NULL,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_category_user FOREIGN KEY (user_id) 
        REFERENCES "expenses_tracker".users(id) 
        ON DELETE CASCADE
);

-- Create transactions table (replaces expenses)
CREATE TABLE IF NOT EXISTS "expenses_tracker".transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount DECIMAL(10, 2) NOT NULL,
    description VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    transaction_type VARCHAR(10) NOT NULL
        CHECK (transaction_type IN ('debit', 'credit')),
    account_id UUID NOT NULL,
    category_id UUID,
    user_id INTEGER NOT NULL,
    payment_method VARCHAR(20) DEFAULT 'Cash' 
        CHECK (payment_method IN ('Cash', 'Card', 'UPI', 'Other')),
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transaction_user FOREIGN KEY (user_id) 
        REFERENCES "expenses_tracker".users(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_transaction_account FOREIGN KEY (account_id) 
        REFERENCES "expenses_tracker".accounts(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_transaction_category FOREIGN KEY (category_id) 
        REFERENCES "expenses_tracker".categories(id) 
        ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON "expenses_tracker".users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON "expenses_tracker".users(username);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON "expenses_tracker".accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_is_deleted ON "expenses_tracker".accounts(user_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON "expenses_tracker".categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_deleted ON "expenses_tracker".categories(user_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON "expenses_tracker".transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON "expenses_tracker".transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON "expenses_tracker".transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON "expenses_tracker".transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON "expenses_tracker".transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_account_date ON "expenses_tracker".transactions(account_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON "expenses_tracker".transactions(user_id, transaction_type, is_deleted);
CREATE INDEX IF NOT EXISTS idx_transactions_is_deleted ON "expenses_tracker".transactions(user_id, is_deleted);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION "expenses_tracker".update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON "expenses_tracker".users
    FOR EACH ROW
    EXECUTE FUNCTION "expenses_tracker".update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at
    BEFORE UPDATE ON "expenses_tracker".accounts
    FOR EACH ROW
    EXECUTE FUNCTION "expenses_tracker".update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON "expenses_tracker".categories
    FOR EACH ROW
    EXECUTE FUNCTION "expenses_tracker".update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON "expenses_tracker".transactions
    FOR EACH ROW
    EXECUTE FUNCTION "expenses_tracker".update_updated_at_column();

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON SCHEMA "expenses_tracker" TO your_user;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA "expenses_tracker" TO your_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA "expenses_tracker" TO your_user;

