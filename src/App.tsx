import React, { useState, useEffect } from 'react';
import { 
  FastTellerTerminal 
} from './components/FastTellerTerminal';
import { 
  CashDrawerArqueoModal 
} from './components/CashDrawerArqueoModal';
import { 
  PrintTicketView 
} from './components/PrintTicketView';
import { 
  CashSession, 
  TransactionRecord, 
  OperationType, 
  PhysicalCount,
  TapeItem,
  ArqueoType,
  ArqueoRecord
} from './types';
import { 
  formatCurrency,
  generateOperationCode 
} from './data/transactionCodes';
import { 
  exportSessionToExcel 
} from './utils/exportExcel';

const FIXED_BASE_FUND = 2000.0;
const LOCAL_STORAGE_KEY = 'cic_rl_caja_session_v3';

const now = new Date();
const INITIAL_DEFAULT_SESSION: CashSession = {
  id: 'session-001',
  tellerName: 'Receptor Pagador #1',
  tellerAgency: 'Agencia Central CIC R.L.',
  registerNumber: '01',
  openedAt: now.toISOString(),
  initialCash: FIXED_BASE_FUND,
  records: [
    {
      id: 'rec-001',
      operationCode: generateOperationCode(now, 1),
      correlative: 1,
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      code: '101',
      codeName: 'Depósito Moneda Nacional',
      category: '1-DEPOSITOS',
      type: 'INGRESO',
      amount: 800.0,
      reference: '',
      balanceBefore: 2000.0,
      balanceAfter: 2800.0,
      tapeItems: [
        { id: 't-1', type: 'LINE', amount: 800.0, sign: '+', code: '101' },
        { id: 't-2', type: 'TOTAL', amount: 800.0, text: 'TOTAL' },
      ],
      isVoided: false,
    },
    {
      id: 'rec-002',
      operationCode: generateOperationCode(now, 2),
      correlative: 2,
      timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
      code: '201',
      codeName: 'Préstamos Moneda Nacional',
      category: '2-PAGO DE CREDITOS',
      type: 'INGRESO',
      amount: 1450.0,
      reference: '',
      balanceBefore: 2800.0,
      balanceAfter: 4250.0,
      tapeItems: [
        { id: 't-3', type: 'LINE', amount: 1450.0, sign: '+', code: '201' },
        { id: 't-4', type: 'TOTAL', amount: 1450.0, text: 'TOTAL' },
      ],
      isVoided: false,
    },
  ],
  physicalCount: {
    b200: 10,
    b100: 15,
    b50: 8,
    b20: 3,
    b10: 2,
    b5: 2,
    b1: 0,
    m1: 10,
  },
  isClosed: false,
  notes: 'Fondo fijo reglamentario verificado: Q 2,000.00 conforme.',
};

export default function App() {
  const [session, setSession] = useState<CashSession>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed: CashSession = JSON.parse(saved);
        // Garantizar que el fondo inicial y base siempre sea exactamente Q 2,000.00
        if (parsed.initialCash !== FIXED_BASE_FUND) {
          parsed.initialCash = FIXED_BASE_FUND;
          let current = FIXED_BASE_FUND;
          parsed.records = (parsed.records || []).map((r) => {
            const before = current;
            if (!r.isVoided) {
              current = r.type === 'INGRESO' ? current + r.amount : current - r.amount;
            }
            return {
              ...r,
              balanceBefore: before,
              balanceAfter: current,
            };
          });
        }
        return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_DEFAULT_SESSION;
  });

  const [isArqueoOpen, setIsArqueoOpen] = useState(false);
  const [selectedArqueoType, setSelectedArqueoType] = useState<ArqueoType>('ALMUERZO');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // ignore
    }
  }, [session]);

  // Calculations
  const activeRecords = session.records.filter((r) => !r.isVoided);
  const totalIncome = activeRecords
    .filter((r) => r.type === 'INGRESO')
    .reduce((acc, r) => acc + r.amount, 0);
  const totalExpenses = activeRecords
    .filter((r) => r.type === 'EGRESO')
    .reduce((acc, r) => acc + r.amount, 0);
  const currentBalance = session.initialCash + totalIncome - totalExpenses;

  // Next operation correlative
  const nextCorrelative = session.records.length > 0
    ? Math.max(...session.records.map((r) => r.correlative)) + 1
    : 1;

  // Add new finalized transaction with assigned OPE-FECHA-N code
  const handleCommitTransaction = (
    code: string,
    codeName: string,
    category: string,
    type: OperationType,
    amount: number,
    reference: string,
    tapeItems?: TapeItem[]
  ) => {
    setSession((prev) => {
      const prevActive = prev.records.filter((r) => !r.isVoided);
      const prevIncome = prevActive
        .filter((r) => r.type === 'INGRESO')
        .reduce((acc, r) => acc + r.amount, 0);
      const prevExpense = prevActive
        .filter((r) => r.type === 'EGRESO')
        .reduce((acc, r) => acc + r.amount, 0);
      const balanceBefore = prev.initialCash + prevIncome - prevExpense;
      const balanceAfter = type === 'INGRESO' ? balanceBefore + amount : balanceBefore - amount;

      const correlative = prev.records.length > 0
        ? Math.max(...prev.records.map((r) => r.correlative)) + 1
        : 1;

      const operationCode = generateOperationCode(new Date(), correlative);

      const newRecord: TransactionRecord = {
        id: `rec-${Date.now()}`,
        operationCode,
        correlative,
        timestamp: new Date().toISOString(),
        code,
        codeName,
        category,
        type,
        amount,
        reference,
        balanceBefore,
        balanceAfter,
        tapeItems,
        isVoided: false,
      };

      return {
        ...prev,
        records: [...prev.records, newRecord],
      };
    });
  };

  // Delete an operation and recalculate all successive balances cleanly
  const handleDeleteTransaction = (id: string) => {
    setSession((prev) => {
      const filtered = prev.records.filter((r) => r.id !== id);
      
      // Recalculate running balances from initial cash
      let current = prev.initialCash;
      const rebalanced = filtered.map((r) => {
        const before = current;
        if (!r.isVoided) {
          current = r.type === 'INGRESO' ? current + r.amount : current - r.amount;
        }
        return {
          ...r,
          balanceBefore: before,
          balanceAfter: current,
        };
      });

      return {
        ...prev,
        records: rebalanced,
      };
    });
  };

  // Update initial cash
  const handleUpdateInitialCash = (amount: number) => {
    setSession((prev) => ({
      ...prev,
      initialCash: amount,
    }));
  };

  // Save physical count
  const handleSavePhysicalCount = (physicalCount: PhysicalCount, notes: string) => {
    setSession((prev) => ({
      ...prev,
      physicalCount,
      notes,
    }));
  };

  // Save specific ArqueoRecord (Almuerzo o Cierre del Día)
  const handleSaveArqueoRecord = (record: ArqueoRecord) => {
    setSession((prev) => {
      if (record.type === 'ALMUERZO') {
        return {
          ...prev,
          lunchArqueo: record,
          physicalCount: record.physicalCount,
          notes: record.notes || prev.notes,
        };
      } else {
        return {
          ...prev,
          closingArqueo: record,
          physicalCount: record.physicalCount,
          notes: record.notes || prev.notes,
        };
      }
    });
  };

  const handleOpenArqueo = (type: ArqueoType) => {
    setSelectedArqueoType(type);
    setIsArqueoOpen(true);
  };

  // Reset shift
  const handleResetSession = () => {
    setIsResetConfirmOpen(true);
  };

  const confirmResetSession = () => {
    const newSession: CashSession = {
      id: `session-${Date.now()}`,
      tellerName: session.tellerName,
      tellerAgency: session.tellerAgency,
      registerNumber: session.registerNumber,
      openedAt: new Date().toISOString(),
      initialCash: FIXED_BASE_FUND,
      records: [],
      physicalCount: {},
      lunchArqueo: undefined,
      closingArqueo: undefined,
      isClosed: false,
      notes: '',
    };
    setSession(newSession);
    setIsResetConfirmOpen(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    exportSessionToExcel(session);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col items-center py-6 sm:py-10 px-3 sm:px-6 font-sans antialiased">
      {/* EL ÚNICO RECUADRO: Diseño en color blanco, intuitivo, estable y altamente confiable */}
      <main className="w-full max-w-lg no-print">
        <FastTellerTerminal
          currentBalance={currentBalance}
          nextCorrelative={nextCorrelative}
          onCommitTransaction={handleCommitTransaction}
          onDeleteTransaction={handleDeleteTransaction}
          records={session.records}
          onOpenArqueo={handleOpenArqueo}
          lunchArqueo={session.lunchArqueo}
          closingArqueo={session.closingArqueo}
          onExportExcel={handleExportExcel}
          onPrint={handlePrint}
          onResetSession={handleResetSession}
        />
      </main>

      {/* Modal de Arqueo Físico y Validación contra Registros */}
      <CashDrawerArqueoModal
        isOpen={isArqueoOpen}
        onClose={() => setIsArqueoOpen(false)}
        theoreticalBalance={currentBalance}
        initialCash={FIXED_BASE_FUND}
        onUpdateInitialCash={handleUpdateInitialCash}
        savedPhysicalCount={session.physicalCount}
        onSaveCount={handleSavePhysicalCount}
        onSaveArqueoRecord={handleSaveArqueoRecord}
        onPrintArqueo={handlePrint}
        defaultArqueoType={selectedArqueoType}
        existingLunchArqueo={session.lunchArqueo}
        existingClosingArqueo={session.closingArqueo}
        notes={session.notes || ''}
      />

      {/* Modal Confirmación Cierre de Turno */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs no-print">
          <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 font-sans">
            <h3 className="font-bold text-base text-slate-900">
              Cierre de Turno · Ventanilla CIC R.L.
            </h3>
            <p className="text-xs text-slate-600">
              Al cerrar el turno, se archiva la cinta actual. El fondo inicial y final siempre se mantiene en <strong>Q 2,000.00</strong> fijos para el siguiente día.
            </p>

            <div className="p-3.5 bg-slate-50 rounded-2xl text-xs font-mono space-y-2 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-600">Saldo Total en Gaveta:</span>
                <strong className="text-slate-900">{formatCurrency(currentBalance)}</strong>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>(+) Ingresos del Turno:</span>
                <strong>+{formatCurrency(totalIncome)}</strong>
              </div>
              <div className="flex justify-between text-rose-700">
                <span>(-) Egresos del Turno:</span>
                <strong>-{formatCurrency(totalExpenses)}</strong>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-blue-900 bg-blue-50/80 p-2 rounded-xl">
                <span>Fondo Fijo que queda en Gaveta:</span>
                <span>Q 2,000.00</span>
              </div>
              <div className="flex justify-between font-bold text-slate-800 px-2 text-[11px]">
                <span>Remesa / Envío a Bóveda (602):</span>
                <span className="text-emerald-700 font-bold">{formatCurrency(Math.max(0, currentBalance - FIXED_BASE_FUND))}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1 font-sans">
              <button
                type="button"
                onClick={confirmResetSession}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-98"
              >
                Cerrar Turno (Fondo Fijo Q 2,000.00 en Gaveta)
              </button>
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="w-full py-2 text-slate-500 hover:text-slate-800 text-xs font-semibold"
              >
                Cancelar y Continuar en este Turno
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formato de impresión */}
      <PrintTicketView session={session} />
    </div>
  );
}
