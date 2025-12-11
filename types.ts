export type BarcodeType = 'GTIN-13' | 'GTIN-14';

export interface BarcodeItem {
  id: string;
  description: string;
  gtin: string;
  type: BarcodeType;
}

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export interface LayoutConfig {
  columns: number;
  rows: number;
  gap: number; // in mm
}