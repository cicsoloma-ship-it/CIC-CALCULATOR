import React, { useState } from 'react';
import { 
  X, 
  Search, 
  BookOpen, 
  ArrowUpRight, 
  ArrowDownRight, 
  ChevronDown, 
  ChevronRight,
  FolderOpen,
  Check
} from 'lucide-react';
import { CIC_TRANSACTION_CODES } from '../data/transactionCodes';
import { TransactionCode } from '../types';

interface CodeDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCode: (code: string) => void;
}

export const CodeDirectoryModal: React.FC<CodeDirectoryModalProps> = ({
  isOpen,
  onClose,
  onSelectCode,
}) => {
  if (!isOpen) return null;

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    '0-CAJA': true,
    '1-DEPOSITOS': true,
    '2-PAGO DE CREDITOS': true,
    '3-OTROS INGRESOS': true,
    '4-Autorización Monto TC': true,
    '6-BÓVEDA': true,
    '7-BANCO': true,
    '8-COMPRA/VENTA DOLARES': true,
    '9-REVERSIONES': true,
    '10-CONSULTAS/REPORTES': true,
  });

  // Group codes by category
  const categories = Array.from(new Set(CIC_TRANSACTION_CODES.map((c) => c.category)));

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  const handleSelect = (code: string) => {
    onSelectCode(code);
    onClose();
  };

  const filteredCodes = CIC_TRANSACTION_CODES.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.code.toLowerCase().includes(term) ||
      c.name.toLowerCase().includes(term) ||
      c.category.toLowerCase().includes(term) ||
      c.description.toLowerCase().includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg text-white">
                Catálogo Oficial de Códigos de Transacción · CIC R.L.
              </h2>
              <p className="text-xs text-slate-400">
                Seleccione un código para cargar tipo de operación e iniciar el cálculo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200">
          <div className="relative">
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código (ej. 201, 101, 401, 601, 602, 304) o nombre..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Categories & Codes Tree */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {searchTerm.trim() ? (
            /* Flat search results */
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Resultados coincidentes ({filteredCodes.length})
              </div>
              {filteredCodes.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleSelect(item.code)}
                  className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center justify-between gap-3 group transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-sm bg-slate-100 group-hover:bg-blue-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                      {item.code}
                    </span>
                    <div>
                      <div className="font-bold text-sm text-slate-800 group-hover:text-blue-900">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {item.category} · {item.description}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-1 rounded text-xs font-bold font-mono shrink-0 flex items-center gap-1 ${
                      item.defaultType === 'INGRESO'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {item.defaultType === 'INGRESO' ? '+' : '-'} {item.defaultType}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            /* Grouped Hierarchical View */
            categories.map((cat) => {
              const catCodes = CIC_TRANSACTION_CODES.filter((c) => c.category === cat);
              const isExpanded = expandedCategories[cat] ?? true;

              return (
                <div key={cat} className="border border-slate-200 rounded-xl overflow-hidden">
                  {/* Category Header */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200/80 flex items-center justify-between text-left transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-600" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                      )}
                      <FolderOpen className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-xs uppercase tracking-wide text-slate-800">
                        {cat}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {catCodes.length} {catCodes.length === 1 ? 'código' : 'códigos'}
                    </span>
                  </button>

                  {/* Codes under category */}
                  {isExpanded && (
                    <div className="divide-y divide-slate-100 bg-white">
                      {catCodes.map((item) => (
                        <button
                          key={item.code}
                          type="button"
                          onClick={() => handleSelect(item.code)}
                          className="w-full text-left p-2.5 hover:bg-blue-50/50 flex items-center justify-between gap-3 group transition-colors"
                        >
                          <div className="flex items-center gap-2.5 pl-6">
                            <span className="font-mono font-bold text-xs bg-slate-100 group-hover:bg-blue-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                              {item.code}
                            </span>
                            <div>
                              <div className="font-semibold text-xs text-slate-800 group-hover:text-blue-900">
                                {item.name}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {item.description}
                              </div>
                            </div>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono shrink-0 ${
                              item.defaultType === 'INGRESO'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {item.defaultType === 'INGRESO' ? '+' : '-'} {item.defaultType}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
