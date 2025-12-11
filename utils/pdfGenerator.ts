
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

  const { rows, columns, showOutlines } = layout;
  const itemsPerPage = rows * columns;

  // Standardize values (fallback to 0 if undefined)
  const ml = layout.marginLeft || 0;
  const mt = layout.marginTop || 0;
  const gapX = layout.gapX || 0;
  const gapY = layout.gapY || 0;
  
  // Calculate cell dimensions if dynamic
  let cellWidth = layout.width || (PAGE_WIDTH / columns);
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

    // Exact Position Calculation matching the Preview logic
    // Left = Margin + (Col * (Width + Gap))
    const xPos = ml + (colIndex * (cellWidth + gapX));
    const yPos = mt + (rowIndex * (cellHeight + gapY));

    // Center of the cell
    const centerX = xPos + (cellWidth / 2);
    // Vertical centering will happen dynamically based on content

    // --- Borders / Outlines (Toggleable) ---
    if (showOutlines) {
      doc.setDrawColor(150); // Gray
      doc.setLineWidth(0.1);
      // Use rounded rect if radius is defined
      if (layout.cornerRadius) {
          // Convert px radius roughly to mm (approx div by 3.78, but visually 2-3mm is standard)
          const radiusMM = layout.cornerRadius ? 2 : 0; 
          doc.roundedRect(xPos, yPos, cellWidth, cellHeight, radiusMM, radiusMM, 'S');
      } else {
          doc.rect(xPos, yPos, cellWidth, cellHeight);
      }
    }

    // --- Barcode Generation ---
    // Safe area margin inside the label (e.g., 2mm on each side)
    const safeMargin = 2; 
    const maxBarcodeWidth = cellWidth - (safeMargin * 2);
    // Barcode takes up roughly 40-50% of height, but capped for small labels
    const maxBarcodeHeight = Math.min(cellHeight * 0.45, 20); 

    const canvas = document.createElement('canvas');
    try {
      JsBarcode(canvas, item.gtin, {
        format: item.type === 'GTIN-14' ? "ITF14" : "EAN13",
        width: 4, // High res base
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

      // Ensure height doesn't exceed limit
      if (pdfImgHeight > maxBarcodeHeight) {
          pdfImgHeight = maxBarcodeHeight;
          pdfImgWidth = (imgProps.width * pdfImgHeight) / imgProps.height;
      }

      // Position: Anchor to bottom area, leaving space above for text
      // We push it slightly down from absolute center to give text more room
      // Calculate Bottom Anchor: Y + Height - BottomPadding (3mm) - BarcodeHeight
      const barcodeY = yPos + cellHeight - pdfImgHeight - 3; 

      doc.addImage(imgData, 'JPEG', centerX - (pdfImgWidth / 2), barcodeY, pdfImgWidth, pdfImgHeight);

      // --- Text Generation (Auto-Fit, No Truncation) ---
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      
      // Boundaries for text
      const topBoundary = yPos + 3; // 3mm from top edge
      const bottomBoundary = barcodeY - 1; // 1mm above barcode
      const maxAvailableHeight = bottomBoundary - topBoundary;
      const maxTextWidth = cellWidth - 4; // 2mm padding sides
      
      if (maxAvailableHeight > 3) {
        let fontSize = 16; // Start big
        const minFontSize = 5; // Absolute minimum readable
        let splitText: string[] = [];
        let lineHeight = 0;
        let fits = false;

        // Recursive fitting loop
        while (fontSize >= minFontSize) {
           doc.setFontSize(fontSize);
           splitText = doc.splitTextToSize(item.description, maxTextWidth);
           
           // Calculate total height of this text block
           // 1 pt = 0.3527 mm. Line height factor approx 1.15
           const singleLineHeight = fontSize * 0.3527 * 1.15; 
           const totalTextHeight = splitText.length * singleLineHeight;

           if (totalTextHeight <= maxAvailableHeight) {
             lineHeight = singleLineHeight;
             fits = true;
             break;
           }
           
           fontSize -= 0.5; // Reduce size
        }

        // Even if it doesn't fit at minFontSize, we print it anyway (per request "always whole title")
        if (!fits) {
            doc.setFontSize(minFontSize);
            splitText = doc.splitTextToSize(item.description, maxTextWidth);
            lineHeight = minFontSize * 0.3527 * 1.15;
        }

        // Center vertically in the available space above barcode
        const totalBlockHeight = splitText.length * lineHeight;
        // Vertically center the text block in the space between top edge and barcode
        const textStartY = topBoundary + ((maxAvailableHeight - totalBlockHeight) / 2) + lineHeight - (lineHeight * 0.25);

        // Draw line by line
        splitText.forEach((line, i) => {
            doc.text(line, centerX, textStartY + (i * lineHeight), { align: 'center' });
        });
      }

    } catch (error) {
      console.error("Error generating barcode for", item.gtin, error);
      doc.setFontSize(8);
      doc.setTextColor(255, 0, 0);
      doc.text(`Erro`, centerX, yPos + (cellHeight/2), { align: 'center' });
      doc.setTextColor(0, 0, 0);
    }
  });

  const filename = layout.formatName 
    ? `etiquetas-${layout.formatName.toLowerCase().replace(/\s/g, '-')}.pdf`
    : `etiquetas-${items[0]?.type || 'barcode'}.pdf`;

  doc.save(filename);
};
