
import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';
import { BarcodeItem, LayoutConfig } from '../types';

// Internal function to create the PDF document object
const createPDFDoc = (items: BarcodeItem[], layout: LayoutConfig): jsPDF => {
  // A4 size in mm
  const PAGE_WIDTH = 210;
  const PAGE_HEIGHT = 297;
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  if (items.length === 0) {
      doc.text("Nenhum item para exibir.", 105, 148, { align: "center" });
      return doc;
  }

  const { rows, columns, showOutlines } = layout;
  const itemsPerPage = rows * columns;

  // Standardize values (fallback to 0 if undefined)
  const ml = layout.marginLeft || 0;
  const mt = layout.marginTop || 0;
  const gapX = layout.gapX || 0;
  const gapY = layout.gapY || 0;
  
  // Calculate cell dimensions if dynamic
  let cellWidth = layout.width || ((PAGE_WIDTH - ml * 2) / columns); // Simple fallback logic if width missing
  if (layout.width) cellWidth = layout.width;
  else if (layout.marginLeft) cellWidth = (PAGE_WIDTH - (ml * 2) - (gapX * (columns - 1))) / columns;
  else cellWidth = PAGE_WIDTH / columns;

  let cellHeight = layout.height || (PAGE_HEIGHT / rows);

  items.forEach((item, index) => {
    // Add new page if necessary
    if (index > 0 && index % itemsPerPage === 0) {
      doc.addPage();
    }

    // Calculate Grid Position
    const positionInPage = index % itemsPerPage;
    const colIndex = positionInPage % columns;
    const rowIndex = Math.floor(positionInPage / columns);

    // Exact Position Calculation
    const xPos = ml + (colIndex * (cellWidth + gapX));
    const yPos = mt + (rowIndex * (cellHeight + gapY));

    // Center of the cell
    const centerX = xPos + (cellWidth / 2);

    // --- Borders / Outlines (Toggleable) ---
    if (showOutlines) {
      doc.setDrawColor(150); // Gray
      doc.setLineWidth(0.1);
      if (layout.cornerRadius) {
          const radiusMM = 2; 
          doc.roundedRect(xPos, yPos, cellWidth, cellHeight, radiusMM, radiusMM, 'S');
      } else {
          doc.rect(xPos, yPos, cellWidth, cellHeight);
      }
    }

    // --- Barcode Generation ---
    const safeMargin = 2; 
    const maxBarcodeWidth = cellWidth - (safeMargin * 2);
    // Barcode takes up roughly 40-50% of height, but capped
    const maxBarcodeHeight = Math.min(cellHeight * 0.45, 20); 

    const canvas = document.createElement('canvas');
    try {
      JsBarcode(canvas, item.gtin, {
        format: item.type === 'GTIN-14' ? "ITF14" : "EAN13",
        width: 4, 
        height: 100,
        displayValue: true,
        font: "Helvetica",
        fontOptions: "bold",
        fontSize: 14,
        textMargin: 2,
        margin: 0
      });

      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const imgProps = doc.getImageProperties(imgData);
      
      // Calculate final PDF dimensions maintaining aspect ratio
      let pdfImgWidth = maxBarcodeWidth;
      let pdfImgHeight = (imgProps.height * pdfImgWidth) / imgProps.width;

      if (pdfImgHeight > maxBarcodeHeight) {
          pdfImgHeight = maxBarcodeHeight;
          pdfImgWidth = (imgProps.width * pdfImgHeight) / imgProps.height;
      }

      // Position: Anchor to bottom area
      const barcodeY = yPos + cellHeight - pdfImgHeight - 3; 

      doc.addImage(imgData, 'JPEG', centerX - (pdfImgWidth / 2), barcodeY, pdfImgWidth, pdfImgHeight);

      // --- Text Generation ---
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      
      const topBoundary = yPos + 3;
      const bottomBoundary = barcodeY - 1;
      const maxAvailableHeight = bottomBoundary - topBoundary;
      const maxTextWidth = cellWidth - 4;
      
      if (maxAvailableHeight > 3) {
        let fontSize = 16;
        const minFontSize = 5;
        let splitText: string[] = [];
        let lineHeight = 0;
        let fits = false;

        while (fontSize >= minFontSize) {
           doc.setFontSize(fontSize);
           splitText = doc.splitTextToSize(item.description, maxTextWidth);
           const singleLineHeight = fontSize * 0.3527 * 1.15; 
           const totalTextHeight = splitText.length * singleLineHeight;

           if (totalTextHeight <= maxAvailableHeight) {
             lineHeight = singleLineHeight;
             fits = true;
             break;
           }
           fontSize -= 0.5;
        }

        if (!fits) {
            doc.setFontSize(minFontSize);
            splitText = doc.splitTextToSize(item.description, maxTextWidth);
            lineHeight = minFontSize * 0.3527 * 1.15;
        }

        const totalBlockHeight = splitText.length * lineHeight;
        const textStartY = topBoundary + ((maxAvailableHeight - totalBlockHeight) / 2) + lineHeight - (lineHeight * 0.25);

        splitText.forEach((line, i) => {
            doc.text(line, centerX, textStartY + (i * lineHeight), { align: 'center' });
        });
      }

    } catch (error) {
      console.error("Error generating barcode", error);
    }
  });

  return doc;
};

// Generates and Downloads the PDF
export const generatePDF = (items: BarcodeItem[], layout: LayoutConfig) => {
  const doc = createPDFDoc(items, layout);
  
  const filename = layout.formatName 
    ? `etiquetas-${layout.formatName.toLowerCase().replace(/\s/g, '-')}.pdf`
    : `etiquetas-${items[0]?.type || 'barcode'}.pdf`;

  doc.save(filename);
};
