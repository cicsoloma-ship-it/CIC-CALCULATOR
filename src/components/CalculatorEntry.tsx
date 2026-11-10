import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Minus, 
  Check, 
  Delete, 
  Search, 
  Sparkles,
  Info,
  AlertTriangle,
  User,
  Hash
} from 'lucide-react';
import { CIC_TRANSACTION_CODES, findCode, formatCurrency } from '../data/transactionCodes';
import { OperationType, TransactionCode } from '../types';

interface CalculatorEntryProps {
  currentBalance: number;
  onAddTransaction: (
    code: string,
    codeName: string,
    category: string,
    type: OperationType,
    amount: number,
    reference: string
  ) => void;
  onOpenCatalog: () => void;
}

export const CalculatorEntry: React.FC<CalculatorEntryProps> = ({
  currentBalance,
  onAddTransaction,
  onOpenCatalog,
}) => {
  const [codeInput, setCodeInput] = useState<string>('101');
  const [matchedCode, setMatchedCode] = useState<TransactionCode | undefined>(() => findCode('101'));
  const [amountStr, setAmountStr] = useState<string>('');
  const [opType, setOpType] = useState<OperationType>('INGRESO');
  const [reference, setReference] = useState<string>('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const codeInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Play subtle audio tone for teller verification
  const playFeedback = (type: 'income' | 'expense' | 'error') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'income') {
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      } else if (type === 'expense') {
        osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
        osc.frequency.exponentialRampToValueAtTime(329.63, audioCtx.currentTime + 0.12); // E4
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
      }

      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } catch {
      // AudioContext not allowed or not supported; ignore silently
    }
  };

  // When code input changes, auto-resolve transaction code & default type
  const handleCodeChange = (value: string) => {
    setCodeInput(value);
    setInputError(null);

    const match = findCode(value);
    if (match) {
      setMatchedCode(match);
      setOpType(match.defaultType);
    } else {
      setMatchedCode(undefined);
    }
  };

  const parsedAmount = parseFloat(amountStr) || 0;
  const newProjectedBalance =
    opType === 'INGRESO' ? currentBalance + parsedAmount : currentBalance - parsedAmount;

  // Process transaction
  const handleSubmit = (forcedType?: OperationType) => {
    const finalType = forcedType || opType;
    const amount = parseFloat(amountStr);

    if (!amount || amount <= 0 || isNaN(amount)) {
      setInputError('Ingrese un monto válido mayor a Q 0.00');
      playFeedback('error');
      amountInputRef.current?.focus();
      return;
    }

    if (!matchedCode && !codeInput.trim()) {
      setInputError('Ingrese un código de transacción de CIC R.L.');
      playFeedback('error');
      codeInputRef.current?.focus();
      return;
    }

    const code = matchedCode ? matchedCode.code : codeInput.trim();
    const name = matchedCode ? matchedCode.name : `Operación #${code}`;
    const category = matchedCode ? matchedCode.category : 'Ventanilla General';

    // Submit transaction
    onAddTransaction(code, name, category, finalType, amount, reference.trim());
    playFeedback(finalType === 'INGRESO' ? 'income' : 'expense');

    // Reset fields for the next transaction
    setAmountStr('');
    setReference('');
    setInputError(null);

    // Focus back on amount or code for rapid fire
    amountInputRef.current?.focus();
  };

  // Keyboard shortcut listener (+ for add/Ingreso, - for subtract/Egreso, Enter to submit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is actively typing text in reference input
      if (document.activeElement === document.querySelector('input[name="reference"]')) {
        return;
      }

      if (e.key === 'F2') {
        e.preventDefault();
        onOpenCatalog();
        return;
      }

      if (e.key === '+') {
        e.preventDefault();
        setOpType('INGRESO');
        if (parsedAmount > 0) {
          handleSubmit('INGRESO');
        }
      } else if (e.key === '-') {
        e.preventDefault();
        setOpType('EGRESO');
        if (parsedAmount > 0) {
          handleSubmit('EGRESO');
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        setAmountStr('');
        setInputError(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [parsedAmount, matchedCode, codeInput, opType, reference, currentBalance]);

  // Listen for code selection from modal
  useEffect(() => {
    const handleCustomSelect = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        handleCodeChange(customEvent.detail);
        amountInputRef.current?.focus();
      }
    };

    window.addEventListener('select-cic-code', handleCustomSelect);
    return () => window.removeEventListener('select-cic-code', handleCustomSelect);
  }, []);

  // Numpad button presses
  const handleNumpad = (char: string) => {
    setInputError(null);
    if (char === 'C') {
      setAmountStr('');
    } else if (char === 'DEL') {
      setAmountStr((prev) => prev.slice(0, -1));
    } else if (char === '.') {
      if (!amountStr.includes('.')) {
        setAmountStr((prev) => (prev ? prev + '.' : '0.'));
      }
    } else if (char === '00') {
      if (amountStr && !amountStr.includes('.')) {
        setAmountStr((prev) => prev + '00');
      }
    } else {
      // Maximum 2 decimal places check
      if (amountStr.includes('.')) {
        const parts = amountStr.split('.');
        if (parts[1].length >= 2) return;
      }
      setAmountStr((prev) => (prev === '0' ? char : prev + char));
    }
  };

  // Quick preset amount buttons
  const quickAmounts = [50, 100, 200, 500, 1000, 2000, 5000];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Upper bar: Code and Transaction Type Identification */}
      <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Transaction Code Selector */}
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Código de Transacción CIC R.L.
            </label>
            <div className="relative">
              <input
                ref={codeInputRef}
                type="text"
                value={codeInput}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="Ej. 201, 101, 401, 601, 602..."
                className="w-full pl-9 pr-24 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold font-mono text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-inner"
              />
              <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <button
                type="button"
                onClick={onOpenCatalog}
                className="absolute right-1.5 top-1.5 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors border border-blue-200 flex items-center gap-1"
              >
                <Search className="w-3 h-3" />
                <span>Ver lista</span>
              </button>
            </div>
          </div>

          {/* Quick Frequent Code Shortcuts */}
          <div className="shrink-0 flex items-center gap-1.5 pt-1 overflow-x-auto pb-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase hidden md:inline">Rápidos:</span>
            {[
              { code: '101', label: '101 Depósito', type: 'INGRESO' },
              { code: '201', label: '201 Préstamo', type: 'INGRESO' },
              { code: '401', label: '401 Retiro', type: 'EGRESO' },
              { code: '601', label: '601 Bóveda (+)', type: 'INGRESO' },
              { code: '602', label: '602 Bóveda (-)', type: 'EGRESO' },
              { code: '304', label: '304 Cta. Nueva', type: 'INGRESO' },
            ].map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => handleCodeChange(item.code)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all border ${
                  codeInput === item.code
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction Name & Type Badge Display */}
        {matchedCode ? (
          <div
            className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
              opType === 'INGRESO'
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-rose-50/70 border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                  opType === 'INGRESO' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                }`}
              >
                {opType === 'INGRESO' ? (
                  <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm bg-white/80 px-1.5 py-0.5 rounded border border-slate-200/80">
                    {matchedCode.code}
                  </span>
                  <span className="font-bold text-sm sm:text-base">{matchedCode.name}</span>
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  Categoría: {matchedCode.category} · {matchedCode.description}
                </div>
              </div>
            </div>

            {/* Toggle Sign Button */}
            <div className="flex items-center gap-1 bg-white/90 p-1 rounded-lg border border-slate-200 shadow-xs shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setOpType('INGRESO')}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                  opType === 'INGRESO'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>INGRESO (+)</span>
              </button>
              <button
                type="button"
                onClick={() => setOpType('EGRESO')}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                  opType === 'EGRESO'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
                }`}
              >
                <Minus className="w-3.5 h-3.5" />
                <span>EGRESO (-)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-900 text-xs">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Código no catalogado directamente. Puedes ingresar el monto y seleccionar si es Ingreso (+) o Egreso (-).
            </span>
            <div className="ml-auto flex gap-1">
              <button
                type="button"
                onClick={() => setOpType('INGRESO')}
                className={`px-2 py-1 text-xs rounded font-medium ${
                  opType === 'INGRESO' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'
                }`}
              >
                + Ingreso
              </button>
              <button
                type="button"
                onClick={() => setOpType('EGRESO')}
                className={`px-2 py-1 text-xs rounded font-medium ${
                  opType === 'EGRESO' ? 'bg-rose-600 text-white' : 'bg-white text-slate-700'
                }`}
              >
                - Egreso
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Entry Body */}
      <div className="p-4 sm:p-6 space-y-4">
        {/* Amount Input with Currency Symbol */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Monto a {opType === 'INGRESO' ? 'Sumar a Caja' : 'Restar de Caja'} (Quetzales)
            </label>
            <div className="text-xs text-slate-500 font-medium">
              Presione <kbd className="px-1 py-0.5 font-mono text-[11px] bg-slate-100 border border-slate-300 rounded font-semibold text-slate-700">+</kbd> para sumar o <kbd className="px-1 py-0.5 font-mono text-[11px] bg-slate-100 border border-slate-300 rounded font-semibold text-slate-700">-</kbd> para restar
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-2xl font-bold font-mono text-slate-400">Q</span>
            </div>
            <input
              ref={amountInputRef}
              type="text"
              inputMode="decimal"
              value={amountStr}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, '');
                setAmountStr(val);
                setInputError(null);
              }}
              placeholder="0.00"
              className={`w-full pl-12 pr-4 py-3 text-3xl font-bold font-mono rounded-xl border transition-all outline-none ${
                opType === 'INGRESO'
                  ? 'text-emerald-700 bg-emerald-50/20 border-emerald-300 focus:ring-3 focus:ring-emerald-400/30'
                  : 'text-rose-700 bg-rose-50/20 border-rose-300 focus:ring-3 focus:ring-rose-400/30'
              }`}
            />
          </div>

          {inputError && (
            <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {inputError}
            </p>
          )}
        </div>

        {/* Quick Amount Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-400 font-medium mr-1">Comunes:</span>
          {quickAmounts.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => {
                setAmountStr(amt.toString());
                setInputError(null);
              }}
              className="px-2.5 py-1 text-xs font-semibold font-mono rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
            >
              Q{amt}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAmountStr('')}
            className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 ml-auto"
          >
            Limpiar monto
          </button>
        </div>

        {/* Optional Reference / Socio / Boleta */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Referencia o No. de Socio / Boleta (Opcional)
          </label>
          <div className="relative">
            <input
              name="reference"
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ej. Socio #10492 · Depósito en ventanilla"
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Balance Impact Live Simulation */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-left">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">Saldo Actual</div>
            <div className="text-sm font-semibold font-mono text-slate-800">
              {formatCurrency(currentBalance)}
            </div>
          </div>

          <div className="text-center font-bold font-mono text-lg flex items-center gap-1.5">
            <span
              className={`px-2 py-0.5 rounded text-sm ${
                opType === 'INGRESO' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {opType === 'INGRESO' ? '+' : '-'} {formatCurrency(parsedAmount)}
            </span>
          </div>

          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">Nuevo Saldo Proyectado</div>
            <div
              className={`text-base font-bold font-mono ${
                newProjectedBalance < 0 ? 'text-rose-600' : 'text-blue-900'
              }`}
            >
              {formatCurrency(newProjectedBalance)}
            </div>
          </div>
        </div>

        {/* Physical Financial Keypad & Action Buttons */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          {/* Row 1 */}
          <button
            type="button"
            onClick={() => handleNumpad('7')}
            className="py-3 text-lg font-bold font-mono rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95 transition-all shadow-xs"
          >
            7
          </button>
          <button
            type="button"
            onClick={() => handleNumpad('8')}
            className="py-3 text-lg font-bold font-mono rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95 transition-all shadow-xs"
          >
            8
          </button>
          <button
            type="button"
            onClick={() => handleNumpad('9')}
            className="py-3 text-lg font-bold font-mono rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95 transition-all shadow-xs"
          >
            9
          </button>
          <button
            type="button"
            onClick={() => handleNumpad('DEL')}
            className="py-3 text-sm font-semibold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 active:scale-95 transition-all flex items-center justify-center"
            title="Borrar último dígito"
          >
            <Delete className="w-5 h-5" />
          </button>

          {/* Row 2 */}
          <button
            type="button"
            onClick={() => handleNumpad('4')}
            className="py-3 text-lg font-bold font-mono rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95 transition-all shadow-xs"
          >
            4
          </button>
          <button
            type="button"
            onClick={() => handleNumpad('5')}
            className="py-3 text-lg font-bold font-mono rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95 transition-all shadow-xs"
          >
            5
          </button>
          <button
            type="button"
            onClick={() => handleNumpad('6')}
            className="py-3 text-lg font-bold font-mono rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95 transition-all shadow-xs"
          >
            6
          </button>
          <button
            type="button"
            onClick={() => handleNumpad('C')}
            className="py-3 text-sm font-bold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 active:scale-95 transition-all"
            title="Limpiar entrada"
          >
            C
          </button>

          {/* Row 3 */}
          <button
            type="button"
            onClick={() => handleNumpad('1')}
            className="py-3 text-lg font-bold font-mono rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95 transition-all shadow-xs"
          >
            1
          </button>
          <button
            type="button"
            onClick={() => handleNumpad('2')}
            className="py-3 text-lg font-bold font-mono rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95 transition-all shadow-xs"
          >
            2
          </button>
          <button
            type="button"
            onClick={() => handleNumpad('3')}
            className="py-3 text-lg font-bold font-mono rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95 transition-all shadow-xs"
          >
            3
          </button>
          <button
            type="button"
            onClick={() => {
              setOpType('INGRESO');
              if (parsedAmount > 0) handleSubmit('INGRESO');
            }}
            className="py-3 text-sm font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95 transition-all flex items-center justify-center gap-1 shadow-sm"
            title="Suma automáticamente con tecla +"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">SUMAR (+)</span>
          </button>

          {/* Row 4 */}
          <button
            type="button"
            onClick={() => handleNumpad('0')}
            className="py-3 text-lg font-bold font-mono rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95 transition-all shadow-xs"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => handleNumpad('00')}
            className="py-3 text-base font-bold font-mono rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95 transition-all shadow-xs"
          >
            00
          </button>
          <button
            type="button"
            onClick={() => handleNumpad('.')}
            className="py-3 text-lg font-bold font-mono rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95 transition-all shadow-xs"
          >
            .
          </button>
          <button
            type="button"
            onClick={() => {
              setOpType('EGRESO');
              if (parsedAmount > 0) handleSubmit('EGRESO');
            }}
            className="py-3 text-sm font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white active:scale-95 transition-all flex items-center justify-center gap-1 shadow-sm"
            title="Resta automáticamente con tecla -"
          >
            <Minus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">RESTAR (-)</span>
          </button>
        </div>

        {/* Primary Confirmation Button */}
        <button
          type="button"
          onClick={() => handleSubmit()}
          className={`w-full py-3.5 rounded-xl text-white font-bold text-base shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 ${
            opType === 'INGRESO'
              ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-700/20'
              : 'bg-rose-600 hover:bg-rose-500 shadow-rose-700/20'
          }`}
        >
          <Check className="w-5 h-5 stroke-[2.5]" />
          <span>
            REGISTRAR {opType === 'INGRESO' ? 'INGRESO (+)' : 'EGRESO (-)'} · Q {parsedAmount ? parsedAmount.toFixed(2) : '0.00'}
          </span>
          <kbd className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-xs bg-black/20 rounded font-mono font-normal">
            Enter
          </kbd>
        </button>
      </div>
    </div>
  );
};
