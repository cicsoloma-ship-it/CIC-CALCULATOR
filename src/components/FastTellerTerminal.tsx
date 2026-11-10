import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, 
  Minus, 
  Check, 
  Receipt, 
  FileSpreadsheet, 
  Printer, 
  History,
  CornerDownLeft,
  Trash2,
  AlertCircle,
  X,
  Utensils,
  Flag,
  CheckCircle2,
  Search
} from 'lucide-react';
import { TapeItem, OperationType, TransactionRecord, ArqueoType, ArqueoRecord } from '../types';
import { getCodeInfo, formatCurrency, generateOperationCode, CIC_TRANSACTION_CODES } from '../data/transactionCodes';

interface FastTellerTerminalProps {
  currentBalance: number;
  nextCorrelative: number;
  onCommitTransaction: (
    code: string,
    codeName: string,
    category: string,
    type: OperationType,
    amount: number,
    reference: string,
    tapeItems?: TapeItem[]
  ) => void;
  onDeleteTransaction: (id: string) => void;
  records: TransactionRecord[];
  onOpenArqueo: (type: ArqueoType) => void;
  lunchArqueo?: ArqueoRecord;
  closingArqueo?: ArqueoRecord;
  onExportExcel: () => void;
  onPrint: () => void;
  onResetSession: () => void;
}

export const FastTellerTerminal: React.FC<FastTellerTerminalProps> = ({
  currentBalance,
  nextCorrelative,
  onCommitTransaction,
  onDeleteTransaction,
  records,
  onOpenArqueo,
  lunchArqueo,
  closingArqueo,
  onExportExcel,
  onPrint,
  onResetSession,
}) => {
  // Step: 'CODE' -> prompt for transaction code/account; 'AMOUNT' -> entering amounts with +/- and subtotals
  const [step, setStep] = useState<'CODE' | 'AMOUNT'>('CODE');
  
  // Current transaction data
  const [code, setCode] = useState<string>('');
  const [codeName, setCodeName] = useState<string>('');
  const [codeCategory, setCodeCategory] = useState<string>('');
  const [opType, setOpType] = useState<OperationType>('INGRESO');
  
  // Active operation tape items (lines, subtotal markers, etc.)
  const [activeTapeItems, setActiveTapeItems] = useState<TapeItem[]>([]);
  const [amountInput, setAmountInput] = useState<string>('');
  const [statusFlash, setStatusFlash] = useState<string | null>(null);

  // Tracks if subtotal was just triggered so 2nd Enter immediately commits TOTAL
  const subtotalStageRef = useRef<boolean>(false);

  // Deletion confirmation state
  const [deletingRecord, setDeletingRecord] = useState<TransactionRecord | null>(null);

  // Search & autocomplete in transaction history
  const [historySearchTerm, setHistorySearchTerm] = useState<string>('');
  const [selectedCodeFilter, setSelectedCodeFilter] = useState<string>('ALL');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const historySearchInputRef = useRef<HTMLInputElement>(null);

  const codeInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const historyScrollContainerRef = useRef<HTMLDivElement>(null);

  // Operation tracking code for current in-progress transaction
  const currentOpeCode = generateOperationCode(new Date(), nextCorrelative);

  // Play audio chime
  const playSound = (freq1: number, freq2: number, duration: number = 0.12) => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(freq1, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq2, audioCtx.currentTime + duration);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {
      // ignore
    }
  };

  const flash = (msg: string) => {
    setStatusFlash(msg);
    setTimeout(() => setStatusFlash(null), 2500);
  };

  // Compute current running balance of the active tape
  const calculateTapeTotal = (items: TapeItem[]) => {
    return items.reduce((acc, item) => {
      if (item.type === 'LINE') {
        return item.sign === '+' ? acc + item.amount : acc - item.amount;
      }
      return acc;
    }, 0);
  };

  const activeRunningTotal = calculateTapeTotal(activeTapeItems);
  const firstStipulatedLine = activeTapeItems.find((i) => i.type === 'LINE');
  const hasSubtractions = activeTapeItems.some((i) => i.sign === '-');

  // Chronological order: first movements at top (#1, #2...), latest movement at bottom!
  const chronologicalRecords = useMemo(() => {
    return [...records].sort((a, b) => a.correlative - b.correlative);
  }, [records]);

  // Unique codes used in the current session for quick chips
  const sessionCodes = useMemo(() => {
    const map = new Map<string, { code: string; name: string; count: number }>();
    records.forEach((r) => {
      if (!r.isVoided) {
        const existing = map.get(r.code);
        if (existing) {
          existing.count += 1;
        } else {
          map.set(r.code, { code: r.code, name: r.codeName, count: 1 });
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
  }, [records]);

  // Autocomplete suggestions based on current search term
  const autocompleteSuggestions = useMemo(() => {
    const term = historySearchTerm.trim().toLowerCase();
    const cleanTerm = term.replace(/^#/, '');

    const list: { key: string; type: 'OPERATION' | 'CODE'; badge: string; label: string; query: string; extra?: string }[] = [];

    // 1. Matching operations from current session
    records.forEach((r) => {
      if (r.isVoided) return;
      const opNum = `#${r.correlative}`;
      const matches =
        !term ||
        r.operationCode.toLowerCase().includes(term) ||
        opNum.toLowerCase().includes(term) ||
        String(r.correlative) === cleanTerm ||
        r.code.toLowerCase().includes(cleanTerm) ||
        r.codeName.toLowerCase().includes(term) ||
        r.amount.toString().includes(cleanTerm);

      if (matches) {
        list.push({
          key: `op-${r.id}`,
          type: 'OPERATION',
          badge: opNum,
          label: `${r.operationCode} · ${r.code} - ${r.codeName}`,
          query: r.operationCode,
          extra: `${r.type === 'INGRESO' ? '+' : '-'} ${formatCurrency(r.amount)}`,
        });
      }
    });

    // 2. Matching account codes from official catalog
    if (term) {
      CIC_TRANSACTION_CODES.forEach((c) => {
        if (c.code === '001') return;
        const matches =
          c.code.toLowerCase().includes(cleanTerm) ||
          c.name.toLowerCase().includes(term) ||
          c.category.toLowerCase().includes(term);

        if (matches && list.length < 8) {
          const alreadyInList = list.some((item) => item.query === c.code);
          if (!alreadyInList) {
            list.push({
              key: `code-${c.code}`,
              type: 'CODE',
              badge: c.code,
              label: c.name,
              query: c.code,
              extra: c.defaultType === 'INGRESO' ? '+' : '-',
            });
          }
        }
      });
    }

    return list.slice(0, 6);
  }, [records, historySearchTerm]);

  // Check if filtering is active
  const isFiltered = Boolean(historySearchTerm.trim()) || selectedCodeFilter !== 'ALL';

  // Filtered records
  const filteredRecords = useMemo(() => {
    let result = chronologicalRecords;

    if (selectedCodeFilter !== 'ALL') {
      result = result.filter((r) => r.code === selectedCodeFilter);
    }

    if (historySearchTerm.trim()) {
      const term = historySearchTerm.trim().toLowerCase();
      const cleanTerm = term.replace(/^#/, '');

      result = result.filter((r) => {
        const matchesOp = r.operationCode.toLowerCase().includes(term);
        const matchesCorr = String(r.correlative) === cleanTerm || `#${r.correlative}`.toLowerCase().includes(term);
        const matchesCode = r.code.toLowerCase().includes(cleanTerm);
        const matchesName = r.codeName.toLowerCase().includes(term);
        const matchesRef = (r.reference || '').toLowerCase().includes(term);
        const matchesAmount = r.amount.toString().includes(cleanTerm);
        return matchesOp || matchesCorr || matchesCode || matchesName || matchesRef || matchesAmount;
      });
    }

    return result;
  }, [chronologicalRecords, selectedCodeFilter, historySearchTerm]);

  // Check if active in-progress transaction matches current filter
  const activeMatchesFilter = !isFiltered || (
    code.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
    codeName.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
    currentOpeCode.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
    (selectedCodeFilter !== 'ALL' && code === selectedCodeFilter)
  );

  // Focus management
  useEffect(() => {
    if (step === 'CODE') {
      subtotalStageRef.current = false;
      setTimeout(() => codeInputRef.current?.focus(), 50);
    } else {
      setTimeout(() => amountInputRef.current?.focus(), 50);
    }
  }, [step]);

  // Auto-scroll ONLY internal history container without touching window scroll or causing jitter
  useEffect(() => {
    if (historyScrollContainerRef.current) {
      historyScrollContainerRef.current.scrollTop = historyScrollContainerRef.current.scrollHeight;
    }
  }, [records.length, activeTapeItems.length, step]);

  // Handle typing code: when 3 digits are entered (101, 201, 401, 601, 602, 304...), advance immediately!
  const handleCodeInputChange = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    setCode(clean);

    if (clean.length >= 3) {
      submitCode(clean);
    }
  };

  const submitCode = (targetCode: string) => {
    const info = getCodeInfo(targetCode);
    setCode(info.code);
    setCodeName(info.name);
    setCodeCategory(info.category);
    setOpType(info.type);
    setActiveTapeItems([]);
    setAmountInput('');
    subtotalStageRef.current = false;
    setStep('AMOUNT');
    playSound(440, 550, 0.08);
    flash(`${currentOpeCode} · Cta: ${info.code} (${info.type === 'INGRESO' ? '+' : '-'})`);
  };

  // Add a line with sign (+ or -)
  const addLine = (forcedSign?: '+' | '-') => {
    const parsed = parseFloat(amountInput);
    const sign = forcedSign || (opType === 'INGRESO' ? '+' : '-');

    if (!amountInput || isNaN(parsed) || parsed <= 0) {
      return;
    }

    const newLine: TapeItem = {
      id: `line-${Date.now()}-${Math.random()}`,
      type: 'LINE',
      amount: parsed,
      sign,
      code,
    };

    const nextItems = [...activeTapeItems, newLine];
    setActiveTapeItems(nextItems);
    setAmountInput('');
    subtotalStageRef.current = false;
    playSound(sign === '+' ? 580 : 440, sign === '+' ? 700 : 360, 0.09);
  };

  // Handle SUB (1 Enter or SUB button): prints SUB and subtotal
  const handleSubtotal = () => {
    let items = [...activeTapeItems];
    const parsed = parseFloat(amountInput);

    // If an amount was currently typed into the input, add it first with active sign!
    if (!isNaN(parsed) && parsed > 0) {
      const sign = opType === 'INGRESO' ? '+' : '-';
      items.push({
        id: `line-${Date.now()}`,
        type: 'LINE',
        amount: parsed,
        sign,
        code,
      });
      setAmountInput('');
    }

    if (items.length === 0) {
      return;
    }

    const currentSub = calculateTapeTotal(items);

    const subItem: TapeItem = {
      id: `sub-${Date.now()}`,
      type: 'SUBTOTAL',
      amount: currentSub,
      text: 'SUB',
    };

    setActiveTapeItems([...items, subItem]);
    subtotalStageRef.current = true;
    playSound(520, 660, 0.12);
    flash(`SUBTOTAL: ${formatCurrency(currentSub)}`);
  };

  // Handle TOTAL (2 Enter or TOTAL button): prints TOTAL, commits operation, and automatically loops back to CODE!
  const handleFinalTotal = () => {
    let items = [...activeTapeItems];
    const parsed = parseFloat(amountInput);

    if (!isNaN(parsed) && parsed > 0) {
      const sign = opType === 'INGRESO' ? '+' : '-';
      items.push({
        id: `line-${Date.now()}`,
        type: 'LINE',
        amount: parsed,
        sign,
        code,
      });
    }

    if (items.length === 0) {
      return;
    }

    // Cálculo inteligente según requerimiento contable:
    // "del primer subtotal que se haga ese sera el monto que se ingresara ya sea ingreso o egreso"
    // "cuando mires que sea un ingreso que lo vayas sumando al saldo de caja y si es egreso ve restando al saldo de caja"
    const firstSubtotalItem = items.find((i) => i.type === 'SUBTOTAL');
    const lineItems = items.filter((i) => i.type === 'LINE');

    let finalAbsAmount = 0;
    if (firstSubtotalItem) {
      // El primer subtotal ejecutado define el monto real de la transacción
      finalAbsAmount = Math.abs(firstSubtotalItem.amount);
    } else if (lineItems.length > 0) {
      const firstLine = lineItems[0];
      const hasOpposing = lineItems.some((l) => l.sign !== firstLine.sign);
      if (hasOpposing) {
        finalAbsAmount = Math.abs(firstLine.amount);
      } else {
        finalAbsAmount = lineItems.reduce((acc, l) => acc + l.amount, 0);
      }
    }

    // El tipo contable proviene de la cuenta (o signo activo):
    // Cuentas de depósito/pago (101, 201, 301, etc.) -> INGRESO (SUMA a caja)
    // Cuentas de retiro/remesa (401, 501, 601, 602, etc.) -> EGRESO (RESTA a caja)
    const finalType: OperationType = opType;

    const finalAmountNet = calculateTapeTotal(items);

    const totalItem: TapeItem = {
      id: `tot-${Date.now()}`,
      type: 'TOTAL',
      amount: finalAmountNet,
      text: 'TOTAL',
    };

    const finalizedTape = [...items, totalItem];

    // Commit a la sesión contable de caja con correlativo OPE-FECHA-N
    onCommitTransaction(
      code,
      codeName,
      codeCategory,
      finalType,
      finalAbsAmount,
      '',
      finalizedTape
    );

    playSound(440, 880, 0.22);
    flash(`${currentOpeCode} ${finalType === 'INGRESO' ? '(+) INGRESO' : '(-) EGRESO'}: ${formatCurrency(finalAbsAmount)}`);

    // Reset everything and AUTOMATICALLY send user back to enter the account code again!
    setActiveTapeItems([]);
    setAmountInput('');
    setCode('');
    subtotalStageRef.current = false;
    setStep('CODE');

    setTimeout(() => {
      codeInputRef.current?.focus();
    }, 60);
  };

  // Cancel and reset back to code
  const handleCancel = () => {
    setActiveTapeItems([]);
    setAmountInput('');
    setCode('');
    subtotalStageRef.current = false;
    setStep('CODE');
    setTimeout(() => {
      codeInputRef.current?.focus();
    }, 50);
  };

  // Confirm delete operation
  const confirmDelete = () => {
    if (deletingRecord) {
      onDeleteTransaction(deletingRecord.id);
      playSound(300, 200, 0.15);
      flash(`Operación ${deletingRecord.operationCode} eliminada`);
      setDeletingRecord(null);
    }
  };

  // Keyboard navigation & numpad shortcuts:
  // - '+' key: adds line as positive (+)
  // - '-' key: adds line as negative (-)
  // - 1st Enter: Subtotal (SUB)
  // - 2nd Enter / Enter on empty: Total (TOTAL)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (deletingRecord) {
        if (e.key === 'Escape') setDeletingRecord(null);
        if (e.key === 'Enter') confirmDelete();
        return;
      }

      if (step === 'CODE') {
        if (e.key === 'Enter' && code) {
          e.preventDefault();
          submitCode(code);
        }
        return;
      }

      if (step === 'AMOUNT') {
        if (e.key === '+') {
          e.preventDefault();
          setOpType('INGRESO');
          if (amountInput) {
            addLine('+');
          }
        } else if (e.key === '-') {
          e.preventDefault();
          setOpType('EGRESO');
          if (amountInput) {
            addLine('-');
          }
        } else if (e.key === 'Enter') {
          e.preventDefault();

          // If amount is present in input -> 1 Enter calculates Subtotal (SUB)
          if (amountInput && parseFloat(amountInput) > 0) {
            handleSubtotal();
          } 
          // If input is empty:
          else {
            const hasSubtotalItem = activeTapeItems.length > 0 && activeTapeItems[activeTapeItems.length - 1].type === 'SUBTOTAL';
            if (subtotalStageRef.current || hasSubtotalItem) {
              // 2 Enter: finalize TOTAL and close operation!
              handleFinalTotal();
            } else if (activeTapeItems.length > 0) {
              // 1 Enter on empty input when lines exist: calculate Subtotal (SUB)
              handleSubtotal();
            }
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          if (amountInput) {
            setAmountInput('');
            subtotalStageRef.current = false;
          } else {
            handleCancel();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, code, codeName, codeCategory, opType, amountInput, activeTapeItems, nextCorrelative, deletingRecord]);

  return (
    <div className="w-full max-w-lg mx-auto select-none">
      {/* EL ÚNICO RECUADRO BLANCO: Estable, no salta ni se sacude */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-200 text-slate-800 flex flex-col space-y-3.5">
        
        {/* Encabezado blanco limpio con Código de Operación y Saldo de Caja */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-wider text-slate-900 text-sm">CIC R.L.</span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
              {currentOpeCode}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-500 block uppercase font-sans font-medium">Saldo en Caja</span>
            <span className="text-base font-bold text-emerald-600">
              {formatCurrency(currentBalance)}
            </span>
          </div>
        </div>

        {/* BOTONES DE LOS 2 ARQUEOS DEL DÍA (ALMUERZO Y CIERRE) */}
        <div className="grid grid-cols-2 gap-2 font-sans">
          <button
            type="button"
            onClick={() => onOpenArqueo('ALMUERZO')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-between text-left ${
              lunchArqueo
                ? 'bg-amber-50 border-amber-300 text-amber-950 hover:bg-amber-100'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-1.5 truncate">
              <Utensils className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <div className="truncate">
                <span className="block truncate">1. Arqueo Almuerzo</span>
                <span className="text-[10px] font-normal text-slate-500 block font-mono">
                  {lunchArqueo ? `Contado: ${formatCurrency(lunchArqueo.totalPhysical)}` : 'Pendiente mediodía'}
                </span>
              </div>
            </div>
            {lunchArqueo && (
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                lunchArqueo.status === 'CUADRADO' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {lunchArqueo.status === 'CUADRADO' ? '✓ OK' : '! DIF'}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onOpenArqueo('CIERRE_DIA')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-between text-left ${
              closingArqueo
                ? 'bg-blue-50 border-blue-300 text-blue-950 hover:bg-blue-100'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-1.5 truncate">
              <Flag className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <div className="truncate">
                <span className="block truncate">2. Arqueo Cierre Día</span>
                <span className="text-[10px] font-normal text-slate-500 block font-mono">
                  {closingArqueo ? `Contado: ${formatCurrency(closingArqueo.totalPhysical)}` : 'Pendiente al finalizar'}
                </span>
              </div>
            </div>
            {closingArqueo && (
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                closingArqueo.status === 'CUADRADO' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {closingArqueo.status === 'CUADRADO' ? '✓ OK' : '! DIF'}
              </span>
            )}
          </button>
        </div>

        {/* 1. HISTORIAL DE MOVIMIENTOS EN LA PARTE DE ARRIBA (Altura fija: 240px, scroll interno puro sin sacudidas) */}
        <div className="bg-slate-50/90 rounded-2xl border border-slate-200 overflow-hidden flex flex-col font-mono shadow-inner">
          {/* Header del historial con búsqueda y autocompletado */}
          <div className="px-3 py-2 bg-slate-100/95 border-b border-slate-200 flex flex-col gap-1.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold shrink-0">
                <History className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs">Historial</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isFiltered ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-200 text-slate-700'
                }`}>
                  {isFiltered ? `${filteredRecords.length}/${chronologicalRecords.length}` : `${chronologicalRecords.length}`}
                </span>
              </div>

              {/* Input de Búsqueda rápida con autocompletado */}
              <div className="relative flex-1 max-w-[240px]">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 pointer-events-none" />
                  <input
                    ref={historySearchInputRef}
                    type="text"
                    value={historySearchTerm}
                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setHistorySearchTerm('');
                        setSelectedCodeFilter('ALL');
                        historySearchInputRef.current?.blur();
                      }
                    }}
                    placeholder="Buscar #, OPE o cuenta..."
                    className="w-full pl-7 pr-6 py-1 bg-white border border-slate-300 rounded-lg text-[11px] font-sans placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-2xs transition-all"
                  />
                  {(historySearchTerm || selectedCodeFilter !== 'ALL') && (
                    <button
                      type="button"
                      onClick={() => {
                        setHistorySearchTerm('');
                        setSelectedCodeFilter('ALL');
                      }}
                      className="absolute right-1.5 text-slate-400 hover:text-rose-600 p-0.5 rounded-full hover:bg-slate-100 transition-colors"
                      title="Limpiar búsqueda (Esc)"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Dropdown de Autocompletado */}
                {isSearchFocused && autocompleteSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto divide-y divide-slate-100 text-[11px] font-sans">
                    <div className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-50 flex justify-between">
                      <span>Sugerencias rápidas</span>
                      <span className="font-mono text-[9px] text-slate-400">Esc cerrar</span>
                    </div>
                    {autocompleteSuggestions.map((sug) => (
                      <button
                        key={sug.key}
                        type="button"
                        onMouseDown={() => {
                          setHistorySearchTerm(sug.query);
                          setIsSearchFocused(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 hover:bg-blue-50 flex items-center justify-between gap-1.5 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                            sug.type === 'OPERATION' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {sug.badge}
                          </span>
                          <span className="text-slate-800 truncate font-medium">{sug.label}</span>
                        </div>
                        {sug.extra && (
                          <span className="text-slate-500 font-mono text-[10px] shrink-0 font-semibold">{sug.extra}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Micro-chips de filtro rápido por código de cuenta */}
            {sessionCodes.length > 0 && (
              <div className="flex items-center gap-1 overflow-x-auto pt-0.5 no-scrollbar">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCodeFilter('ALL');
                    setHistorySearchTerm('');
                  }}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCodeFilter === 'ALL' && !historySearchTerm
                      ? 'bg-blue-600 text-white font-bold shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Todas ({records.length})
                </button>
                {sessionCodes.map((sc) => (
                  <button
                    key={sc.code}
                    type="button"
                    onClick={() => {
                      if (selectedCodeFilter === sc.code) {
                        setSelectedCodeFilter('ALL');
                      } else {
                        setSelectedCodeFilter(sc.code);
                        setHistorySearchTerm('');
                      }
                    }}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
                      selectedCodeFilter === sc.code
                        ? 'bg-blue-700 text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>{sc.code}</span>
                    <span className="text-[9px] opacity-80 font-sans font-normal truncate max-w-[80px]">
                      {sc.name.split(' ')[0]}
                    </span>
                    <span className={`text-[9px] px-1 rounded font-bold ${
                      selectedCodeFilter === sc.code ? 'bg-blue-800 text-blue-100' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {sc.count}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Lista con ALTURA FIJA de 240px: No se mueve ni deforma el recuadro exterior */}
          <div
            ref={historyScrollContainerRef}
            className="p-3 h-[230px] overflow-y-auto space-y-2.5 text-xs"
          >
            {filteredRecords.length === 0 && (!activeMatchesFilter || (activeTapeItems.length === 0 && !amountInput)) ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs italic font-sans p-4">
                {isFiltered ? (
                  <div className="space-y-1.5 not-italic">
                    <div className="text-slate-700 font-bold text-xs">
                      No se encontraron transacciones
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Criterio: "{historySearchTerm || selectedCodeFilter}"
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setHistorySearchTerm('');
                        setSelectedCodeFilter('ALL');
                      }}
                      className="mt-2 px-3 py-1 bg-white border border-slate-300 rounded-lg text-blue-600 hover:text-blue-700 text-xs font-semibold shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Limpiar filtro y mostrar todo
                    </button>
                  </div>
                ) : (
                  <>
                    <span>No hay movimientos registrados.</span>
                    <span className="mt-1">Digite el número de cuenta abajo para comenzar.</span>
                  </>
                )}
              </div>
            ) : null}

            {/* Operaciones anteriores (Primeras arriba, últimas abajo) */}
            {filteredRecords.map((r) => (
              <div
                key={r.id}
                className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1 hover:border-slate-300 transition-colors relative group"
              >
                {/* Header de la operación con código de operación, número y nombre de cuenta juntos, y botón ELIMINAR */}
                <div className="flex items-center justify-between text-[11px] text-slate-600 pb-1.5 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-blue-700">{r.operationCode}</span>
                    <span className="text-slate-300">·</span>
                    <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {r.code} - {r.codeName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-slate-400 text-[10px]">
                      {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {/* Botón para eliminar operación */}
                    <button
                      type="button"
                      onClick={() => setDeletingRecord(r)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      title="Eliminar esta operación del historial"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Líneas de la operación (Suma en verde, egreso en rojo) */}
                {r.tapeItems && r.tapeItems.length > 0 ? (
                  <div className="space-y-0.5 pt-0.5 text-[11px] font-mono">
                    {r.tapeItems.map((item) => {
                      if (item.type === 'LINE') {
                        const isPlus = item.sign === '+';
                        return (
                          <div
                            key={item.id}
                            className={`flex justify-between font-semibold ${
                              isPlus ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            <span>{item.amount.toFixed(2)}</span>
                            <span className="font-black text-xs">{item.sign}</span>
                          </div>
                        );
                      }
                      if (item.type === 'SUBTOTAL') {
                        return (
                          <div key={item.id} className="flex justify-between items-center text-amber-950 bg-amber-100/90 px-2 py-1 rounded border border-amber-300 font-bold my-1 text-xs">
                            <span className="text-[11px] uppercase tracking-wider text-amber-800">--- SUB ---</span>
                            <span className="text-sm font-black">{formatCurrency(item.amount)}</span>
                          </div>
                        );
                      }
                      if (item.type === 'TOTAL') {
                        return (
                          <div key={item.id} className="flex justify-between items-center text-slate-900 bg-slate-100 px-2 py-1 rounded border border-slate-300 font-bold my-1 text-xs">
                            <span className="text-[11px] uppercase tracking-wider text-slate-700">=== TOTAL ===</span>
                            <span className="text-sm font-black">{formatCurrency(item.amount)}</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                ) : (
                  /* Fallback simple row */
                  <div className="flex justify-between text-xs pt-0.5 font-mono">
                    <span className="text-slate-700">{r.codeName}</span>
                    <span className={`font-bold ${r.type === 'INGRESO' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {r.type === 'INGRESO' ? '+' : '-'} {formatCurrency(r.amount)}
                    </span>
                  </div>
                )}

                {/* Separador final de la operación */}
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 font-bold tracking-widest text-right">
                  --
                </div>
              </div>
            ))}

            {/* Operación ACTIVA en curso (al fondo del historial) */}
            {activeMatchesFilter && (activeTapeItems.length > 0 || (step === 'AMOUNT' && (amountInput || activeTapeItems.length > 0))) && (
              <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-blue-800 pb-1 border-b border-blue-200 font-bold">
                  <span>{currentOpeCode} (EN CURSO)</span>
                  <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded border border-blue-200">
                    {code} - {codeName}
                  </span>
                </div>

                {/* Líneas agregadas */}
                <div className="space-y-0.5 pt-0.5 text-[11px] font-mono">
                  {activeTapeItems.map((item) => {
                    if (item.type === 'LINE') {
                      const isPlus = item.sign === '+';
                      return (
                        <div
                          key={item.id}
                          className={`flex justify-between font-semibold ${
                            isPlus ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          <span>{item.amount.toFixed(2)}</span>
                          <span className="font-black text-xs">{item.sign}</span>
                        </div>
                      );
                    }
                    if (item.type === 'SUBTOTAL') {
                      return (
                        <div key={item.id} className="flex justify-between items-center text-amber-950 bg-amber-100/90 px-2 py-1 rounded border border-amber-300 font-bold text-xs my-0.5">
                          <span className="text-[11px] uppercase tracking-wider text-amber-800">--- SUB ---</span>
                          <span className="text-sm font-black">{formatCurrency(item.amount)}</span>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>

                {/* Línea que se está digitando en vivo */}
                {amountInput && parseFloat(amountInput) > 0 && (
                  <div className={`flex justify-between text-[11px] italic font-mono font-bold pt-0.5 ${
                    opType === 'INGRESO' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    <span>{parseFloat(amountInput).toFixed(2)}</span>
                    <span className="font-black text-xs">{opType === 'INGRESO' ? '+' : '-'}</span>
                  </div>
                )}

                <div className="text-[10px] text-blue-700 pt-1 border-t border-blue-200 text-right font-medium">
                  1 Enter: SUBTOTAL · 2 Enter: CERRAR OPERACIÓN
                </div>
              </div>
            )}

            {!activeMatchesFilter && isFiltered && (step === 'AMOUNT' || activeTapeItems.length > 0) && (
              <div className="text-center py-1 text-[10px] text-slate-400 font-mono italic">
                (Operación en curso {currentOpeCode} oculta por filtro de búsqueda)
              </div>
            )}
          </div>
        </div>

        {/* BARRA DE ESTADO FIJA (h-6): Evita que el recuadro suba o baje al mostrar avisos */}
        <div className="h-6 flex items-center justify-center">
          {statusFlash ? (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 text-center py-0.5 px-3 rounded-lg text-[11px] font-bold font-mono animate-in fade-in">
              {statusFlash}
            </div>
          ) : (
            <div className="text-[10px] text-slate-400 font-mono tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>TECLADO ACTIVO · 1 ENTER SUB · 2 ENTER CERRAR</span>
            </div>
          )}
        </div>

        {/* 2. ÁREA DE ENTRADA ACTIVA EN LA PARTE DE ABAJO (Altura compacta y ESTABLE de 200px en ambas fases) */}
        {step === 'CODE' ? (
          /* FASE 1: INGRESO DE NÚMERO DE CUENTA / CÓDIGO (h-[200px]) */
          <div className="h-[200px] bg-slate-50/80 rounded-2xl p-5 border border-slate-200 text-center flex flex-col justify-center items-center space-y-4">
            <div className="text-xs uppercase font-bold tracking-wider text-slate-700 font-mono">
              [ {currentOpeCode} ] · INGRESE NÚMERO DE CUENTA
            </div>

            <input
              ref={codeInputRef}
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => handleCodeInputChange(e.target.value)}
              placeholder="---"
              className="w-60 text-center bg-white border-2 border-blue-600 rounded-2xl py-2 px-4 text-3xl font-mono font-bold text-slate-900 tracking-widest outline-none focus:ring-4 focus:ring-blue-100 shadow-sm"
            />
          </div>
        ) : (
          /* FASE 2: EDICIÓN DE MONTOS CON + / - / SUB / TOTAL (h-[200px]) */
          <div className="h-[200px] bg-slate-50/80 rounded-2xl p-3 border border-slate-200 flex flex-col justify-between">
            {/* Barra superior de la operación en curso */}
            <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-200 font-mono">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-bold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200 text-[11px]">
                  {currentOpeCode}
                </span>
                <span className="text-slate-800 font-bold truncate text-[11px]">
                  {code} - {codeName}
                </span>
              </div>

              {/* Botones de signo (+) y (-) */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setOpType('INGRESO');
                    if (amountInput) addLine('+');
                  }}
                  className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition-all flex items-center gap-0.5 ${
                    opType === 'INGRESO'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:text-emerald-700 border border-slate-200'
                  }`}
                  title="Tecla +"
                >
                  <Plus className="w-3 h-3" />
                  <span>+</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOpType('EGRESO');
                    if (amountInput) addLine('-');
                  }}
                  className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition-all flex items-center gap-0.5 ${
                    opType === 'EGRESO'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:text-rose-700 border border-slate-200'
                  }`}
                  title="Tecla -"
                >
                  <Minus className="w-3 h-3" />
                  <span>-</span>
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  className="ml-1 text-[11px] text-slate-500 hover:text-rose-600 px-1 py-0.5 font-sans"
                  title="Cancelar y volver a código (Esc)"
                >
                  Cambiar
                </button>
              </div>
            </div>

            {/* VISOR DE SUBTOTAL Y MONTO FALTANTE */}
            <div className="bg-amber-50/90 rounded-xl p-2.5 border border-amber-200/90 shadow-xs flex items-center justify-between font-mono">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-amber-950 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>SUBTOTAL (1 Enter)</span>
                </div>
                <div className="text-[11px] text-amber-900 font-sans">
                  {firstStipulatedLine ? (
                    <span>
                      Inicial: <strong>{formatCurrency(firstStipulatedLine.amount)}</strong>
                      {hasSubtractions && (
                        <> · Faltante: <strong className={activeRunningTotal < 0 ? 'text-rose-700' : 'text-emerald-700'}>{formatCurrency(Math.abs(activeRunningTotal))}</strong></>
                      )}
                    </span>
                  ) : (
                    <span>Subtotal acumulado</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-black font-mono tracking-tight ${
                  activeRunningTotal < 0 ? 'text-rose-600' : 'text-emerald-700'
                }`}>
                  {formatCurrency(activeRunningTotal)}
                </div>
              </div>
            </div>

            {/* Visor digital del monto tecleado en blanco */}
            <div className="bg-white rounded-xl p-2 text-right border border-slate-200 shadow-inner">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span className="font-semibold">{opType === 'INGRESO' ? 'SUMANDO (+)' : 'RESTANDO (-)'}</span>
                <span className="text-slate-400 font-sans text-[10px]">1 Enter: SUB · 2 Enter: CERRAR</span>
              </div>

              <div className="flex items-baseline justify-end gap-1">
                <span className="text-xl font-bold font-mono text-slate-400">
                  {opType === 'INGRESO' ? '+' : '-'} Q
                </span>
                <input
                  ref={amountInputRef}
                  type="text"
                  inputMode="decimal"
                  value={amountInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    setAmountInput(val);
                  }}
                  placeholder="0.00"
                  className={`w-full text-right bg-transparent text-3xl font-mono font-bold outline-none ${
                    opType === 'INGRESO' ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Barra inferior de opciones de caja */}
        <div className="flex items-center justify-end pt-1 border-t border-slate-200 text-xs text-slate-500 font-sans">
          <button
            type="button"
            onClick={onResetSession}
            className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors py-0.5 px-2"
          >
            Cerrar Turno
          </button>
        </div>

      </div>

      {/* Modal flotante de Eliminación de Operación (Overlay independiente, no altera el recuadro principal) */}
      {deletingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs no-print">
          <div className="bg-white text-slate-900 rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-3 animate-in fade-in zoom-in-95 font-sans">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>¿Eliminar operación?</span>
              </div>
              <button
                type="button"
                onClick={() => setDeletingRecord(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-slate-600 font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div>Código: <strong>{deletingRecord.operationCode}</strong></div>
              <div>Cuenta: {deletingRecord.code} - {deletingRecord.codeName}</div>
              <div>Monto: <strong>{formatCurrency(deletingRecord.amount)}</strong> ({deletingRecord.type})</div>
            </div>
            <p className="text-[11px] text-slate-500">
              El saldo de caja se recalculará de forma automática.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1 font-sans">
              <button
                type="button"
                onClick={() => setDeletingRecord(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-xs"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
