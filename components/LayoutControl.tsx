import React from 'react';
import { Grid, Settings, Monitor } from 'lucide-react';
import { LayoutConfig, BarcodeType } from '../types';

interface LayoutControlProps {
  config: LayoutConfig;
  onChange: (config: LayoutConfig) => void;
  barcodeType: BarcodeType;
}

const LayoutControl: React.FC<LayoutControlProps> = ({ config, onChange, barcodeType }) => {
  const isGtin14 = barcodeType === 'GTIN-14';
  const themeColor = isGtin14 ? 'amber' : 'indigo';

  const handlePreset = (cols: number, rows: number) => {
    onChange({ ...config, columns: cols, rows: rows });
  };

  // Generate cells for the grid visualization
  const totalCells = config.columns * config.rows;
  const cells = Array.from({ length: totalCells });

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
      <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Settings className={`w-5 h-5 text-${themeColor}-600`} />
        Configuração de Impressão
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-6">
          
          <div className="space-y-3">
             <label className="text-sm font-medium text-slate-700">Presets Rápidos</label>
             <div className="flex flex-wrap gap-2">
               <button onClick={() => handlePreset(1, 1)} className={`px-3 py-1.5 text-xs font-medium rounded border ${config.rows === 1 && config.columns === 1 ? `bg-${themeColor}-100 border-${themeColor}-300 text-${themeColor}-700` : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                 1 por pág (A4)
               </button>
               <button onClick={() => handlePreset(2, 4)} className={`px-3 py-1.5 text-xs font-medium rounded border ${config.rows === 4 && config.columns === 2 ? `bg-${themeColor}-100 border-${themeColor}-300 text-${themeColor}-700` : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                 8 por pág (2x4)
               </button>
               <button onClick={() => handlePreset(3, 7)} className={`px-3 py-1.5 text-xs font-medium rounded border ${config.rows === 7 && config.columns === 3 ? `bg-${themeColor}-100 border-${themeColor}-300 text-${themeColor}-700` : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                 21 por pág (3x7)
               </button>
               <button onClick={() => handlePreset(4, 10)} className={`px-3 py-1.5 text-xs font-medium rounded border ${config.rows === 10 && config.columns === 4 ? `bg-${themeColor}-100 border-${themeColor}-300 text-${themeColor}-700` : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                 40 por pág (4x10)
               </button>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Colunas</label>
              <input 
                type="number" 
                min="1" 
                max="10" 
                value={config.columns}
                onChange={(e) => onChange({...config, columns: Math.max(1, parseInt(e.target.value) || 1)})}
                className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-${themeColor}-500 focus:border-${themeColor}-500`}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Linhas</label>
              <input 
                type="number" 
                min="1" 
                max="20" 
                value={config.rows}
                onChange={(e) => onChange({...config, rows: Math.max(1, parseInt(e.target.value) || 1)})}
                className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-${themeColor}-500 focus:border-${themeColor}-500`}
              />
            </div>
          </div>
          
          <div className={`bg-${isGtin14 ? 'amber' : 'blue'}-50 p-3 rounded-lg flex items-start gap-2 text-xs text-${isGtin14 ? 'amber' : 'blue'}-700`}>
             <Grid className="w-4 h-4 mt-0.5 shrink-0" />
             <p>Total de <strong>{totalCells}</strong> etiquetas por folha A4.</p>
          </div>
        </div>

        {/* Live Preview Full Page */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-100 rounded-lg border border-slate-200 border-dashed h-full min-h-[400px]">
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Preview da Página A4</span>
          </div>
          
          {/* A4 Sheet Simulation */}
          <div 
            className="bg-white shadow-xl border border-slate-300 relative transition-all duration-300"
            style={{ 
              height: '340px', 
              aspectRatio: '210/297', // A4 Ratio
              display: 'grid',
              gridTemplateColumns: `repeat(${config.columns}, 1fr)`,
              gridTemplateRows: `repeat(${config.rows}, 1fr)`,
              padding: '1px'
            }}
          >
            {cells.map((_, i) => (
              <div key={i} className={`border border-slate-100 flex flex-col items-center justify-center p-[2px] overflow-hidden bg-white hover:bg-${themeColor}-50 transition-colors`}>
                {/* Simulated Content: Abstract representation of Text + Barcode */}
                <div className="w-3/4 h-[8%] bg-slate-300 rounded-[1px] mb-[4%]"></div>
                <div className={`w-[60%] flex-1 max-h-[50%] bg-${isGtin14 ? 'amber' : 'slate'}-800 opacity-20 rounded-[1px]`}></div>
              </div>
            ))}
          </div>
          
          <p className="mt-4 text-[10px] text-slate-400 text-center max-w-xs">
             Visualização da distribuição na folha A4 ({config.columns}x{config.rows})
          </p>
        </div>
      </div>
    </div>
  );
};

export default LayoutControl;