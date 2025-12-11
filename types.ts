
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
  gap?: number; // Legacy simple gap
  // Precise layout control for standard labels (e.g., Pimaco)
  marginTop?: number;
  marginLeft?: number;
  gapX?: number; // Horizontal space between labels
  gapY?: number; // Vertical space between labels
  width?: number; // Specific label width
  height?: number; // Specific label height
  cornerRadius?: number; // Radius for rounded corners (PDF & Preview)
  formatName?: string; // To display in UI
  showOutlines?: boolean; // Toggle borders in PDF
}
