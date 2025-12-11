import React, { useState } from 'react';
import { ScanLine, ShoppingBag, Package, CheckCircle2 } from 'lucide-react';
import BarcodeForm from './components/BarcodeForm';
import BarcodeList from './components/BarcodeList';
import LayoutControl from './components/LayoutControl';
import { BarcodeItem, LayoutConfig, BarcodeType } from './types';
import { generatePDF } from './utils/pdfGenerator';

const App: React.FC = () => {
  const [items, setItems] = useState<BarcodeItem[]>([]);
  const [barcodeType, setBarcodeType] = useState<BarcodeType>('GTIN-13');
  
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>({
    columns: 2,
    rows: 5, // Default to 10 items per page
    gap: 0
  });
  
  const isGtin14 = barcodeType === 'GTIN-14';
  const themeColor = isGtin14 ? 'amber' : 'indigo';

  const handleAddItems = (newItems: Omit<BarcodeItem, 'id'>[]) => {
    const itemsWithIds = newItems.map(item => ({
      ...item,
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString()
    }));
    
    setItems((prev) => [...prev, ...itemsWithIds]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    setItems([]);
  };

  const handleGeneratePDF = () => {
    generatePDF(items, layoutConfig);
  };

  return (
    <div className={`min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-500 selection:bg-${themeColor}-100 selection:text-${themeColor}-900`}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <div className={`inline-flex items-center justify-center p-3 bg-${themeColor}-600 rounded-2xl shadow-lg shadow-${themeColor}-600/20 mb-4 transition-colors duration-500`}>
            <ScanLine className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Gerador de Etiquetas
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Gere etiquetas em massa para seus produtos ou caixas de embarque.
          </p>
        </div>

        {/* Big Mode Switcher */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
          <button
            onClick={() => setBarcodeType('GTIN-13')}
            className={`relative group p-4 rounded-xl border-2 transition-all duration-300 flex items-center gap-4 text-left ${
              !isGtin14 
                ? 'bg-indigo-50 border-indigo-600 shadow-md' 
                : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
            }`}
          >
            <div className={`p-3 rounded-full ${!isGtin14 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'} transition-colors`}>
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-bold ${!isGtin14 ? 'text-indigo-900' : 'text-slate-700'}`}>GTIN-13 (EAN)</h3>
              <p className={`text-xs ${!isGtin14 ? 'text-indigo-700' : 'text-slate-500'}`}>Para produtos de varejo</p>
            </div>
            {!isGtin14 && <div className="absolute top-3 right-3"><CheckCircle2 className="w-5 h-5 text-indigo-600" /></div>}
          </button>

          <button
            onClick={() => setBarcodeType('GTIN-14')}
            className={`relative group p-4 rounded-xl border-2 transition-all duration-300 flex items-center gap-4 text-left ${
              isGtin14 
                ? 'bg-amber-50 border-amber-600 shadow-md' 
                : 'bg-white border-slate-200 hover:border-amber-200 hover:bg-slate-50'
            }`}
          >
            <div className={`p-3 rounded-full ${isGtin14 ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-amber-100 group-hover:text-amber-600'} transition-colors`}>
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-bold ${isGtin14 ? 'text-amber-900' : 'text-slate-700'}`}>GTIN-14 (DUN)</h3>
              <p className={`text-xs ${isGtin14 ? 'text-amber-800' : 'text-slate-500'}`}>Para caixas de embarque</p>
            </div>
            {isGtin14 && <div className="absolute top-3 right-3"><CheckCircle2 className="w-5 h-5 text-amber-600" /></div>}
          </button>
        </div>

        {/* Main Content */}
        <main className="space-y-6">
          <BarcodeForm 
            onAdd={handleAddItems} 
            barcodeType={barcodeType}
          />
          
          <LayoutControl 
            config={layoutConfig} 
            onChange={setLayoutConfig}
            barcodeType={barcodeType}
          />
          
          <div className="my-8 border-t border-slate-200"></div>
          
          <BarcodeList 
            items={items} 
            onRemove={handleRemoveItem} 
            onClearAll={handleClearAll}
            onGenerate={handleGeneratePDF}
            barcodeType={barcodeType}
          />
        </main>

        {/* Footer */}
        <footer className="text-center text-slate-400 text-sm mt-12 pb-4">
          <p>&copy; {new Date().getFullYear()} Gerador de Etiquetas. Sistema seguro e processamento local.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;