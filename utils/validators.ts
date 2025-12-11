import { BarcodeType } from '../types';

export const validateBarcode = (code: string, type: BarcodeType): boolean => {
  const length = type === 'GTIN-13' ? 13 : 14;
  
  // Check length
  const regex = new RegExp(`^\\d{${length}}$`);
  if (!regex.test(code)) {
    return false;
  }

  // Checksum calculation
  const digits = code.split('').map(Number);
  const checkDigit = digits.pop(); // Remove the last digit
  
  if (checkDigit === undefined) return false;

  const sum = digits.reduce((acc, digit, index) => {
    let weight;
    if (type === 'GTIN-13') {
      // GTIN-13 (12 payload digits)
      // Positions (from right, 1-based): 2 (Even), 3 (Odd)...
      // In 0-based index array of 12 items:
      // Index 0 (12th from right): Even parity -> weight 1
      // Index 1 (11th from right): Odd parity -> weight 3
      weight = index % 2 === 0 ? 1 : 3;
    } else {
      // GTIN-14 (13 payload digits)
      // In 0-based index array of 13 items:
      // Index 0 (13th from right): Odd parity -> weight 3
      // Index 1 (12th from right): Even parity -> weight 1
      weight = index % 2 === 0 ? 3 : 1;
    }
    return acc + digit * weight;
  }, 0);

  const nearestTen = Math.ceil(sum / 10) * 10;
  const calculatedCheckDigit = nearestTen - sum;

  return calculatedCheckDigit === checkDigit;
};