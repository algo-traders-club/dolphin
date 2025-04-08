/**
 * Utilities for working with liquidity positions
 */

/**
 * Position range status enum
 */
export enum PositionRangeStatus {
  IN_RANGE = 'IN_RANGE',
  ABOVE_RANGE = 'ABOVE_RANGE',
  BELOW_RANGE = 'BELOW_RANGE'
}

/**
 * Check if the current pool price (represented by tickCurrentIndex) is within
 * the position's range (tickLowerIndex, tickUpperIndex)
 * 
 * @param currentTick The current tick index of the pool
 * @param lowerTick The lower tick index of the position
 * @param upperTick The upper tick index of the position
 * @returns The position's range status
 */
export function checkPositionRangeStatus(
  currentTick: number,
  lowerTick: number,
  upperTick: number
): PositionRangeStatus {
  if (currentTick < lowerTick) {
    return PositionRangeStatus.BELOW_RANGE;
  } else if (currentTick >= upperTick) {
    return PositionRangeStatus.ABOVE_RANGE;
  } else {
    return PositionRangeStatus.IN_RANGE;
  }
}

/**
 * Format fees to human-readable values
 * 
 * @param feeAmount The fee amount in raw units
 * @param decimals The number of decimals for the token
 * @returns The formatted fee amount
 */
export function formatFeeAmount(feeAmount: string, decimals: number): string {
  const amountBigInt = BigInt(feeAmount);
  const divisor = BigInt(10) ** BigInt(decimals);
  const wholePart = amountBigInt / divisor;
  const fractionalPart = amountBigInt % divisor;
  
  // Format the fractional part to have leading zeros
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  
  // Trim trailing zeros
  const trimmedFractional = fractionalStr.replace(/0+$/, '');
  
  if (trimmedFractional.length === 0) {
    return wholePart.toString();
  }
  
  return `${wholePart}.${trimmedFractional}`;
}
