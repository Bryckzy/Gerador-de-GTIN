
import React, { useState } from 'react';
import { Trash2, FileDown, PackageX, Search, Eraser } from 'lucide-react';
import { BarcodeItem, BarcodeType } from '../types';

interface BarcodeListProps {
  items: BarcodeItem[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
  onGenerate: () => void;
  barcodeType: BarcodeType; // For theming
}

const BarcodeList: React.FC<BarcodeListProps> = ({ items, onRemove, onClearAll, onGenerate, barcodeType }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const isGtin14 = barcodeType === 'GTIN-14';
  const themeColor = isGtin14 ? 'amber' : 'indigo';

  const filteredItems = items.filter(item => 
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.gtin.includes(searchTerm)
  );

  const handleClearAllConfirm = () => {
    if (items.length === 0) return;
    
    // Using a simple window.confirm is reliable, but let's ensure the button isn't treating it as a submit
    if (window.confirm(`Tem certeza que deseja remover todos os ${items.length} itens da lista?`)) {
      onClearAll();
      setSearchTerm('');
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <PackageX className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">Nenhum item adicionado</h3>
        <p className="text-slate-500 mt-1">Adicione descrições e códigos acima para gerar suas etiquetas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <h2 className="text-lg font-semibold text-slate-800">
          Itens para Impressão 
          <span className="text-slate-400 text-sm font-normal ml-2">
            ({filteredItems.length !== items.length ? `${filteredItems.length} de ` : ''}{items.length} itens)
          </span>
        </h2>
        
        <div className="flex gap-2">
          <button
            type="button" // Explicitly button type
            onClick={handleClearAllConfirm}
            className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 font-medium rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            <Eraser className="w-4 h-4" />
            Limpar Lista
          </button>
          
          <button
            type="button"
            onClick={onGenerate}
            className={`px-6 py-2 bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm shadow-${themeColor}-600/20 text-sm`}
          >
            <FileDown className="w-4 h-4" />
            Baixar PDF
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Pesquisar por descrição ou código..."
          className={`block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 focus:border-${themeColor}-500 sm:text-sm`}
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">Descrição</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Tipo</th>
                <th className="px-6 py-4 font-semibold text-slate-700 w-48">Código</th>
                <th className="px-6 py-4 font-semibold text-slate-700 w-24 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{item.description}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        item.type === 'GTIN-14' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">{item.gtin}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Remover item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">
                    Nenhum item encontrado para "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BarcodeList;
