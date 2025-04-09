-- Create extension for TimescaleDB
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Create table for position data
CREATE TABLE IF NOT EXISTS positions (
    id SERIAL PRIMARY KEY,
    position_address TEXT NOT NULL,
    position_mint TEXT NOT NULL,
    whirlpool_address TEXT NOT NULL,
    tick_lower_index INTEGER NOT NULL,
    tick_upper_index INTEGER NOT NULL,
    liquidity NUMERIC NOT NULL,
    fee_owed_a NUMERIC NOT NULL DEFAULT 0,
    fee_owed_b NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL,
    last_updated_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Create table for position monitoring data
CREATE TABLE IF NOT EXISTS position_snapshots (
    position_address TEXT NOT NULL,
    whirlpool_address TEXT NOT NULL,
    tick_current_index INTEGER NOT NULL,
    range_status TEXT NOT NULL,
    liquidity NUMERIC NOT NULL,
    fee_owed_a NUMERIC NOT NULL,
    fee_owed_b NUMERIC NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (position_address, timestamp)
);

-- Create hypertable for position_snapshots
SELECT create_hypertable('position_snapshots', 'timestamp');

-- Create table for wallet balances
CREATE TABLE IF NOT EXISTS wallet_balances (
    wallet_address TEXT NOT NULL,
    sol_balance NUMERIC NOT NULL,
    wsol_balance NUMERIC NOT NULL,
    usdc_balance NUMERIC NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (wallet_address, timestamp)
);

-- Create hypertable for wallet_balances
SELECT create_hypertable('wallet_balances', 'timestamp');

-- Create table for transactions
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    transaction_signature TEXT NOT NULL,
    transaction_type TEXT NOT NULL,
    position_address TEXT,
    amount_a NUMERIC,
    amount_b NUMERIC,
    timestamp TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL,
    details JSONB
);

-- Create index on position_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_positions_address ON positions(position_address);
CREATE INDEX IF NOT EXISTS idx_position_snapshots_address ON position_snapshots(position_address);
CREATE INDEX IF NOT EXISTS idx_transactions_signature ON transactions(transaction_signature);
