/** Rounds a USD amount to whole cents for display totals. */
export const roundCents = (amount: number): number => Math.round(amount * 100) / 100
