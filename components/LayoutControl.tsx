
import React, { useState } from 'react';
import { Settings, Monitor, Grid3X3, Check, Grid, SquareDashedMousePointer, AlertCircle } from 'lucide-react';
import { LayoutConfig, BarcodeType, BarcodeItem } from '../types';

interface LayoutControlProps {
  config: LayoutConfig;
  onChange: (config: LayoutConfig) => void;
  barcodeType: BarcodeType;
  items: BarcodeItem[];
}

// Pimaco Catalog Data with EXACT specs (mm)
// gapX: Horizontal spacing between columns
// gapY: Vertical spacing between rows (usually 0 for Pimaco, but defined for flexibility)
const PIMACO_FORMATS = [
  // Categoria: Endereçamento / Médias
  { category: 'Endereçamento & Uso Geral', model: 'A4249', cols: 3, rows: 7, w: 70.0, h: 42.3, ml: 0.0, mt: 0.5, gapX: 0, gapY: 0, label: '21' },
  { category: 'Endereçamento & Uso Geral', model: 'A4260', cols: 3, rows: 7, w: 63.5, h: 38.1, ml: 7.2, mt: 15.1, gapX: 2.5, gapY: 0, label: '21' },
  { category: 'Endereçamento & Uso Geral', model: 'A4255', cols: 3, rows: 8, w: 70.0, h: 36.0, ml: 0.0, mt: 4.5, gapX: 0, gapY: 0, label: '24' },
  { category: 'Endereçamento & Uso Geral', model: 'A4355', cols: 3, rows: 9, w: 63.5, h: 31.0, ml: 7.2, mt: 9.0, gapX: 2.5, gapY: 0, label: '27' },
  { category: 'Endereçamento & Uso Geral', model: 'A4256', cols: 3, rows: 11, w: 63.5, h: 25.4, ml: 7.2, mt: 8.8, gapX: 2.5, gapY: 0, label: '33' },
  
  // Categoria: Pequenas / Códigos
  { category: 'Pequenos & Códigos', model: 'A4250', cols: 4, rows: 10, w: 52.5, h: 29.7, ml: 0.0, mt: 0.0, gapX: 0, gapY: 0, label: '40' },
  { category: 'Pequenos & Códigos', model: 'A4264', cols: 4, rows: 12, w: 48.5, h: 25.4, ml: 8.0, mt: 0.0, gapX: 0, gapY: 0, label: '48' }, // Ajustar margens se necessário
  { category: 'Pequenos & Códigos', model: 'A4265', cols: 4, rows: 15, w: 48.5, h: 16.9, ml: 8.0, mt: 10.0, gapX: 0, gapY: 0, label: '60' }, 
  { category: 'Pequenos & Códigos', model: 'A4251', cols: 5, rows: 13, w: 38.1, h: 21.2, ml: 9.75, mt: 10.7, gapX: 0, gapY: 0, label: '65' },
  { category: 'Pequenos & Códigos', model: 'A4266', cols: 5, rows: 16, w: 38.0, h: 17.0, ml: 10.0, mt: 12.5, gapX: 0, gapY: 0, label: '80' },

  // Categoria: Grandes
  { category: 'Caixas & Grandes', model: 'A4368', cols: 2, rows: 2, w: 105.0, h: 148.5, ml: 0.0, mt: 0.0, gapX: 0, gapY: 0, label: '4' },
  { category: 'Caixas & Grandes', model: 'A4248', cols: 2, rows: 6, w: 105.0, h: 49.5, ml: 0.0, mt: 0.0, gapX: 0, gapY: 0, label: '12' },
];

const LayoutControl: React.FC<LayoutControlProps> = ({ config, onChange, barcodeType, items }) => {
  const isGtin14 = barcodeType === 'GTIN-14';
  const themeColor = isGtin14 ? 'amber' : 'indigo';
  const [selectedCategory, setSelectedCategory] = useState<string>('Endereçamento & Uso Geral');

  const categories = Array.from(new Set(PIMACO_FORMATS.map(f => f.category)));

  const applyFormat = (fmt: typeof PIMACO_FORMATS[0]) => {
    // If gaps/margins are explicitly defined in our data, use them.
    // If not (legacy data), we calculate centered margins.
    const isExplicit = fmt.ml !== undefined;
    
    let ml = fmt.ml;
    let mt = fmt.mt;

    if (!isExplicit) {
        ml = Number(((210 - (fmt.cols * fmt.w) - ((fmt.cols - 1) * fmt.gapX)) / 2).toFixed(1));
        mt = Number(((297 - (fmt.rows * fmt.h) - ((fmt.rows - 1) * fmt.gapY)) / 2).toFixed(1));
    }

    onChange({
      ...config,
      columns: fmt.cols,
      rows: fmt.rows,
      width: fmt.w,
      height: fmt.h,
      marginTop: mt,
      marginLeft: ml,
      gapX: fmt.gapX,
      gapY: fmt.gapY,
      cornerRadius: 3, // Standard rounded corner for stickers
      formatName: `Pimaco ${fmt.model}`
    });
  };

  const toggleOutlines = () => {
    onChange({ ...config, showOutlines: !config.showOutlines });
  };

  // --- PREVIEW ENGINE ---
  // Calculates precise absolute positioning based on A4 dimensions (210x297mm)
  const A4_WIDTH_MM = 210;
  const A4_HEIGHT_MM = 297;

  // Converts mm to percentage relative to A4 container
  const xToPct = (mm: number) => (mm / A4_WIDTH_MM) * 100;
  const yToPct = (mm: number) => (mm / A4_HEIGHT_MM) * 100;

  const totalCells = config.columns * config.rows;
  
  // Safe defaults if config is missing (custom mode fallback)
  const cellW = config.width || (A4_WIDTH_MM / config.columns);
  const cellH = config.height || (A4_HEIGHT_MM / config.rows);
  const mt = config.marginTop || 0;
  const ml = config.marginLeft || 0;
  const gx = config.gapX || 0;
  const gy = config.gapY || 0;
  
  const cells = Array.from({ length: totalCells }).map((_, i) => {
    const colIndex = i % config.columns;
    const rowIndex = Math.floor(i / config.columns);
    
    // Exact position logic: Margin + (Index * (Size + Gap))
    const leftMM = ml + (colIndex * (cellW + gx));
    const topMM = mt + (rowIndex * (cellH + gy));
    
    return {
        id: i,
        left: xToPct(leftMM),
        top: yToPct(topMM),
        width: xToPct(cellW),
        height: yToPct(cellH),
        item: items[i]
    };
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* Header Panel */}
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Settings className={`w-5 h-5 text-${themeColor}-600`} />
          Layout & Impressão
        </h2>
        
        {/* Toggle Outlines */}
        <button 
          onClick={toggleOutlines}
          className={`flex items-center gap-3 px-4 py-2 rounded-full border transition-all text-sm font-medium ${
             config.showOutlines 
              ? `bg-${themeColor}-100 border-${themeColor}-300 text-${themeColor}-800` 
              : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${config.showOutlines ? `bg-${themeColor}-600 border-${themeColor}-600` : 'border-slate-400'}`}>
            {config.showOutlines && <Check className="w-3 h-3 text-white" />}
          </div>
          Imprimir linhas de corte (Bordas)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        
        {/* LEFT: Format Selector */}
        <div className="lg:col-span-4 xl:col-span-3 p-4 border-r border-slate-100 flex flex-col h-[600px]">
           
           <div className="space-y-2 mb-4 shrink-0">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Categorias</label>
              <div className="flex flex-col gap-1.5">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-3 py-2 text-xs rounded-lg border transition-all ${
                      selectedCategory === cat
                        ? `bg-slate-800 text-white border-slate-800 shadow-md`
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
           </div>

           <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2">
              {PIMACO_FORMATS.filter(f => f.category === selectedCategory).map(fmt => {
                const isSelected = config.formatName === `Pimaco ${fmt.model}`;
                return (
                  <button
                    key={fmt.model}
                    onClick={() => applyFormat(fmt)}
                    className={`w-full group relative flex flex-col items-start p-3 rounded-lg border transition-all ${
                      isSelected
                        ? `bg-${themeColor}-50 border-${themeColor}-500 ring-1 ring-${themeColor}-500 z-10`
                        : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between w-full mb-1">
                       <span className={`text-xs font-bold ${isSelected ? `text-${themeColor}-800` : 'text-slate-700'}`}>
                         {fmt.model}
                       </span>
                       {isSelected && <Check className={`w-3 h-3 text-${themeColor}-600`} />}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-1">
                       <span className="text-xl font-bold text-slate-800 leading-none">{fmt.label}</span>
                       <span className="text-[10px] text-slate-500 leading-none">etiquetas/fl</span>
                    </div>
                    
                    <div className="text-[9px] text-slate-400 font-mono w-full flex justify-between">
                       <span>{fmt.w}×{fmt.h}mm</span>
                       <span>{fmt.cols}×{fmt.rows}</span>
                    </div>
                  </button>
                )
              })}
           </div>
        </div>

        {/* RIGHT: Preview */}
        <div className="lg:col-span-8 xl:col-span-9 bg-slate-50/50 p-6 flex flex-col h-[600px]">
          <div className="flex items-center justify-between mb-4 shrink-0">
             <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preview Real (Frente)</span>
             </div>
             <div className="flex items-center gap-3">
                 <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded border border-slate-200 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                    <span className="text-[10px] text-slate-500">Papel</span>
                 </div>
                 <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded border border-slate-200 shadow-sm">
                    <div className={`w-2 h-2 rounded-full border border-slate-300`}></div>
                    <span className="text-[10px] text-slate-500">Corte</span>
                 </div>
             </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 border border-slate-200 border-dashed rounded-xl bg-slate-200/50 overflow-hidden relative">
            
            {/* A4 Sheet Simulator */}
            <div 
               className="bg-white shadow-2xl relative transition-all duration-500"
               style={{ 
                 height: '100%', 
                 aspectRatio: '210/297',
                 position: 'relative', // Context for absolute positioning
               }}
             >
               {/* Watermark/Guide Text */}
               {!config.formatName && (
                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                       <Grid className="w-32 h-32" />
                   </div>
               )}

               {/* Render Labels using Absolute Position */}
               {cells.map((cell) => {
                 const hasItem = !!cell.item;
                 // Dynamic radius based on label size, capped at config or 3mm equivalent %
                 const radiusStyle = config.cornerRadius ? `${config.cornerRadius}px` : '0px';

                 return (
                   <div 
                    key={cell.id} 
                    className={`
                        absolute flex flex-col items-center justify-center overflow-hidden
                        transition-all duration-300
                        ${hasItem ? 'bg-white' : 'bg-transparent'}
                    `}
                    style={{
                        left: `${cell.left}%`,
                        top: `${cell.top}%`,
                        width: `${cell.width}%`,
                        height: `${cell.height}%`,
                        borderRadius: radiusStyle,
                        // If outlines are ON: show solid dark border.
                        // If OFF: show very faint dashed border to indicate "sticker cut line"
                        border: config.showOutlines ? '1px solid #94a3b8' : '1px dashed #e2e8f0' 
                    }}
                   >
                     {hasItem ? (
                        <div className="w-full h-full p-[5%] flex flex-col items-center justify-center">
                            {/* Text Preview */}
                            <div className="w-full text-center mb-[2%]">
                                <span className="block text-[8px] xl:text-[10px] leading-tight text-slate-900 font-bold px-1 line-clamp-2">
                                    {cell.item.description}
                                </span>
                            </div>
                            {/* Barcode Mockup */}
                            <div className="w-[90%] flex-1 min-h-0 flex items-end justify-center gap-[1px] opacity-90 pb-1">
                                {Array.from({length: 24}).map((_, k) => (
                                    <div key={k} className="bg-slate-900 w-full rounded-[1px]" style={{height: `${30 + Math.random() * 70}%`}}></div>
                                ))}
                            </div>
                            <div className="w-full text-center mt-[1%]">
                                <span className="block text-[7px] xl:text-[9px] font-mono text-slate-600 tracking-wider">
                                    {cell.item.gtin}
                                </span>
                            </div>
                        </div>
                     ) : (
                        // Empty Slot Indicator
                        <div className="opacity-0 hover:opacity-100 transition-opacity w-full h-full flex items-center justify-center bg-slate-50 cursor-crosshair">
                           <div className="text-[8px] text-slate-400 text-center px-1">
                               {cell.id + 1}
                           </div>
                        </div>
                     )}
                   </div>
                 );
               })}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const isSelectedPimaco = (name?: string) => name && name.startsWith('Pimaco');

export default LayoutControl;
