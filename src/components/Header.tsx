import React from 'react';
import { Landmark, Receipt, Calculator, BookOpen, RefreshCw, Printer } from 'lucide-react';
import { formatCurrency } from '../data/transactionCodes';

interface HeaderProps {
  tellerName: string;
  agency: string;
  registerNumber: string;
  currentBalance: number;
  totalIncome: number;
  totalExpenses: number;
  transactionCount: number;
  onOpenArqueo: () => void;
  onOpenCatalog: () => void;
  onResetSession: () => void;
  onPrint: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  tellerName,
  agency,
  registerNumber,
  currentBalance,
  totalIncome,
  totalExpenses,
  transactionCount,
  onOpenArqueo,
  onOpenCatalog,
  onResetSession,
  onPrint,
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md sticky top-0 z-30 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-inner">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-lg text-white">CIC R.L.</span>
              <span className="text-xs text-blue-300 font-medium">Receptor Pagador</span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>{agency}</span>
              <span>·</span>
              <span>Caja #{registerNumber}</span>
              <span>·</span>
              <span>{tellerName}</span>
            </div>
          </div>
        </div>

        {/* Quick Balance KPI Bar */}
        <div className="hidden lg:flex items-center gap-6 bg-slate-950/60 px-4 py-1.5 rounded-lg border border-slate-800">
          <div className="text-left">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Ingresos (+)</div>
            <div className="text-sm font-semibold font-mono text-emerald-400">
              +{formatCurrency(totalIncome)}
            </div>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div className="text-left">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Egresos (-)</div>
            <div className="text-sm font-semibold font-mono text-rose-400">
              -{formatCurrency(totalExpenses)}
            </div>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div className="text-left">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Saldo en Caja</div>
            <div className="text-base font-bold font-mono text-white">
              {formatCurrency(currentBalance)}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenCatalog}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 whitespace-nowrap"
            title="Ver catálogo oficial de códigos de CIC R.L. (F2)"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Catálogo Códigos</span>
            <kbd className="hidden md:inline-block px-1 py-0.5 text-[10px] font-mono bg-slate-900 border border-slate-700 rounded text-slate-400">F2</kbd>
          </button>

          <button
            onClick={onOpenArqueo}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-sm whitespace-nowrap"
            title="Arqueo físico de billetes y monedas"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Arqueo Físico</span>
          </button>

          <button
            onClick={onPrint}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 whitespace-nowrap"
            title="Imprimir cinta de auditoría"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>

          <button
            onClick={onResetSession}
            type="button"
            className="flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
            title="Cerrar turno o reiniciar caja"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cerrar Turno</span>
          </button>
        </div>
      </div>
    </header>
  );
};
