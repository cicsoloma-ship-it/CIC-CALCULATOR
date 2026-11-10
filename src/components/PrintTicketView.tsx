import React from 'react';
import { CashSession } from '../types';
import { GUATEMALA_DENOMINATIONS, formatCurrency, calculateTotalPhysicalCash } from '../data/transactionCodes';

interface PrintTicketViewProps {
  session: CashSession;
}

export const PrintTicketView: React.FC<PrintTicketViewProps> = ({ session }) => {
  const activeRecords = session.records.filter((r) => !r.isVoided);
  const totalIncome = activeRecords
    .filter((r) => r.type === 'INGRESO')
    .reduce((acc, r) => acc + r.amount, 0);
  const totalExpense = activeRecords
    .filter((r) => r.type === 'EGRESO')
    .reduce((acc, r) => acc + r.amount, 0);
  const theoreticalBalance = session.initialCash + totalIncome - totalExpense;

  const totalPhysicalCash = calculateTotalPhysicalCash(session.physicalCount);

  const difference = totalPhysicalCash - theoreticalBalance;

  return (
    <div className="print-only p-8 max-w-2xl mx-auto text-black bg-white font-mono text-xs">
      {/* Header */}
      <div className="text-center border-b-2 border-black pb-4 mb-4">
        <h1 className="text-base font-bold tracking-wider">COOPERATIVA INTEGRAL DE AHORRO Y CRÉDITO</h1>
        <h2 className="text-lg font-black tracking-widest mt-0.5">CIC R.L.</h2>
        <div className="text-xs font-semibold mt-1">CINTA DE AUDITORÍA Y CUADRE DE VENTANILLA</div>
        <div className="text-[11px] mt-1 text-slate-800">
          Fecha y Hora: {new Date().toLocaleString('es-GT')}
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-2 border-b border-dashed border-black pb-3 mb-3 text-[11px]">
        <div>
          <div><strong>Agencia:</strong> {session.tellerAgency}</div>
          <div><strong>Caja No.:</strong> {session.registerNumber}</div>
        </div>
        <div className="text-right">
          <div><strong>Receptor:</strong> {session.tellerName}</div>
          <div><strong>Apertura:</strong> {new Date(session.openedAt).toLocaleTimeString()}</div>
        </div>
      </div>

      {/* Initial Balance */}
      <div className="flex justify-between font-bold py-1 border-b border-black mb-2 text-xs">
        <span>FONDO INICIAL DE APERTURA:</span>
        <span>{formatCurrency(session.initialCash)}</span>
      </div>

      {/* Transactions Tape */}
      <div className="mb-4">
        <div className="font-bold border-b border-black pb-1 mb-1 grid grid-cols-12 text-[10px]">
          <span className="col-span-1">#</span>
          <span className="col-span-3">OPERACIÓN</span>
          <span className="col-span-2">CÓDIGO</span>
          <span className="col-span-3">HORA / TIPO</span>
          <span className="col-span-3 text-right">MONTO</span>
        </div>

        {session.records.map((item) => (
          <div key={item.id} className="py-1 border-b border-dotted border-slate-300 text-[10px]">
            <div
              className={`grid grid-cols-12 ${
                item.isVoided ? 'line-through opacity-60' : ''
              }`}
            >
              <span className="col-span-1">{String(item.correlative).padStart(2, '0')}</span>
              <span className="col-span-3 font-bold">{item.operationCode || `OPE-${item.correlative}`}</span>
              <span className="col-span-2">{item.code}</span>
              <span className="col-span-3 truncate">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({item.type})</span>
              <span className="col-span-3 text-right font-bold">
                {item.type === 'INGRESO' ? '+' : '-'} {formatCurrency(item.amount)}
              </span>
            </div>

            {/* Tape lines breakdown if present */}
            {item.tapeItems && item.tapeItems.length > 1 && (
              <div className="pl-6 pr-2 py-0.5 my-0.5 bg-slate-50 border-l border-slate-300 space-y-0.5 text-[9px] text-slate-700 font-mono">
                {item.tapeItems.map((l) => (
                  <div key={l.id} className="flex justify-between">
                    <span>{l.type === 'SUBTOTAL' ? 'SUB' : l.type === 'TOTAL' ? 'TOTAL' : `${l.amount.toFixed(2)}`}</span>
                    <span>{l.type === 'LINE' ? `${l.sign}` : `${l.amount.toFixed(2)}`}</span>
                  </div>
                ))}
                <div className="text-[9px] text-slate-500">--</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Financial Summary */}
      <div className="border-t-2 border-black pt-2 mb-4 space-y-1 text-xs">
        <div className="flex justify-between font-semibold">
          <span>(+) TOTAL INGRESOS:</span>
          <span>+{formatCurrency(totalIncome)}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>(-) TOTAL EGRESOS:</span>
          <span>-{formatCurrency(totalExpense)}</span>
        </div>
        <div className="flex justify-between font-bold border-t border-black pt-1 text-sm">
          <span>(=) SALDO TOTAL EN GAVETA:</span>
          <span>{formatCurrency(theoreticalBalance)}</span>
        </div>
        <div className="flex justify-between text-[11px] pt-1 border-t border-dashed border-slate-400">
          <span>FONDO FINAL EN GAVETA (PARA DÍA SIGUIENTE):</span>
          <span className="font-bold">Q 2,000.00</span>
        </div>
        <div className="flex justify-between text-[11px] font-bold">
          <span>EXCEDENTE PARA ENVÍO A BÓVEDA (602):</span>
          <span>{formatCurrency(Math.max(0, theoreticalBalance - 2000.0))}</span>
        </div>
      </div>

      {/* Resumen de los 2 Arqueos del Día */}
      <div className="border border-black p-3 mb-6 bg-slate-50 text-[11px] space-y-3">
        <div className="font-bold text-center border-b border-black pb-1">
          CONTROL DE ARQUEOS DE VENTANILLA (ALMUERZO Y CIERRE)
        </div>

        {/* 1. Arqueo Mediodía (Salida a Almuerzo) */}
        <div className="border-b border-dotted border-slate-400 pb-2">
          <div className="font-bold text-slate-900 flex justify-between">
            <span>1. ARQUEO DE MEDIODÍA (SALIDA A ALMUERZO):</span>
            <span>{session.lunchArqueo ? new Date(session.lunchArqueo.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'PENDIENTE'}</span>
          </div>
          {session.lunchArqueo ? (
            <div className="grid grid-cols-3 gap-2 mt-1 text-[10px]">
              <div>Físico: <strong>{formatCurrency(session.lunchArqueo.totalPhysical)}</strong></div>
              <div>Teórico: <strong>{formatCurrency(session.lunchArqueo.theoreticalBalance)}</strong></div>
              <div className="text-right">
                Estado: <strong>{session.lunchArqueo.status} ({formatCurrency(session.lunchArqueo.difference)})</strong>
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-slate-500 italic">No registrado aún</div>
          )}
        </div>

        {/* 2. Arqueo Cierre del Día */}
        <div>
          <div className="font-bold text-slate-900 flex justify-between">
            <span>2. ARQUEO FINAL DE JORNADA (CIERRE DEL DÍA):</span>
            <span>{session.closingArqueo ? new Date(session.closingArqueo.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'PENDIENTE'}</span>
          </div>
          {session.closingArqueo ? (
            <div className="grid grid-cols-3 gap-2 mt-1 text-[10px]">
              <div>Físico: <strong>{formatCurrency(session.closingArqueo.totalPhysical)}</strong></div>
              <div>Teórico: <strong>{formatCurrency(session.closingArqueo.theoreticalBalance)}</strong></div>
              <div className="text-right">
                Estado: <strong>{session.closingArqueo.status} ({formatCurrency(session.closingArqueo.difference)})</strong>
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-slate-500 italic">No registrado aún</div>
          )}
        </div>

        {/* Resumen Actual de Conteo Físico */}
        <div className="border-t border-black pt-2 text-[10px]">
          <div className="flex justify-between">
            <span>Último Conteo Físico Registrado:</span>
            <span className="font-bold">{formatCurrency(totalPhysicalCash)}</span>
          </div>
          <div className="flex justify-between">
            <span>Saldo Teórico en Sistema:</span>
            <span className="font-bold">{formatCurrency(theoreticalBalance)}</span>
          </div>
          <div className="flex justify-between font-bold border-t border-dashed border-black pt-0.5 mt-0.5">
            <span>Diferencia Actual de Caja:</span>
            <span>
              {Math.abs(difference) < 0.005
                ? 'Q 0.00 (CUADRADO EXACTO)'
                : difference > 0
                ? `+${formatCurrency(difference)} (SOBRANTE)`
                : `-${formatCurrency(Math.abs(difference))} (FALTANTE)`}
            </span>
          </div>
        </div>

        {session.notes && (
          <div className="mt-1 text-[10px] italic border-t border-dotted border-slate-300 pt-1">
            Obs: {session.notes}
          </div>
        )}
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-8 pt-8 mt-8 text-center text-xs">
        <div>
          <div className="border-t border-black pt-2 font-bold">{session.tellerName}</div>
          <div className="text-[10px] text-slate-700">Receptor Pagador / Cajero</div>
        </div>
        <div>
          <div className="border-t border-black pt-2 font-bold">Autorizado</div>
          <div className="text-[10px] text-slate-700">Supervisor de Caja / Jefe de Agencia</div>
        </div>
      </div>

      <div className="text-center text-[9px] text-slate-500 mt-8">
        CIC R.L. · Sistema de Control de Ventanilla y Caja
      </div>
    </div>
  );
};
