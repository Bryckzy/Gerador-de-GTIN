import React, { useState } from 'react';
import { Plus, AlertCircle, CheckCircle2, ListPlus } from 'lucide-react';
import { BarcodeItem, BarcodeType } from '../types';
import { validateBarcode } from '../utils/validators';

interface BarcodeFormProps {
  onAdd: (items: Omit<BarcodeItem, 'id'>[]) => void;
  barcodeType: BarcodeType;
}

type Tab = 'single' | 'bulk';

const BarcodeForm: React.FC<BarcodeFormProps> = ({ onAdd, barcodeType }) => {
  const [activeTab, setActiveTab] = useState<Tab>('single');
  
  // Theme Colors
  const isGtin14 = barcodeType === 'GTIN-14';
  const themeColor = isGtin14 ? 'amber' : 'indigo';
  
  // Single State
  const [description, setDescription] = useState('');
  const [gtin, setGtin] = useState('');
  const [singleError, setSingleError] = useState<string | null>(null);

  // Bulk State
  const [bulkText, setBulkText] = useState('');
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);

  // Single Submission
  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSingleError(null);

    if (!description.trim()) {
      setSingleError('A descrição é obrigatória.');
      return;
    }

    if (!validateBarcode(gtin, barcodeType)) {
      setSingleError(`Código ${barcodeType} inválido. Verifique os ${isGtin14 ? 14 : 13} dígitos e o dígito verificador.`);
      return;
    }

    onAdd([{ description, gtin, type: barcodeType }]);
    setDescription('');
    setGtin('');
  };

  const handleGtinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const maxLength = isGtin14 ? 14 : 13;
    const value = e.target.value.replace(/\D/g, '').slice(0, maxLength);
    setGtin(value);
    if (singleError) setSingleError(null);
  };

  // Bulk Submission
  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBulkError(null);
    setBulkSuccessMsg(null);

    if (!bulkText.trim()) return;

    const lines = bulkText.split('\n');
    const validItems: Omit<BarcodeItem, 'id'>[] = [];
    const errors: string[] = [];
    
    const requiredLength = isGtin14 ? 14 : 13;
    const regex = new RegExp(`\\d{${requiredLength}}`);

    lines.forEach((line, index) => {
      if (!line.trim()) return;

      // Find the sequence of digits
      const potentialGtinMatch = line.match(regex);
      
      if (potentialGtinMatch) {
        const extractedGtin = potentialGtinMatch[0];
        if (validateBarcode(extractedGtin, barcodeType)) {
           // Description is everything else cleaned up
           const rawDesc = line.replace(extractedGtin, '').replace(/[,;]/g, ' ').trim();
           const desc = rawDesc || "Item sem descrição";
           validItems.push({ description: desc, gtin: extractedGtin, type: barcodeType });
        } else {
           errors.push(`Linha ${index + 1}: ${barcodeType} inválido (Dígito verificador incorreto).`);
        }
      } else {
        errors.push(`Linha ${index + 1}: Nenhum código de ${requiredLength} dígitos encontrado.`);
      }
    });

    if (validItems.length > 0) {
      onAdd(validItems);
      setBulkText('');
      setBulkSuccessMsg(`Sucesso! ${validItems.length} itens adicionados.`);
    }

    if (errors.length > 0) {
      setBulkError(`Alguns itens não foram adicionados:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? '\n...' : ''}`);
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 mb-8 overflow-hidden`}>
      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('single')}
          className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'single' 
              ? `bg-white text-${themeColor}-600 border-b-2 border-${themeColor}-600` 
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-b-2 border-transparent'
          }`}
        >
          <Plus className="w-4 h-4" />
          Adicionar Unitário
        </button>
        <button
          onClick={() => setActiveTab('bulk')}
          className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'bulk' 
              ? `bg-white text-${themeColor}-600 border-b-2 border-${themeColor}-600` 
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-b-2 border-transparent'
          }`}
        >
          <ListPlus className="w-4 h-4" />
          Importar em Massa
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'single' ? (
          <form onSubmit={handleSingleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Descrição do Produto</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Camiseta Polo Azul M"
                  className={`w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-${themeColor}-500 focus:border-${themeColor}-500 outline-none transition-all`}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Código {barcodeType}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={gtin}
                    onChange={handleGtinChange}
                    placeholder={isGtin14 ? "1789..." : "789..."}
                    className={`w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-${themeColor}-500 focus:border-${themeColor}-500 outline-none font-mono transition-all`}
                  />
                  {gtin.length === (isGtin14 ? 14 : 13) && (
                     <div className="absolute right-3 top-1/2 -translate-y-1/2">
                       {validateBarcode(gtin, barcodeType) ? (
                         <CheckCircle2 className="w-5 h-5 text-green-500" />
                       ) : (
                         <AlertCircle className="w-5 h-5 text-red-500" />
                       )}
                     </div>
                  )}
                </div>
              </div>
            </div>
            
            {singleError && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {singleError}
              </div>
            )}

            <button type="submit" className={`w-full bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white font-medium py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2`}>
              <Plus className="w-4 h-4" /> Adicionar à Lista
            </button>
          </form>
        ) : (
          <form onSubmit={handleBulkSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 flex justify-between">
                <span>Cole seus dados aqui (Linha por linha)</span>
                <span className="text-xs text-slate-400 font-normal">Formato: Descrição, {barcodeType}</span>
              </label>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={isGtin14 ? `Caixa Master, 17891234567892\n...` : `Camiseta, 7891234567895\n...`}
                className={`w-full h-32 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-${themeColor}-500 focus:border-${themeColor}-500 outline-none font-mono text-sm`}
              />
            </div>

            {bulkError && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg whitespace-pre-wrap">
                {bulkError}
              </div>
            )}
            
            {bulkSuccessMsg && (
              <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {bulkSuccessMsg}
              </div>
            )}

            <button type="submit" className={`w-full bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white font-medium py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2`}>
              <ListPlus className="w-4 h-4" /> Processar Lista
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default BarcodeForm;