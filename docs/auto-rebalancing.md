# Auto-Rebalancing Mechanism

## Overview

The auto-rebalancing mechanism optimizes liquidity positions when they go out of range, focusing on capital efficiency and minimizing transaction costs. This document explains how the auto-rebalancing system works and how to configure it.

## How It Works

1. **Position Monitoring**: The system continuously monitors the position's price range relative to the current market price.

2. **Out-of-Range Detection**: When a position goes out of range (current price is above or below the position's price range), the system tracks how long it has been out of range.

3. **Rebalancing Decision**: The system decides to rebalance based on:
   - How long the position has been out of range
   - How far the current price is from the position's range (threshold percentage)
   - When the last rebalance occurred (minimum interval)
   - How many rebalances have been performed today (maximum daily limit)

4. **Rebalancing Process**:
   - Collects any accrued fees
   - Removes liquidity from the current position
   - Calculates an optimal new price range centered around the current price
   - Creates a new position with the optimal range
   - Adds liquidity back to the new position

5. **Record Keeping**: Each rebalance operation is recorded in the database for analysis and reporting.

## Configuration Parameters

The auto-rebalancing mechanism can be configured through the following environment variables:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `REBALANCE_ENABLED` | Enable/disable auto-rebalancing (true/false) | `false` |
| `REBALANCE_THRESHOLD_PERCENT` | Percentage threshold for price movement to trigger rebalancing | `5` |
| `MIN_REBALANCE_INTERVAL_MINUTES` | Minimum time between rebalances (minutes) | `60` |
| `POSITION_WIDTH_PERCENT` | Width of the position range as a percentage | `20` |
| `MAX_DAILY_REBALANCES` | Maximum number of rebalances allowed per day | `6` |

## API Endpoints

The following API endpoints are available for monitoring and managing the auto-rebalancing system:

### Get Rebalance History

```
GET /api/rebalance/history?position={positionAddress}&limit={limit}
```

Returns the rebalancing history for a specific position.

### Get Rebalance Metrics

```
GET /api/rebalance/metrics
```

Returns metrics about the rebalancing operations, including success rate, average fees collected, and configuration settings.

### Get Rebalance Status

```
GET /api/rebalance/status
```

Returns the current status of the auto-rebalancing system, including whether it's enabled, the last rebalance time, and how many rebalances have been performed today.

## Command Line Interface

You can manage the auto-rebalancing system using the following commands:

```bash
# Check rebalancing status
bun run src/main.ts rebalance status

# Enable auto-rebalancing
bun run src/main.ts rebalance enable

# Disable auto-rebalancing
bun run src/main.ts rebalance disable
```

## Testing

A test script is available to simulate and test the auto-rebalancing functionality:

```bash
bun run src/scripts/testRebalance.ts
```

This script simulates a position going out of range and tests the auto-rebalancing mechanism.

## Best Practices

1. **Start Conservatively**: Begin with a wider position range (`POSITION_WIDTH_PERCENT`) and a higher threshold (`REBALANCE_THRESHOLD_PERCENT`) to minimize rebalancing frequency.

2. **Monitor Gas Costs**: Rebalancing involves multiple transactions. Monitor the gas costs to ensure they don't outweigh the benefits of being in range.

3. **Adjust Based on Volatility**: For more volatile pairs, increase the position width and threshold. For stable pairs, you can use narrower ranges.

4. **Review Rebalance History**: Regularly review the rebalancing history to optimize your configuration parameters based on actual performance.
