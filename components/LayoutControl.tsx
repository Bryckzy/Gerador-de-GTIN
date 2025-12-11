
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Settings, Check, Ruler, ZoomIn, ZoomOut, MousePointer2, Maximize, Scan } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { LayoutConfig, BarcodeType, BarcodeItem } from '../types';

interface LayoutControlProps {
  config: LayoutConfig;
  onChange: (config: LayoutConfig) => void;
  barcodeType: BarcodeType;
  items: BarcodeItem[];
}

// Pimaco Catalog Data
const PIMACO_FORMATS = [
  // Categoria: Endereçamento / Médias
  { category: 'Endereçamento', model: 'A4249', cols: 3, rows: 7, w: 70.0, h: 42.3, ml: 0.0, mt: 0.5, gapX: 0, gapY: 0, label: '21' },
  { category: 'Endereçamento', model: 'A4260', cols: 3, rows: 7, w: 63.5, h: 38.1, ml: 7.2, mt: 15.1, gapX: 2.5, gapY: 0, label: '21' },
  { category: 'Endereçamento', model: 'A4255', cols: 3, rows: 8, w: 70.0, h: 36.0, ml: 0.0, mt: 4.5, gapX: 0, gapY: 0, label: '24' },
  { category: 'Endereçamento', model: 'A4355', cols: 3, rows: 9, w: 63.5, h: 31.0, ml: 7.2, mt: 9.0, gapX: 2.5, gapY: 0, label: '27' },
  { category: 'Endereçamento', model: 'A4256', cols: 3, rows: 11, w: 63.5, h: 25.4, ml: 7.2, mt: 8.8, gapX: 2.5, gapY: 0, label: '33' },
  
  // Categoria: Pequenas / Códigos
  { category: 'Pequenas', model: 'A4250', cols: 4, rows: 10, w: 52.5, h: 29.7, ml: 0.0, mt: 0.0, gapX: 0, gapY: 0, label: '40' },
  { category: 'Pequenas', model: 'A4264', cols: 4, rows: 12, w: 48.5, h: 25.4, ml: 8.0, mt: 0.0, gapX: 0, gapY: 0, label: '48' },
  { category: 'Pequenas', model: 'A4265', cols: 4, rows: 15, w: 48.5, h: 16.9, ml: 8.0, mt: 10.0, gapX: 0, gapY: 0, label: '60' }, 
  { category: 'Pequenas', model: 'A4251', cols: 5, rows: 13, w: 38.1, h: 21.2, ml: 9.75, mt: 10.7, gapX: 0, gapY: 0, label: '65' },
  { category: 'Pequenas', model: 'A4266', cols: 5, rows: 16, w: 38.0, h: 17.0, ml: 10.0, mt: 12.5, gapX: 0, gapY: 0, label: '80' },

  // Categoria: Grandes
  { category: 'Grandes/Caixas', model: 'A4368', cols: 2, rows: 2, w: 105.0, h: 148.5, ml: 0.0, mt: 0.0, gapX: 0, gapY: 0, label: '4' },
  { category: 'Grandes/Caixas', model: 'A4248', cols: 2, rows: 6, w: 105.0, h: 49.5, ml: 0.0, mt: 0.0, gapX: 0, gapY: 0, label: '12' },
];

type LayoutTab = 'catalog' | 'custom';

// --- Helper Component for Barcode Rendering ---
const BarcodePreviewSVG: React.FC<{ value: string; type: BarcodeType }> = ({ value, type }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current) {
      try {
        JsBarcode(svgRef.current, value, {
          format: type === 'GTIN-14' ? "ITF14" : "EAN13",
          width: 2,
          height: 60,
          displayValue: true,
          font: "Helvetica",
          fontOptions: "bold",
          fontSize: 14,
          margin: 0,
          background: 'transparent'
        });
      } catch (e) {
        // Silent fail for invalid codes during typing/preview
      }
    }
  }, [value, type]);

  return <svg ref={svgRef} className="w-full h-full max-h-[80px]" style={{ width: '100%', height: 'auto' }} />;
};

const LayoutControl: React.FC<LayoutControlProps> = ({ config, onChange, items }) => {
  const [activeTab, setActiveTab] = useState<LayoutTab>(config.formatName ? 'catalog' : 'custom');
  const [selectedCategory, setSelectedCategory] = useState<string>('Endereçamento');
  
  // Transform State (Free Navigation)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  
  const categories = Array.from(new Set(PIMACO_FORMATS.map(f => f.category)));

  // --- Layout Calculations ---
  const PAGE_WIDTH_MM = 210;
  const PAGE_HEIGHT_MM = 297;

  const ml = config.marginLeft || 0;
  const mt = config.marginTop || 0;
  const gapX = config.gapX || 0;
  const gapY = config.gapY || 0;
  const cols = config.columns;
  const rows = config.rows;

  let cellWidth = config.width || 0;
  if (!cellWidth) {
     if (config.marginLeft !== undefined) {
         cellWidth = (PAGE_WIDTH_MM - (ml * 2) - (gapX * (cols - 1))) / cols;
     } else {
         cellWidth = PAGE_WIDTH_MM / cols;
     }
  }
  
  const cellHeight = config.height || (PAGE_HEIGHT_MM / rows);
  const itemsPerPage = rows * cols;
  
  // Get ONLY the first page items
  const pageOneItems = items.length > 0 ? items.slice(0, itemsPerPage) : [];

  // --- View Control Logic ---

  const fitToScreen = useCallback(() => {
    if (containerRef.current && paperRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      const padding = 40; // Space around the paper
      
      const availableWidth = clientWidth - padding;
      const availableHeight = clientHeight - padding;

      // Use the actual rendered pixel width of the paper element (unscaled)
      // We divide by current scale to get the base dimension if transform is active, 
      // but offsetWidth is usually the layout width. 
      // To be safe, we assume standard A4 ratio or calculation.
      // Better: Use a fixed standard DPI assumption for the base '100%' calculation
      const PX_PER_MM = 3.78; // Approx 96 DPI
      const paperWidthPx = PAGE_WIDTH_MM * PX_PER_MM;
      const paperHeightPx = PAGE_HEIGHT_MM * PX_PER_MM;

      const scaleW = availableWidth / paperWidthPx;
      const scaleH = availableHeight / paperHeightPx;
      
      // Fit fully visible
      const newScale = Math.min(scaleW, scaleH, 1.0); 
      
      setTransform({
        x: 0,
        y: 0,
        scale: newScale
      });
    }
  }, []);

  // Responsive Resize Observer
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      // Trigger fit on resize to ensure responsiveness
      fitToScreen();
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [fitToScreen]);


  // --- Wheel Zoom Logic ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      const zoomSensitivity = 0.001; 
      const delta = -e.deltaY * zoomSensitivity;
      
      setTransform(prev => {
        const newScale = Math.min(Math.max(prev.scale + delta, 0.1), 5.0);
        return { ...prev, scale: newScale };
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // --- Handlers ---

  const applyFormat = (fmt: typeof PIMACO_FORMATS[0]) => {
    let ml = fmt.ml;
    let mt = fmt.mt;

    if (ml === undefined) {
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
      cornerRadius: 3, 
      formatName: `Pimaco ${fmt.model}`
    });
  };

  const handleCustomChange = (field: keyof LayoutConfig, value: number) => {
    onChange({
      ...config,
      formatName: undefined,
      [field]: value
    });
  };

  const toggleOutlines = () => {
    onChange({ ...config, showOutlines: !config.showOutlines });
  };

  // --- Drag Logic ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const dx = e.clientX - lastMouse.x;
    const dy = e.clientY - lastMouse.y;
    
    setTransform(prev => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy
    }));
    
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    // Responsive container using calc(100vh - header - footer space)
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[600px] lg:h-[calc(100vh-280px)] min-h-[500px] flex flex-col transition-all duration-300">
      
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-100 flex flex-col md:flex-row justify-between items-center px-6 py-3 gap-4 shrink-0 h-auto md:h-16">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-600" />
          Layout da Impressão
        </h2>
        
        <button 
          onClick={toggleOutlines}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wide transition-all ${
             config.showOutlines 
              ? `bg-brand-black border-brand-black text-brand-yellow` 
              : 'bg-white border-gray-300 text-gray-500 hover:border-gray-400'
          }`}
        >
          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${config.showOutlines ? `bg-brand-yellow border-brand-yellow` : 'border-gray-400'}`}>
            {config.showOutlines && <Check className="w-3 h-3 text-black" />}
          </div>
          Bordas (Linhas de Corte)
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 overflow-hidden h-full">
        
        {/* Controls Panel (Left) - Scrollable */}
        <div className="xl:col-span-4 flex flex-col border-r border-gray-100 bg-white h-full overflow-hidden order-2 xl:order-1">
           <div className="flex border-b border-gray-100 shrink-0">
             <button onClick={() => setActiveTab('catalog')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide ${activeTab === 'catalog' ? 'text-brand-black border-b-2 border-brand-yellow bg-yellow-50/50' : 'text-gray-500 hover:bg-gray-50'}`}>
                Catálogo Pimaco
             </button>
             <button onClick={() => setActiveTab('custom')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide ${activeTab === 'custom' ? 'text-brand-black border-b-2 border-brand-yellow bg-yellow-50/50' : 'text-gray-500 hover:bg-gray-50'}`}>
                Personalizado
             </button>
           </div>

           <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
             {activeTab === 'catalog' && (
               <div className="space-y-6">
                 <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${
                          selectedCategory === cat
                            ? `bg-brand-black text-white border-brand-black`
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                    {PIMACO_FORMATS.filter(f => f.category === selectedCategory).map(fmt => {
                      const isSelected = config.formatName === `Pimaco ${fmt.model}`;
                      return (
                        <button
                          key={fmt.model}
                          onClick={() => applyFormat(fmt)}
                          className={`relative flex flex-col p-3 rounded-xl border-2 transition-all hover:shadow-md text-left ${
                            isSelected
                              ? `bg-yellow-50 border-brand-yellow ring-1 ring-brand-yellow`
                              : 'bg-white border-gray-100 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                             <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isSelected ? `bg-brand-yellow text-brand-black` : 'bg-gray-100 text-gray-600'}`}>
                               {fmt.model}
                             </span>
                             {isSelected && <Check className="w-4 h-4 text-brand-black" />}
                          </div>
                          
                          <div className="mt-auto">
                            <div className="flex items-baseline gap-1">
                               <span className="text-2xl font-bold text-gray-800">{fmt.label}</span>
                               <span className="text-xs text-gray-500 font-medium">etiquetas</span>
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono mt-1">
                               {fmt.w} x {fmt.h} mm
                            </div>
                          </div>
                        </button>
                      )
                    })}
                 </div>
               </div>
             )}

             {activeTab === 'custom' && (
               <div className="space-y-6">
                 <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex gap-3 text-yellow-900">
                    <Ruler className="w-5 h-5 shrink-0" />
                    <p className="text-xs leading-relaxed">
                       Ajuste fino. Os valores são em milímetros.
                    </p>
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2">Grade</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-xs font-semibold text-gray-500 mb-1 block">Colunas</label>
                           <input type="number" value={config.columns} onChange={(e) => handleCustomChange('columns', Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-yellow outline-none" />
                        </div>
                        <div>
                           <label className="text-xs font-semibold text-gray-500 mb-1 block">Linhas</label>
                           <input type="number" value={config.rows} onChange={(e) => handleCustomChange('rows', Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-yellow outline-none" />
                        </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2">Dimensões (mm)</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-xs font-semibold text-gray-500 mb-1 block">Largura</label>
                           <input type="number" step="0.1" value={config.width || 0} onChange={(e) => handleCustomChange('width', Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-yellow outline-none" />
                        </div>
                        <div>
                           <label className="text-xs font-semibold text-gray-500 mb-1 block">Altura</label>
                           <input type="number" step="0.1" value={config.height || 0} onChange={(e) => handleCustomChange('height', Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-yellow outline-none" />
                        </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2">Margens (mm)</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-xs font-semibold text-gray-500 mb-1 block">Topo</label>
                           <input type="number" step="0.1" value={config.marginTop || 0} onChange={(e) => handleCustomChange('marginTop', Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-yellow outline-none" />
                        </div>
                        <div>
                           <label className="text-xs font-semibold text-gray-500 mb-1 block">Esquerda</label>
                           <input type="number" step="0.1" value={config.marginLeft || 0} onChange={(e) => handleCustomChange('marginLeft', Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-yellow outline-none" />
                        </div>
                        <div>
                           <label className="text-xs font-semibold text-gray-500 mb-1 block">Gap X</label>
                           <input type="number" step="0.1" value={config.gapX || 0} onChange={(e) => handleCustomChange('gapX', Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-yellow outline-none" />
                        </div>
                        <div>
                           <label className="text-xs font-semibold text-gray-500 mb-1 block">Gap Y</label>
                           <input type="number" step="0.1" value={config.gapY || 0} onChange={(e) => handleCustomChange('gapY', Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-yellow outline-none" />
                        </div>
                    </div>
                 </div>
               </div>
             )}
           </div>
        </div>

        {/* Preview Panel - Fixed Size Window + Free Transform */}
        <div 
          ref={containerRef}
          className="xl:col-span-8 bg-[#525659] relative h-full overflow-hidden select-none cursor-grab active:cursor-grabbing order-1 xl:order-2 flex items-center justify-center"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
           
           {/* Controls Overlay */}
           <div className="absolute top-4 right-4 z-20 flex gap-2 pointer-events-none">
              <div className="bg-black/50 backdrop-blur rounded-lg flex items-center border border-white/10 p-1 shadow-xl pointer-events-auto">
                  <div className="hidden sm:flex items-center gap-1.5 px-3 border-r border-white/10 text-white/80">
                      <MousePointer2 className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Scroll Zoom</span>
                  </div>
                  <button onClick={() => setTransform(prev => ({ ...prev, scale: Math.max(prev.scale - 0.1, 0.1) }))} className="p-2 text-white hover:bg-white/10 rounded transition-colors"><ZoomOut className="w-4 h-4"/></button>
                  <span className="text-xs font-mono font-bold text-white px-2 min-w-[3rem] text-center">{Math.round(transform.scale * 100)}%</span>
                  <button onClick={() => setTransform(prev => ({ ...prev, scale: Math.min(prev.scale + 0.1, 5.0) }))} className="p-2 text-white hover:bg-white/10 rounded transition-colors"><ZoomIn className="w-4 h-4"/></button>
                  <div className="w-px h-4 bg-white/10 mx-1"></div>
                  <button onClick={fitToScreen} className="p-2 text-white hover:bg-white/10 rounded transition-colors" title="Ajustar à Tela">
                      <Scan className="w-4 h-4" />
                  </button>
                  <button onClick={() => setTransform({x:0, y:0, scale: 1})} className="p-2 text-white hover:bg-white/10 rounded transition-colors" title="Tamanho Real (100%)">
                      <Maximize className="w-4 h-4" />
                  </button>
              </div>
           </div>

           {/* Transformable Canvas Layer */}
           {/* We use a specific pixel size for A4 @ 96 DPI to match browser rendering consistency */}
           <div 
             ref={paperRef}
             className="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative transition-shadow duration-300 origin-center will-change-transform"
             style={{
                 width: '210mm',
                 height: '297mm',
                 transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                 flexShrink: 0 
             }}
           >
              {/* Empty State Grid Preview */}
              {items.length === 0 && config.showOutlines && (
                  Array.from({length: itemsPerPage}).map((_, i) => {
                      const colIndex = i % cols;
                      const rowIndex = Math.floor(i / cols);
                      const left = ml + (colIndex * (cellWidth + gapX));
                      const top = mt + (rowIndex * (cellHeight + gapY));
                      return (
                         <div 
                             key={i}
                             className="absolute border border-dashed border-gray-300 flex items-center justify-center"
                             style={{
                                 left: `${left}mm`,
                                 top: `${top}mm`,
                                 width: `${cellWidth}mm`,
                                 height: `${cellHeight}mm`,
                                 borderRadius: config.cornerRadius ? '2mm' : '0'
                             }}
                         >
                             <span className="text-[10px] text-gray-300 font-bold">{i + 1}</span>
                         </div>
                      )
                  })
              )}

              {/* Barcode Items - Only Page 1 */}
              {pageOneItems.map((item, idx) => {
                 const colIndex = idx % cols;
                 const rowIndex = Math.floor(idx / cols);
                 const left = ml + (colIndex * (cellWidth + gapX));
                 const top = mt + (rowIndex * (cellHeight + gapY));

                 return (
                     <div
                         key={item.id}
                         className="absolute flex flex-col items-center justify-between p-[2mm] overflow-hidden bg-white"
                         style={{
                             left: `${left}mm`,
                                 top: `${top}mm`,
                             width: `${cellWidth}mm`,
                             height: `${cellHeight}mm`,
                             border: config.showOutlines ? '1px solid #e5e7eb' : 'none',
                             borderRadius: config.cornerRadius ? '2mm' : '0',
                         }}
                     >
                         {/* Text Area */}
                         <div className="w-full flex-1 flex items-center justify-center text-center leading-tight">
                             <span 
                                 className="font-bold text-black block"
                                 style={{
                                     fontSize: item.description.length > 30 ? '3.5mm' : '4.5mm', 
                                 }}
                             >
                                 {item.description}
                             </span>
                         </div>
                         
                         {/* Barcode Area */}
                         <div className="w-full flex justify-center items-end mt-1" style={{ height: '40%' }}>
                             <BarcodePreviewSVG value={item.gtin} type={item.type} />
                         </div>
                     </div>
                 );
              })}

              {/* Page Number Badge (Fixed inside scale) */}
              <div className="absolute bottom-2 right-4 text-[10px] text-gray-400 font-medium tracking-widest uppercase">
                 Página 1 (Preview)
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default LayoutControl;
