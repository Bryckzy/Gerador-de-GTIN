import React from 'react';
import { Grid, Settings, Monitor, Printer, Check } from 'lucide-react';
import { LayoutConfig, BarcodeType } from '../types';

interface LayoutControlProps {
  config: LayoutConfig;
  onChange: (config: LayoutConfig) => void;
  barcodeType: BarcodeType;
}

const LayoutControl: React.FC<LayoutControlProps> = ({ config, onChange, barcodeType }) => {
  const isGtin14 = barcodeType === 'GTIN-14';
  const themeColor = isGtin14 ? 'amber' : 'indigo';

  // Handle Simple Dynamic Presets
  const handleSimplePreset = (cols: number, rows: number) => {
    onChange({ 
      columns: cols, 
      rows: rows, 
      gap: 0,
      formatName: undefined,
      width: undefined, 
      height: undefined,
      marginTop: undefined,
      marginLeft: undefined
    });
  };

  // Handle Precise Manufacturer Presets
  const handlePimacoA4260 = () => {
    onChange({
      columns: 3,
      rows: 7,
      width: 63.5,
      height: 38.1,
      marginTop: 12.7,
      marginLeft: 4.3,
      gapX: 2.5,
      gapY: 0,
      formatName: 'Pimaco A4260'
    });
  };

  const handlePimacoA4355 = () => {
    onChange({
      columns: 3,
      rows: 9,
      width: 63.5,
      height: 31.0,
      marginTop: 10.7,
      marginLeft: 4.3,
      gapX: 2.5,
      gapY: 0,
      formatName: 'Pimaco A4355'
    });
  };

  // Generate cells for the grid visualization
  const totalCells = config.columns * config.rows;
  const cells = Array.from({ length: totalCells });

  const isPimacoA4260 = config.formatName === 'Pimaco A4260';
  const isPimacoA4355 = config.formatName === 'Pimaco A4355';
  const isCustom = !config.formatName;

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
             <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Printer className="w-4 h-4" />
                Formatos Padrão (Pimaco)
             </label>
             
             <div className="grid grid-cols-1 gap-3">
                {/* Button A4260 */}
                <button 
                  onClick={handlePimacoA4260}
                  className={`w-full p-3 rounded-lg border-2 transition-all flex items-center justify-between group ${
                    isPimacoA4260
                      ? `bg-${themeColor}-50 border-${themeColor}-500 text-${themeColor}-900` 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 flex items-center justify-center rounded-lg font-bold text-xl border ${
                        isPimacoA4260 ? `bg-${themeColor}-200 border-${themeColor}-300 text-${themeColor}-800` : 'bg-slate-100 border-slate-200 text-slate-500'
                    }`}>
                        21
                    </div>
                    <div className="flex flex-col items-start text-left">
                      <span className="font-bold text-sm">Pimaco A4260</span>
                      <span className="text-xs opacity-75">3 col x 7 lin • 63,5 x 38,1mm</span>
                    </div>
                  </div>
                  {isPimacoA4260 && <Check className={`w-5 h-5 text-${themeColor}-600`} />}
                </button>

                {/* Button A4355 */}
                <button 
                  onClick={handlePimacoA4355}
                  className={`w-full p-3 rounded-lg border-2 transition-all flex items-center justify-between group ${
                    isPimacoA4355
                      ? `bg-${themeColor}-50 border-${themeColor}-500 text-${themeColor}-900` 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 flex items-center justify-center rounded-lg font-bold text-xl border ${
                        isPimacoA4355 ? `bg-${themeColor}-200 border-${themeColor}-300 text-${themeColor}-800` : 'bg-slate-100 border-slate-200 text-slate-500'
                    }`}>
                        27
                    </div>
                    <div className="flex flex-col items-start text-left">
                      <span className="font-bold text-sm">Pimaco A4355</span>
                      <span className="text-xs opacity-75">3 col x 9 lin • 63,5 x 31,0mm</span>
                    </div>
                  </div>
                  {isPimacoA4355 && <Check className={`w-5 h-5 text-${themeColor}-600`} />}
                </button>
             </div>
          </div>

          <div className="border-t border-slate-100 my-4"></div>

          <div className="space-y-3">
             <label className="text-sm font-medium text-slate-700">Presets Genéricos</label>
             <div className="flex flex-wrap gap-2">
               {[
                   {c: 1, r: 1, label: '1 (A4)'}, 
                   {c: 2, r: 4, label: '8 (2x4)'}, 
                   {c: 3, r: 7, label: '21 (3x7)'},
                   {c: 4, r: 10, label: '40 (4x10)'}
               ].map(p => (
                   <button 
                    key={p.label}
                    onClick={() => handleSimplePreset(p.c, p.r)} 
                    className={`px-3 py-1.5 text-xs font-medium rounded border ${
                        isCustom && config.rows === p.r && config.columns === p.c 
                        ? `bg-${themeColor}-100 border-${themeColor}-300 text-${themeColor}-700` 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}>
                    {p.label}
                   </button>
               ))}
             </div>
          </div>

          <div className={`p-3 rounded-lg flex items-start gap-2 text-xs transition-colors ${!isCustom ? 'bg-green-50 text-green-700' : `bg-${isGtin14 ? 'amber' : 'blue'}-50 text-${isGtin14 ? 'amber' : 'blue'}-700`}`}>
             <Grid className="w-4 h-4 mt-0.5 shrink-0" />
             {!isCustom ? (
               <p><strong>Modo de Precisão Ativo:</strong> {config.formatName}. Medidas calibradas com margens e espaçamentos do fabricante.</p>
             ) : (
               <p><strong>Modo Genérico:</strong> Divide a folha A4 em {config.columns}x{config.rows} células iguais (sem margens precisas).</p>
             )}
          </div>
        </div>

        {/* Live Preview Full Page */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-100 rounded-lg border border-slate-200 border-dashed h-full min-h-[400px]">
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Preview da Grade</span>
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
              // If precise, we add padding to simulate margins visually in preview (approximate for visual feedback)
              padding: !isCustom ? '12px 5px' : '1px', 
              gap: !isCustom ? '2px' : '0'
            }}
          >
            {cells.map((_, i) => (
              <div key={i} className={`border border-slate-100 flex flex-col items-center justify-center p-[1px] overflow-hidden bg-white hover:bg-${themeColor}-50 transition-colors`}>
                <div className="w-3/4 h-[8%] bg-slate-300 rounded-[1px] mb-[4%]"></div>
                <div className={`w-[60%] flex-1 max-h-[50%] bg-${isGtin14 ? 'amber' : 'slate'}-800 opacity-20 rounded-[1px]`}></div>
              </div>
            ))}
          </div>
          
          <p className="mt-4 text-[10px] text-slate-400 text-center max-w-xs">
             {config.formatName ? `${config.formatName} (${config.columns * config.rows} etiquetas)` : `Personalizado (${config.columns}x${config.rows} = ${config.columns * config.rows} etiquetas)`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LayoutControl;