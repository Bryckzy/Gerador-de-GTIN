
import React, { useState } from 'react';
import { ScanLine, ShoppingBag, Package, CheckCircle2, Wrench, ShieldCheck, Zap } from 'lucide-react';
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
    rows: 5, 
    gap: 0,
    showOutlines: false
  });
  
  const isGtin14 = barcodeType === 'GTIN-14';

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

  const handleReorderItems = (fromIndex: number, toIndex: number) => {
    setItems((prevItems) => {
      const newItems = [...prevItems];
      const [movedItem] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, movedItem);
      return newItems;
    });
  };

  const handleGeneratePDF = () => {
    generatePDF(items, layoutConfig);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans text-slate-900 pb-12">
      
      {/* Brand Header */}
      <header className="bg-zinc-900 bg-gradient-to-r from-zinc-900 via-[#1a1a1a] to-zinc-900 pt-8 pb-20 border-b border-white/5 relative overflow-hidden">
         {/* Background Detail */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand-yellow/5 rounded-[100%] blur-[100px] pointer-events-none opacity-50"></div>
         
         {/* Grid Pattern Overlay */}
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>

         <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
               
               {/* Logo Section */}
               <div className="flex items-center gap-6 group">
                  <div className="relative">
                      <div className="absolute inset-0 bg-brand-yellow blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500 rounded-full"></div>
                      <div className="relative w-16 h-16 bg-gradient-to-br from-brand-yellow to-yellow-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-yellow-500/20 shrink-0 border border-white/10">
                         <Wrench className="w-8 h-8 text-zinc-900 drop-shadow-sm" strokeWidth={2.5} />
                      </div>
                  </div>
                  
                  <div className="flex flex-col">
                    <h1 className="text-4xl font-black text-white tracking-tighter leading-none font-sans drop-shadow-lg">
                      STAR<span className="text-brand-yellow">TOOLS</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-2">
                       <span className="h-px w-8 bg-gradient-to-r from-brand-yellow to-transparent"></span>
                       <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em] shadow-black drop-shadow-md">
                         Gerador de Etiquetas
                       </p>
                    </div>
                  </div>
               </div>
               
               {/* Right Info Section */}
               <div className="flex items-center gap-4">
                  <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-xs font-semibold text-zinc-300">Sistema Online</span>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-gradient-to-r from-zinc-800 to-zinc-900 rounded-xl px-5 py-2.5 shadow-lg border border-white/10 ring-1 ring-white/5">
                      <div className="bg-brand-yellow/10 p-1.5 rounded-lg">
                        <Zap className="w-4 h-4 text-brand-yellow" fill="currentColor" />
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[10px] text-zinc-500 font-bold uppercase leading-none mb-0.5">Versão</span>
                         <span className="text-sm font-bold text-white leading-none">Enterprise 2.0</span>
                      </div>
                  </div>
               </div>
            </div>
         </div>
      </header>

      {/* Main Content - Overlapping Card Layout */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        
        {/* Type Selector Bar */}
        <div className="bg-white rounded-xl shadow-2xl shadow-black/5 border border-gray-100 p-2 flex flex-col sm:flex-row gap-2 mb-8 ring-1 ring-black/5">
          <button
            onClick={() => setBarcodeType('GTIN-13')}
            className={`flex-1 relative group p-5 rounded-lg transition-all duration-300 flex items-center justify-center sm:justify-start gap-4 ${
              !isGtin14 
                ? 'bg-gradient-to-br from-brand-yellow to-[#e5b228] text-brand-black shadow-lg shadow-yellow-500/20 translate-y-[-2px]' 
                : 'hover:bg-gray-50 text-gray-500 bg-white'
            }`}
          >
            <div className={`p-3 rounded-xl ${!isGtin14 ? 'bg-black/10 text-brand-black' : 'bg-gray-100 text-gray-500'} transition-colors`}>
              <ShoppingBag className="w-6 h-6" strokeWidth={isGtin14 ? 2 : 2.5} />
            </div>
            <div className="text-left">
              <h3 className={`font-bold text-base ${!isGtin14 ? 'text-brand-black' : 'text-gray-700'}`}>GTIN-13 (Varejo)</h3>
              <p className={`text-xs mt-0.5 ${!isGtin14 ? 'text-black/70 font-medium' : 'text-gray-400'}`}>Etiquetas de gôndola e produtos</p>
            </div>
            {!isGtin14 && (
              <div className="absolute top-4 right-4 bg-white/20 p-1 rounded-full backdrop-blur-sm">
                <CheckCircle2 className="w-5 h-5 text-brand-black" />
              </div>
            )}
          </button>

          <button
            onClick={() => setBarcodeType('GTIN-14')}
            className={`flex-1 relative group p-5 rounded-lg transition-all duration-300 flex items-center justify-center sm:justify-start gap-4 ${
              isGtin14 
                ? 'bg-gradient-to-br from-brand-yellow to-[#e5b228] text-brand-black shadow-lg shadow-yellow-500/20 translate-y-[-2px]' 
                : 'hover:bg-gray-50 text-gray-500 bg-white'
            }`}
          >
            <div className={`p-3 rounded-xl ${isGtin14 ? 'bg-black/10 text-brand-black' : 'bg-gray-100 text-gray-500'} transition-colors`}>
              <Package className="w-6 h-6" strokeWidth={!isGtin14 ? 2 : 2.5} />
            </div>
            <div className="text-left">
              <h3 className={`font-bold text-base ${isGtin14 ? 'text-brand-black' : 'text-gray-700'}`}>GTIN-14 (Logística)</h3>
              <p className={`text-xs mt-0.5 ${isGtin14 ? 'text-black/70 font-medium' : 'text-gray-400'}`}>Etiquetas para caixas master</p>
            </div>
            {isGtin14 && (
              <div className="absolute top-4 right-4 bg-white/20 p-1 rounded-full backdrop-blur-sm">
                <CheckCircle2 className="w-5 h-5 text-brand-black" />
              </div>
            )}
          </button>
        </div>

        {/* Workspace Grid */}
        <main className="grid grid-cols-1 gap-8 pb-12">
          <section className="animate-in slide-in-from-bottom-4 duration-500 fade-in">
            <BarcodeForm 
              onAdd={handleAddItems} 
              barcodeType={barcodeType}
            />
          </section>
          
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
             <section className="animate-in slide-in-from-bottom-6 duration-700 fade-in">
               <LayoutControl 
                 config={layoutConfig} 
                 onChange={setLayoutConfig}
                 barcodeType={barcodeType}
                 items={items}
               />
             </section>
             
             <section className="animate-in slide-in-from-bottom-8 duration-1000 fade-in">
               <BarcodeList 
                 items={items} 
                 onRemove={handleRemoveItem} 
                 onClearAll={handleClearAll}
                 onReorder={handleReorderItems}
                 onGenerate={handleGeneratePDF}
                 barcodeType={barcodeType}
               />
             </section>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center pb-8 pt-4 flex flex-col items-center gap-4">
           <div className="w-16 h-1 bg-gray-200 rounded-full"></div>
           <p className="text-sm text-gray-500 font-medium">
             &copy; {new Date().getFullYear()} <span className="text-brand-black font-bold">Startools Ferramentas</span>. Todos os direitos reservados.
           </p>
        </footer>
      </div>
    </div>
  );
};

export default App;
