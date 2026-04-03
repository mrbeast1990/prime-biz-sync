/**
 * Format stock quantity as "X علبة و Y شريط"
 * Stock is stored in units (strips). units_per_package tells how many strips per box.
 */
export function formatStockDisplay(stockUnits: number, unitsPerPackage: number | null | undefined): string {
  const upp = unitsPerPackage || 1;
  if (upp <= 1) return `${stockUnits}`;
  const boxes = Math.floor(stockUnits / upp);
  const units = stockUnits % upp;
  if (boxes === 0 && units === 0) return '0';
  if (boxes === 0) return `${units} شريط`;
  if (units === 0) return `${boxes} علبة`;
  return `${boxes} علبة و ${units} شريط`;
}

/**
 * Calculate unit price (price per strip) from package price
 */
export function getUnitPrice(salePrice: number, unitsPerPackage: number | null | undefined): number {
  const upp = unitsPerPackage || 1;
  return salePrice / upp;
}
