
import React, { useState, useRef } from 'react';
import { Plus, AlertCircle, CheckCircle2, FileSpreadsheet, Upload, Download, ClipboardPaste, X } from 'lucide-react';
import { BarcodeItem, BarcodeType } from '../types';
import { validateBarcode } from '../utils/validators';
import * as XLSX from 'xlsx';

interface BarcodeFormProps {
  onAdd: (items: Omit<BarcodeItem, 'id'>[]) => void;
  barcodeType: BarcodeType;
}

type Tab = 'single' | 'paste' | 'file';

const BarcodeForm: React.FC<BarcodeFormProps> = ({ onAdd, barcodeType }) => {
  const [activeTab, setActiveTab] = useState<Tab>('single');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isGtin14 = barcodeType === 'GTIN-14';

  // --- States ---
  // Single
  const [description, setDescription] = useState('');
  const [gtin, setGtin] = useState('');
  const [singleError, setSingleError] = useState<string | null>(null);

  // Paste
  const [pasteContent, setPasteContent] = useState('');
  const [pasteFeedback, setPasteFeedback] = useState<{count: number, errors: number} | null>(null);

  // File
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{type: 'success' | 'error', msg: string} | null>(null);

  // --- Handlers ---

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSingleError(null);

    if (!description.trim()) {
      setSingleError('A descrição é obrigatória.');
      return;
    }

    if (!validateBarcode(gtin, barcodeType)) {
      setSingleError(`Código ${barcodeType} inválido.`);
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
    setSingleError(null);
  };

  const handlePasteProcess = () => {
    if (!pasteContent.trim()) return;

    const lines = pasteContent.split(/\r?\n/);
    const validItems: Omit<BarcodeItem, 'id'>[] = [];
    let errorCount = 0;

    lines.forEach(line => {
        if (!line.trim()) return;
        
        // Try to split by tab, comma, or semicolon
        const parts = line.split(/[\t,;]+/);
        if (parts.length >= 2) {
            // Check which part is the code
            let desc = parts[0].trim();
            let code = parts[1].replace(/\D/g, '');

            if (!validateBarcode(code, barcodeType)) {
                // Try swapping
                const swapCode = parts[0].replace(/\D/g, '');
                if (validateBarcode(swapCode, barcodeType)) {
                    code = swapCode;
                    desc = parts[1].trim();
                }
            }

            if (validateBarcode(code, barcodeType)) {
                validItems.push({ description: desc, gtin: code, type: barcodeType });
            } else {
                errorCount++;
            }
        }
    });

    if (validItems.length > 0) {
        onAdd(validItems);
        setPasteContent('');
        setPasteFeedback({ count: validItems.length, errors: errorCount });
        setTimeout(() => setPasteFeedback(null), 5000);
    } else {
        setPasteFeedback({ count: 0, errors: lines.length }); // All failed or empty
    }
  };

  const downloadTemplate = () => {
    const headers = ['Descricao', 'Codigo'];
    const example = isGtin14 
      ? ['Caixa Master Exemplo', '17891234567892'] 
      : ['Produto Exemplo', '7891234567895'];
    
    const ws = XLSX.utils.aoa_to_sheet([headers, example]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo");
    XLSX.writeFile(wb, "modelo_startools.xlsx");
  };

  const processFile = async (file: File) => {
    setProcessing(true);
    setUploadFeedback(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
      
      if (rows.length < 2) throw new Error("Arquivo vazio.");

      const validItems: Omit<BarcodeItem, 'id'>[] = [];
      let errors = 0;

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        const cleanRow = row.filter((c: any) => c !== null && c !== undefined && String(c).trim() !== '');
        
        if (cleanRow.length >= 2) {
           const valA = String(cleanRow[0]).trim();
           const valB = String(cleanRow[1]).trim();
           let potentialCode = valB.replace(/\D/g, '');
           let potentialDesc = valA;

           if (!validateBarcode(potentialCode, barcodeType)) {
              const swapCode = valA.replace(/\D/g, '');
              if (validateBarcode(swapCode, barcodeType)) {
                 potentialCode = swapCode;
                 potentialDesc = valB;
              }
           }

           if (validateBarcode(potentialCode, barcodeType)) {
             validItems.push({ description: potentialDesc, gtin: potentialCode, type: barcodeType });
           } else {
             errors++;
           }
        }
      }

      if (validItems.length > 0) {
        onAdd(validItems);
        setUploadFeedback({ 
            type: 'success', 
            msg: `Importado: ${validItems.length} itens. ${errors > 0 ? `(${errors} inválidos)` : ''}` 
        });
      } else {
        setUploadFeedback({ type: 'error', msg: "Nenhum código válido encontrado." });
      }

    } catch (err) {
      setUploadFeedback({ type: 'error', msg: "Erro ao ler arquivo." });
    } finally {
      setProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  };

  const activeTabClass = "text-brand-black border-b-2 border-brand-yellow bg-yellow-50/50";
  const inactiveTabClass = "text-gray-500 hover:text-brand-black hover:bg-gray-50";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setActiveTab('single')}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'single' ? activeTabClass : inactiveTabClass}`}
        >
          <Plus className="w-4 h-4" /> Manual
        </button>
        <button
          onClick={() => setActiveTab('paste')}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'paste' ? activeTabClass : inactiveTabClass}`}
        >
          <ClipboardPaste className="w-4 h-4" /> Colar Lista
        </button>
        <button
          onClick={() => setActiveTab('file')}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'file' ? activeTabClass : inactiveTabClass}`}
        >
          <FileSpreadsheet className="w-4 h-4" /> Excel/CSV
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'single' && (
          <form onSubmit={handleSingleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Descrição</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Jogo de Chaves Allen"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Código {barcodeType}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={gtin}
                    onChange={handleGtinChange}
                    placeholder={isGtin14 ? "14 dígitos" : "13 dígitos"}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow outline-none font-mono transition-all"
                  />
                  {gtin.length >= (isGtin14 ? 13 : 12) && (
                     <div className="absolute right-3 top-1/2 -translate-y-1/2">
                       {validateBarcode(gtin, barcodeType) ? (
                         <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                       ) : (
                         <AlertCircle className="w-5 h-5 text-red-500" />
                       )}
                     </div>
                  )}
                </div>
              </div>
            </div>
            
            {singleError && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2 border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0" /> {singleError}
              </div>
            )}

            <button type="submit" className="w-full bg-brand-yellow hover:bg-[#E5B228] text-brand-black font-bold py-3 rounded-lg shadow-sm hover:shadow transition-all flex justify-center items-center gap-2">
              <Plus className="w-5 h-5" /> Adicionar à Lista
            </button>
          </form>
        )}

        {activeTab === 'paste' && (
           <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                 <p className="text-sm text-blue-800">
                    <strong>Como usar:</strong> Cole uma lista com cada produto em uma linha. 
                    O formato deve ser "Descrição" e "Código" separados por tabulação, vírgula ou ponto e vírgula.
                 </p>
              </div>
              <textarea
                 value={pasteContent}
                 onChange={(e) => setPasteContent(e.target.value)}
                 placeholder={`Exemplo:\nMartelo de Unha 25mm, 7891234567895\nChave de Fenda Cruzada, 7899876543210`}
                 className="w-full h-40 p-4 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow outline-none font-mono text-sm resize-none"
              />
              {pasteFeedback && (
                 <div className={`p-3 rounded-lg text-sm font-medium ${pasteFeedback.count > 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                    {pasteFeedback.count > 0 ? `${pasteFeedback.count} itens adicionados com sucesso.` : 'Nenhum item válido identificado.'}
                    {pasteFeedback.errors > 0 && ` (${pasteFeedback.errors} linhas ignoradas)`}
                 </div>
              )}
              <button onClick={handlePasteProcess} className="w-full bg-brand-black hover:bg-gray-900 text-white font-bold py-3 rounded-lg shadow-lg transition-all flex justify-center items-center gap-2">
                 <ClipboardPaste className="w-5 h-5" /> Processar Lista
              </button>
           </div>
        )}

        {activeTab === 'file' && (
          <div className="space-y-6">
             <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3">
                   <FileSpreadsheet className="w-6 h-6 text-green-600" />
                   <div className="text-sm">
                      <p className="font-bold text-gray-800">Modelo de Planilha</p>
                      <p className="text-gray-500">Baixe o exemplo .xlsx</p>
                   </div>
                </div>
                <button 
                  onClick={downloadTemplate}
                  className="px-4 py-2 bg-white border border-gray-300 hover:border-brand-black text-gray-700 hover:text-brand-black text-sm font-medium rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" /> Download
                </button>
             </div>

             <div 
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                    dragActive 
                    ? `border-brand-yellow bg-yellow-50` 
                    : 'border-gray-300 hover:border-brand-yellow bg-gray-50/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
             >
                <input 
                  ref={fileInputRef}
                  type="file" 
                  className="hidden" 
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={handleFileChange}
                />
                
                {processing ? (
                   <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-yellow-200 border-t-brand-yellow rounded-full animate-spin"></div>
                      <p className="text-gray-600 font-medium">Lendo arquivo...</p>
                   </div>
                ) : (
                    <div className="flex flex-col items-center gap-3 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <div className="p-4 rounded-full bg-brand-yellow/10 text-brand-black">
                         <Upload className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gray-700">Arraste ou Clique</p>
                        <p className="text-sm text-gray-400 mt-1">Suporta .xlsx, .xls, .csv</p>
                      </div>
                    </div>
                )}
             </div>

             {uploadFeedback && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${
                    uploadFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'
                }`}>
                   {uploadFeedback.type === 'success' ? <CheckCircle2 className="w-5 h-5"/> : <X className="w-5 h-5"/>}
                   <span className="text-sm font-medium">{uploadFeedback.msg}</span>
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BarcodeForm;
