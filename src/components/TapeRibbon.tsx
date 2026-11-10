import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Trash2, 
  Search, 
  Ban, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Clock,
  Download
} from 'lucide-react';
import { TransactionRecord, OperationType } from '../types';
import { formatCurrency } from '../data/transactionCodes';

interface TapeRibbonProps {
  records: TransactionRecord[];
  initialBalance: number;
  currentBalance: number;
  onVoidTransaction: (id: string, reason: string) => void;
  onPrintTape: () => void;
  onExportExcel: () => void;
}

export const TapeRibbon: React.FC<TapeRibbonProps> = ({
  records,
  initialBalance,
  currentBalance,
  onVoidTransaction,
  onPrintTape,
  onExportExcel,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'INGRESO' | 'EGRESO' | 'VOIDED'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState<string>('Error de digitación en ventanilla');

  // Filter records
  const filteredRecords = records.filter((rec) => {
    if (filterType === 'INGRESO' && rec.type !== 'INGRESO') return false;
    if (filterType === 'EGRESO' && rec.type !== 'EGRESO') return false;
    if (filterType === 'VOIDED' && !rec.isVoided) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matches =
        rec.code.toLowerCase().includes(term) ||
        rec.codeName.toLowerCase().includes(term) ||
        rec.reference.toLowerCase().includes(term) ||
        rec.amount.toString().includes(term);
      if (!matches) return false;
    }

    return true;
  });

  const activeRecords = records.filter((r) => !r.isVoided);
  const totalIncome = activeRecords
    .filter((r) => r.type === 'INGRESO')
    .reduce((acc, r) => acc + r.amount, 0);
  const totalExpense = activeRecords
    .filter((r) => r.type === 'EGRESO')
    .reduce((acc, r) => acc + r.amount, 0);

  const confirmVoid = (id: string) => {
    onVoidTransaction(id, voidReason);
    setVoidingId(null);
    setVoidReason('Error de digitación en ventanilla');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
      {/* Ribbon Header */}
      <div className="p-4 bg-slate-900 text-white border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-wide text-white">CINTA DE AUDITORÍA</span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-600/80 text-white font-mono">
              {records.length} {records.length === 1 ? 'movimiento' : 'movimientos'}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Registro continuo cronológico de operaciones de caja
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onExportExcel}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors border border-slate-700"
            title="Descargar reporte en formato Excel (CSV con UTF-8)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Exportar Excel</span>
          </button>

          <button
            type="button"
            onClick={onPrintTape}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors border border-slate-700"
            title="Imprimir cinta de auditoría"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Imprimir Cinta</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2">
        {/* Segmented Filter */}
        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'ALL', label: 'Todas' },
            { id: 'INGRESO', label: 'Ingresos (+)' },
            { id: 'EGRESO', label: 'Egresos (-)' },
            { id: 'VOIDED', label: 'Anuladas' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id as typeof filterType)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                filterType === tab.id
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-300 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-48">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar en cinta..."
            className="w-full pl-7 pr-2 py-1 text-xs bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1.5" />
        </div>
      </div>

      {/* Ribbon Paper Tape Body */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[520px] bg-amber-50/15">
        {/* Opening Balance Row */}
        <div className="p-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-500 font-bold">#000</span>
            <span className="font-semibold text-slate-700">FONDO INICIAL DE APERTURA</span>
          </div>
          <div className="font-mono font-bold text-slate-900 text-sm">
            {formatCurrency(initialBalance)}
          </div>
        </div>

        {/* Transaction Records List */}
        {filteredRecords.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">
            <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-medium text-slate-600">No hay movimientos en esta vista</p>
            <p className="mt-1">
              {records.length === 0
                ? 'Ingrese un código y presione + o - para registrar transacciones.'
                : 'Intente cambiando los filtros o el término de búsqueda.'}
            </p>
          </div>
        ) : (
          filteredRecords.map((item) => (
            <div
              key={item.id}
              className={`p-3 transition-colors ${
                item.isVoided
                  ? 'bg-slate-100/80 opacity-60 line-through'
                  : 'hover:bg-blue-50/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                {/* Left: Correlative, Code, Name, Reference */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      #{String(item.correlative).padStart(3, '0')}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 border border-slate-200 text-slate-800">
                      {item.code}
                    </span>
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {item.codeName}
                    </span>
                  </div>

                  {/* Reference & Category */}
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                    <span className="truncate">{item.category}</span>
                    {item.reference && (
                      <>
                        <span>·</span>
                        <span className="text-slate-700 font-medium truncate">Ref: {item.reference}</span>
                      </>
                    )}
                    {item.isVoided && (
                      <span className="text-rose-600 font-bold ml-1">
                        (ANULADA: {item.voidReason || 'Error'})
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Operation Amount & Balance After */}
                <div className="text-right shrink-0">
                  <div
                    className={`font-mono font-bold text-sm flex items-center justify-end gap-1 ${
                      item.isVoided
                        ? 'text-slate-400'
                        : item.type === 'INGRESO'
                        ? 'text-emerald-700'
                        : 'text-rose-700'
                    }`}
                  >
                    <span>{item.type === 'INGRESO' ? '+' : '-'}</span>
                    <span>{formatCurrency(item.amount)}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                    Saldo: {formatCurrency(item.balanceAfter)}
                  </div>
                </div>

                {/* Void Action */}
                {!item.isVoided && (
                  <div className="shrink-0 self-center ml-1">
                    <button
                      type="button"
                      onClick={() => setVoidingId(item.id)}
                      className="p-1 text-slate-300 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                      title="Anular este movimiento"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* In-place Void Confirmation Dialog */}
              {voidingId === item.id && (
                <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs space-y-2">
                  <div className="font-semibold text-rose-900">
                    ¿Confirmar anulación del movimiento #{String(item.correlative).padStart(3, '0')}?
                  </div>
                  <input
                    type="text"
                    value={voidReason}
                    onChange={(e) => setVoidReason(e.target.value)}
                    placeholder="Motivo de anulación..."
                    className="w-full px-2 py-1 bg-white border border-rose-300 rounded text-xs text-slate-800 outline-none"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setVoidingId(null)}
                      className="px-2 py-1 text-slate-600 hover:text-slate-800"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmVoid(item.id)}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded"
                    >
                      Confirmar Anulación
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Ribbon Footer Summary */}
      <div className="p-3.5 bg-slate-100 border-t border-slate-200">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Total Ingresos (+)</div>
            <div className="font-mono font-bold text-emerald-700 text-sm">
              +{formatCurrency(totalIncome)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Total Egresos (-)</div>
            <div className="font-mono font-bold text-rose-700 text-sm">
              -{formatCurrency(totalExpense)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-500">Saldo Final Teórico</div>
            <div className="font-mono font-bold text-slate-900 text-base">
              {formatCurrency(currentBalance)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
