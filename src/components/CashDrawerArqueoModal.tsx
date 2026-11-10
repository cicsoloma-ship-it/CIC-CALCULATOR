import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Coins, 
  Banknote, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  RotateCcw,
  Utensils,
  Flag,
  Check
} from 'lucide-react';
import { 
  GUATEMALA_DENOMINATIONS, 
  formatCurrency, 
  getDenomCount, 
  calculateTotalPhysicalCash 
} from '../data/transactionCodes';
import { PhysicalCount, ArqueoType, ArqueoRecord, Denomination } from '../types';

interface CashDrawerArqueoModalProps {
  isOpen: boolean;
  onClose: () => void;
  theoreticalBalance: number;
  initialCash: number;
  onUpdateInitialCash: (amount: number) => void;
  savedPhysicalCount: PhysicalCount;
  onSaveCount: (count: PhysicalCount, notes: string) => void;
  onSaveArqueoRecord: (record: ArqueoRecord) => void;
  onPrintArqueo: () => void;
  defaultArqueoType?: ArqueoType;
  existingLunchArqueo?: ArqueoRecord;
  existingClosingArqueo?: ArqueoRecord;
  notes: string;
}

export const CashDrawerArqueoModal: React.FC<CashDrawerArqueoModalProps> = ({
  isOpen,
  onClose,
  theoreticalBalance,
  initialCash,
  onUpdateInitialCash,
  savedPhysicalCount,
  onSaveCount,
  onSaveArqueoRecord,
  onPrintArqueo,
  defaultArqueoType = 'ALMUERZO',
  existingLunchArqueo,
  existingClosingArqueo,
  notes: initialNotes,
}) => {
  if (!isOpen) return null;

  const [activeType, setActiveType] = useState<ArqueoType>(defaultArqueoType);
  const [counts, setCounts] = useState<PhysicalCount>(() => ({ ...savedPhysicalCount }));
  const [localNotes, setLocalNotes] = useState<string>(initialNotes || '');

  // Ordered list of denominations for Tab & Enter sequence:
  // First all bills from Q200 down to Q1, then coins from Q1 down to Q0.01
  const bills = GUATEMALA_DENOMINATIONS.filter((d) => d.type === 'billete');
  const coins = GUATEMALA_DENOMINATIONS.filter((d) => d.type === 'moneda');
  const orderedDenominations = [...bills, ...coins];

  // Ref array for quick keyboard navigation between inputs
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Auto-focus first input (Q200) on open
  useEffect(() => {
    const timer = setTimeout(() => {
      const firstId = orderedDenominations[0]?.id;
      if (firstId && inputRefs.current[firstId]) {
        inputRefs.current[firstId]?.focus();
        inputRefs.current[firstId]?.select();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Calculate totals
  const totalPhysicalCash = calculateTotalPhysicalCash(counts);
  const difference = totalPhysicalCash - theoreticalBalance;
  const isExactMatch = Math.abs(difference) < 0.005;

  const handleQuantityChange = (denomId: string, val: string) => {
    // Only accept numeric digits
    const clean = val.replace(/[^0-9]/g, '');
    const qty = clean === '' ? 0 : parseInt(clean, 10);

    setCounts((prev) => ({
      ...prev,
      [denomId]: qty,
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentIndex: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = currentIndex + 1;
      if (nextIndex < orderedDenominations.length) {
        const nextId = orderedDenominations[nextIndex].id;
        inputRefs.current[nextId]?.focus();
        inputRefs.current[nextId]?.select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = currentIndex - 1;
      if (prevIndex >= 0) {
        const prevId = orderedDenominations[prevIndex].id;
        inputRefs.current[prevId]?.focus();
        inputRefs.current[prevId]?.select();
      }
    }
  };

  const handleClearAll = () => {
    const empty: PhysicalCount = {};
    orderedDenominations.forEach((d) => {
      empty[d.id] = 0;
    });
    setCounts(empty);
  };

  const handleSave = () => {
    onUpdateInitialCash(2000.0);
    onSaveCount(counts, localNotes);

    const record: ArqueoRecord = {
      id: `arq-${Date.now()}`,
      type: activeType,
      title: activeType === 'ALMUERZO' ? 'Arqueo de Mediodía (Salida a Almuerzo)' : 'Arqueo de Cierre del Día',
      timestamp: new Date().toISOString(),
      theoreticalBalance,
      physicalCount: counts,
      totalPhysical: totalPhysicalCash,
      difference,
      status: isExactMatch ? 'CUADRADO' : difference > 0 ? 'SOBRANTE' : 'FALTANTE',
      notes: localNotes,
    };

    onSaveArqueoRecord(record);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs no-print">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-sans">
        
        {/* Pestañas de Arqueo, Total Contado, Poner a Cero y Botón Cerrar */}
        <div className="bg-slate-100 p-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveType('ALMUERZO')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeType === 'ALMUERZO'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-300'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>1. Arqueo Mediodía (Almuerzo)</span>
              {existingLunchArqueo && (
                <span className="text-[10px] ml-1 bg-amber-200 px-1.5 py-0.2 rounded-full font-mono font-bold">
                  {existingLunchArqueo.status === 'CUADRADO' ? '✓ OK' : '! DIF'}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveType('CIERRE_DIA')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeType === 'CIERRE_DIA'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-300'
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              <span>2. Arqueo Cierre del Día</span>
              {existingClosingArqueo && (
                <span className="text-[10px] ml-1 bg-blue-200 text-blue-900 px-1.5 py-0.2 rounded-full font-mono font-bold">
                  {existingClosingArqueo.status === 'CUADRADO' ? '✓ OK' : '! DIF'}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-700 bg-white border border-slate-300 px-3 py-1.5 rounded-lg shadow-2xs">
              Total Contado: <strong>{formatCurrency(totalPhysicalCash)}</strong>
            </span>
            <button
              type="button"
              onClick={handleClearAll}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              title="Borrar todas las cantidades y reiniciar conteo"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Poner a cero</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer ml-1"
              title="Cerrar ventana (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PANEL DE DIFERENCIA: APARECE ÚNICAMENTE SI HAY DIFERENCIA (Sobrante o Faltante) */}
        {!isExactMatch && (
          <div className={`p-3.5 mx-4 sm:mx-6 mt-3 rounded-2xl border shrink-0 transition-all shadow-xs flex items-center justify-between gap-3 ${
            difference > 0
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                difference > 0 ? 'bg-amber-500 text-slate-950' : 'bg-rose-600 text-white'
              }`}>
                <AlertCircle className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm">
                  {difference > 0 ? 'SOBRANTE DE EFECTIVO EN GAVETA' : 'FALTANTE DE EFECTIVO SEGÚN REGISTROS'}
                </div>
                <div className="text-[11px] opacity-80 font-mono">
                  Contado: {formatCurrency(totalPhysicalCash)} · Registros: {formatCurrency(theoreticalBalance)}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-[10px] uppercase font-bold text-slate-500">Diferencia</div>
              <div className={`text-base font-black font-mono ${
                difference > 0 ? 'text-amber-800' : 'text-rose-700'
              }`}>
                {difference > 0 ? '+' : ''}{formatCurrency(difference)}
              </div>
            </div>
          </div>
        )}

        {/* CUERPO SCROLLEABLE CON ENTRADAS NUMÉRICAS DIRECTAS (Sin botones +/-) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* COLUMNA 1: BILLETES (Tabulación secuencial: Q200 -> Q100 -> Q50 -> Q20 -> Q10 -> Q5 -> Q1) */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
              <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <Banknote className="w-4 h-4 text-blue-600" />
                  <span>Billetes de Guatemala</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-800">
                  Subtotal: {formatCurrency(
                    bills.reduce((acc, d) => acc + getDenomCount(counts, d) * d.value, 0)
                  )}
                </span>
              </div>

              <div className="p-3 space-y-2">
                {bills.map((item) => {
                  const currentIndex = orderedDenominations.findIndex((d) => d.id === item.id);
                  const qty = getDenomCount(counts, item);
                  const subtotal = qty * item.value;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100/70 transition-colors border border-slate-200/70"
                    >
                      <label 
                        htmlFor={`input-${item.id}`} 
                        className="w-32 font-bold font-mono text-sm text-slate-800 cursor-pointer"
                      >
                        {item.label}
                      </label>

                      {/* Entrada numérica directa y limpia para escribir la cantidad */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-sans font-medium">Cant:</span>
                        <input
                          id={`input-${item.id}`}
                          ref={(el) => { inputRefs.current[item.id] = el; }}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={qty === 0 ? '' : qty}
                          placeholder="0"
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, currentIndex)}
                          className="w-20 sm:w-24 px-3 py-1.5 text-center font-mono font-bold text-base bg-white border-2 border-slate-300 rounded-xl outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-slate-900"
                        />
                      </div>

                      {/* Subtotal por denominación */}
                      <div className="w-28 text-right font-mono font-bold text-sm text-slate-900">
                        {formatCurrency(subtotal)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* COLUMNA 2: MONEDAS (Tabulación continúa: Q1 -> Q0.50 -> Q0.25 -> Q0.10 -> Q0.05 -> Q0.01) */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
              <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <Coins className="w-4 h-4 text-amber-600" />
                  <span>Monedas de Guatemala</span>
                </div>
                <span className="text-xs font-mono font-bold text-amber-900">
                  Subtotal: {formatCurrency(
                    coins.reduce((acc, d) => acc + getDenomCount(counts, d) * d.value, 0)
                  )}
                </span>
              </div>

              <div className="p-3 space-y-2">
                {coins.map((item) => {
                  const currentIndex = orderedDenominations.findIndex((d) => d.id === item.id);
                  const qty = getDenomCount(counts, item);
                  const subtotal = qty * item.value;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100/70 transition-colors border border-slate-200/70"
                    >
                      <label 
                        htmlFor={`input-${item.id}`} 
                        className="w-32 font-bold font-mono text-sm text-slate-800 cursor-pointer"
                      >
                        {item.label}
                      </label>

                      {/* Entrada numérica directa y limpia para escribir la cantidad */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-sans font-medium">Cant:</span>
                        <input
                          id={`input-${item.id}`}
                          ref={(el) => { inputRefs.current[item.id] = el; }}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={qty === 0 ? '' : qty}
                          placeholder="0"
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, currentIndex)}
                          className="w-20 sm:w-24 px-3 py-1.5 text-center font-mono font-bold text-base bg-white border-2 border-slate-300 rounded-xl outline-none focus:border-amber-600 focus:ring-4 focus:ring-amber-100 transition-all text-slate-900"
                        />
                      </div>

                      {/* Subtotal por denominación */}
                      <div className="w-28 text-right font-mono font-bold text-sm text-amber-900">
                        {formatCurrency(subtotal)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Panel de Fondos Fijos Reglamentarios y Observaciones */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="bg-blue-50/90 p-3.5 rounded-2xl border border-blue-200 font-mono text-xs space-y-1.5">
              <div className="flex items-center justify-between text-blue-950 font-bold">
                <span className="font-sans text-[11px]">Fondo Inicial Fijo:</span>
                <span className="font-black text-blue-900">Q 2,000.00</span>
              </div>

              <div className="flex items-center justify-between text-blue-950 font-bold border-t border-blue-200/70 pt-1">
                <span className="font-sans text-[11px]">Fondo Final en Gaveta:</span>
                <span className="font-black text-blue-900">Q 2,000.00</span>
              </div>

              <div className="flex items-center justify-between text-slate-800 border-t border-blue-200/70 pt-1 text-[11px]">
                <span className="font-sans">A Bóveda (602):</span>
                <span className="font-bold text-emerald-700">
                  {totalPhysicalCash >= 2000
                    ? formatCurrency(totalPhysicalCash - 2000.0)
                    : `Q 0.00`}
                </span>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Observaciones del Arqueo de {activeType === 'ALMUERZO' ? 'Mediodía (Almuerzo)' : 'Cierre del Día'}
              </label>
              <textarea
                rows={2}
                value={localNotes}
                onChange={(e) => setLocalNotes(e.target.value)}
                placeholder={
                  activeType === 'ALMUERZO'
                    ? 'Ej. Corte intermedio conforme antes de salir a almuerzo. Fondo base Q 2,000.00 verificado.'
                    : 'Ej. Cierre final de jornada verificado. Fondo de Q 2,000.00 en gaveta para apertura de mañana y excedente a bóveda (602).'
                }
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cerrar sin guardar
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onPrintArqueo}
              className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Imprimir Hoja de Arqueo</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Guardar y Validar Arqueo de {activeType === 'ALMUERZO' ? 'Almuerzo' : 'Cierre'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
