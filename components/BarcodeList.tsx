
import React, { useState, useRef } from 'react';
import { Trash2, FileDown, PackageX, Search, Eraser, AlertTriangle, GripVertical, Tag, Package } from 'lucide-react';
import { BarcodeItem, BarcodeType } from '../types';

interface BarcodeListProps {
  items: BarcodeItem[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
  onGenerate: () => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  barcodeType: BarcodeType; 
}

const BarcodeList: React.FC<BarcodeListProps> = ({ items, onRemove, onClearAll, onGenerate, onReorder, barcodeType }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Refs for Drag and Drop to maintain state without re-rendering loops
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  
  const filteredItems = items.filter(item => 
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.gtin.includes(searchTerm)
  );

  // Sorting is only allowed when not searching/filtering
  const isDraggable = searchTerm === '';

  const confirmClearAll = () => {
    onClearAll();
    setShowDeleteConfirm(false);
    setSearchTerm('');
  };

  // --- Real-time Drag Handlers ---

  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, position: number) => {
    dragItem.current = position;
    // Optional: Add a class to the row being dragged for styling
    e.currentTarget.classList.add('opacity-50', 'bg-yellow-50');
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (e: React.DragEvent<HTMLTableRowElement>, position: number) => {
    // This creates the "live sort" effect.
    // As soon as we hover over another item, we swap them in the state.
    
    if (dragItem.current === null) return;
    if (dragItem.current === position) return;

    // Execute the reorder in the parent state immediately
    onReorder(dragItem.current, position);
    
    // Update our reference to track the dragged item's new position
    dragItem.current = position;
  };

  const handleDragEnd = (e: React.DragEvent<HTMLTableRowElement>) => {
    // Cleanup styles
    e.currentTarget.classList.remove('opacity-50', 'bg-yellow-50');
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleDragOver = (e: React.DragEvent) => {
    // Necessary to allow dropping
    e.preventDefault();
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
        <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
          <PackageX className="w-10 h-10 text-gray-300" />
        </div>
        <h3 className="text-xl font-bold text-gray-800">Lista Vazia</h3>
        <p className="text-gray-500 mt-2 max-w-sm mx-auto text-sm">
          Adicione itens manualmente, cole uma lista ou importe uma planilha.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Action Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
         
         <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar lista..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow outline-none text-sm transition-all"
            />
         </div>

         <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-1 md:flex-none px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm border border-red-100"
            >
              <Eraser className="w-4 h-4" />
              Limpar ({items.length})
            </button>
            
            <button
              type="button"
              onClick={onGenerate}
              className="flex-1 md:flex-none px-6 py-2 bg-brand-black hover:bg-gray-900 text-brand-yellow font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10 text-sm transform hover:-translate-y-0.5"
            >
              <FileDown className="w-4 h-4" />
              Gerar PDF
            </button>
         </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {isDraggable && <th className="px-4 py-4 w-10"></th>}
                <th className="px-6 py-4 font-bold text-gray-600 uppercase tracking-wider text-xs">Produto</th>
                <th className="px-6 py-4 font-bold text-gray-600 uppercase tracking-wider text-xs w-32 text-center">Tipo</th>
                <th className="px-6 py-4 font-bold text-gray-600 uppercase tracking-wider text-xs w-48">Código</th>
                <th className="px-6 py-4 font-bold text-gray-600 uppercase tracking-wider text-xs w-24 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => (
                  <tr 
                    key={item.id} 
                    draggable={isDraggable}
                    onDragStart={(e) => isDraggable && handleDragStart(e, index)}
                    onDragEnter={(e) => isDraggable && handleDragEnter(e, index)}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    className={`
                      transition-all duration-200 ease-in-out group hover:bg-gray-50
                      ${isDraggable ? 'cursor-move' : ''}
                    `}
                  >
                    {isDraggable && (
                      <td className="px-4 py-4 text-gray-300">
                        <GripVertical className="w-4 h-4 mx-auto text-gray-300 group-hover:text-gray-500 cursor-grab active:cursor-grabbing" />
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-800">{item.description}</div>
                      <div className="text-xs text-gray-400 mt-0.5 font-mono">ID: {item.id.slice(0,8)}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                        {item.type === 'GTIN-14' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-sm">
                                <Package className="w-3 h-3" /> GTIN-14
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm">
                                <Tag className="w-3 h-3" /> GTIN-13
                            </span>
                        )}
                    </td>
                    <td className="px-6 py-4">
                       <span className="font-mono text-sm px-2 py-1 rounded bg-gray-100 text-gray-600 group-hover:bg-white group-hover:shadow-sm border border-transparent group-hover:border-gray-200 transition-all">
                         {item.gtin}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Remover item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isDraggable ? 5 : 4} className="px-6 py-12 text-center text-gray-400 italic">
                    Nenhum item encontrado para "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
           <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                 <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-center text-gray-900">Excluir tudo?</h3>
              <p className="text-center text-gray-500 mt-2 mb-6">
                 Você está prestes a remover todos os {items.length} itens da lista. Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                 <button 
                   onClick={() => setShowDeleteConfirm(false)}
                   className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                 >
                   Cancelar
                 </button>
                 <button 
                   onClick={confirmClearAll}
                   className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 shadow-md shadow-red-500/20"
                 >
                   Sim, excluir
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default BarcodeList;
