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

-- Create table for rebalance history
CREATE TABLE IF NOT EXISTS rebalance_history (
    id SERIAL PRIMARY KEY,
    position_address TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    success BOOLEAN NOT NULL,
    transaction_ids TEXT[] NOT NULL,
    old_range JSONB NOT NULL,
    new_range JSONB NOT NULL,
    price_at_rebalance NUMERIC NOT NULL,
    fees_collected NUMERIC NOT NULL DEFAULT 0,
    impermanent_loss NUMERIC,
    details JSONB
);

-- Create hypertable for rebalance_history
SELECT create_hypertable('rebalance_history', 'timestamp');

-- Create index on position_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_positions_address ON positions(position_address);
CREATE INDEX IF NOT EXISTS idx_position_snapshots_address ON position_snapshots(position_address);
CREATE INDEX IF NOT EXISTS idx_transactions_signature ON transactions(transaction_signature);
CREATE INDEX IF NOT EXISTS idx_rebalance_history_address ON rebalance_history(position_address);
