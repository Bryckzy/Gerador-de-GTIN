import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';
import { BarcodeItem, LayoutConfig } from '../types';

export const generatePDF = (items: BarcodeItem[], layout: LayoutConfig) => {
  if (items.length === 0) return;

  // A4 size in mm
  const PAGE_WIDTH = 210;
  const PAGE_HEIGHT = 297;
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const { rows, columns } = layout;
  const itemsPerPage = rows * columns;
  const cellWidth = PAGE_WIDTH / columns;
  const cellHeight = PAGE_HEIGHT / rows;

  items.forEach((item, index) => {
    // Add new page if necessary
    if (index > 0 && index % itemsPerPage === 0) {
      doc.addPage();
    }

    // Calculate Grid Position
    const positionInPage = index % itemsPerPage;
    const colIndex = positionInPage % columns;
    const rowIndex = Math.floor(positionInPage / columns);

    const xPos = colIndex * cellWidth;
    const yPos = rowIndex * cellHeight;

    // Center of the cell
    const centerX = xPos + (cellWidth / 2);
    const centerY = yPos + (cellHeight / 2);

    // Dynamic sizing based on cell size
    const maxBarcodeWidth = Math.min(cellWidth * 0.8, 60); 
    const barcodeHeight = Math.min(cellHeight * 0.35, 25); 

    const canvas = document.createElement('canvas');
    try {
      JsBarcode(canvas, item.gtin, {
        format: item.type === 'GTIN-14' ? "ITF14" : "EAN13",
        width: 2,
        height: 50,
        displayValue: true,
        font: "Helvetica",
        fontSize: 16,
        margin: 0
      });

      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const imgProps = doc.getImageProperties(imgData);
      
      const pdfImgWidth = maxBarcodeWidth;
      const pdfImgHeight = (imgProps.height * pdfImgWidth) / imgProps.width;

      // Position: Place barcode slightly below absolute center, leaving room on top
      const barcodeY = centerY - (pdfImgHeight / 2) + 5; 

      doc.addImage(imgData, 'JPEG', centerX - (pdfImgWidth / 2), barcodeY, pdfImgWidth, pdfImgHeight);

      // --- Smart Text Sizing & Positioning ---
      
      doc.setFont("helvetica", "bold");
      
      // Boundaries for text
      // We define a safe area starting 2mm from top of cell and ending 1mm above the barcode
      const topBoundary = yPos + 2; 
      const bottomBoundary = barcodeY - 1;
      const maxAvailableHeight = bottomBoundary - topBoundary;
      
      // If cell is extremely small, available height might be tiny. Handle gracefully.
      if (maxAvailableHeight > 2) {
        const maxTextWidth = cellWidth * 0.92; // Use 92% of cell width
        let fontSize = Math.min(14, (cellWidth / 4)); // Start larger
        const minFontSize = 6;
        
        let splitText: string[] = [];
        let finalOneLineHeight = 0;
        
        // Loop: Reduce font size until text fits in the available vertical space
        while (fontSize >= minFontSize) {
          doc.setFontSize(fontSize);
          splitText = doc.splitTextToSize(item.description, maxTextWidth);
          
          const lineHeightFactor = 1.15;
          const oneLineHeight = fontSize * 0.3527 * lineHeightFactor; // convert pt to mm
          const totalTextHeight = splitText.length * oneLineHeight;

          if (totalTextHeight <= maxAvailableHeight) {
            finalOneLineHeight = oneLineHeight;
            break;
          }
          
          fontSize -= 0.5;
        }

        // Fallback: If still doesn't fit at minFontSize, truncate lines
        if (finalOneLineHeight === 0) {
             // Calculate height for min font size
             doc.setFontSize(minFontSize);
             splitText = doc.splitTextToSize(item.description, maxTextWidth);
             finalOneLineHeight = minFontSize * 0.3527 * 1.15;
        }

        const currentTotalHeight = splitText.length * finalOneLineHeight;
        if (currentTotalHeight > maxAvailableHeight) {
           const maxLines = Math.floor(maxAvailableHeight / finalOneLineHeight);
           if (maxLines > 0) {
               splitText = splitText.slice(0, maxLines);
               const lastIndex = splitText.length - 1;
               // Add ellipsis if we cut off text
               if (splitText[lastIndex].length > 3) {
                   splitText[lastIndex] = splitText[lastIndex].slice(0, -2) + "...";
               }
           } else {
               splitText = []; // Space is too small for even one line
           }
        }

        // Draw text anchoring the bottom line to `bottomBoundary`
        if (splitText.length > 0) {
            const textStartY = bottomBoundary - ((splitText.length - 1) * finalOneLineHeight);
            doc.text(splitText, centerX, textStartY, { align: 'center' });
        }
      }

    } catch (error) {
      console.error("Error generating barcode for", item.gtin, error);
      doc.setFontSize(8);
      doc.setTextColor(255, 0, 0);
      doc.text(`Erro: ${item.gtin}`, centerX, centerY, { align: 'center' });
      doc.setTextColor(0, 0, 0);
    }

    // Grid lines
    if (rows > 1 || columns > 1) {
       doc.setDrawColor(240); // Very light gray
       doc.rect(xPos, yPos, cellWidth, cellHeight);
    }
  });

  doc.save(`etiquetas-${items[0]?.type || 'barcode'}.pdf`);
};