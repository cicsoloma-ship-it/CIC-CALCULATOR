import { CashSession } from '../types';
import { GUATEMALA_DENOMINATIONS, getDenomCount, calculateTotalPhysicalCash } from '../data/transactionCodes';

export function exportSessionToExcel(session: CashSession): void {
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

  // Build CSV content
  const lines: string[] = [];

  // Header info
  lines.push('COOPERATIVA INTEGRAL DE AHORRO Y CREDITO CIC R.L.');
  lines.push('REPORTE Y CINTA DE AUDITORIA DE RECEPTOR PAGADOR');
  lines.push(`Fecha de Emisión,"${new Date().toLocaleString('es-GT')}"`);
  lines.push(`Agencia,"${session.tellerAgency}"`);
  lines.push(`Caja,"${session.registerNumber}"`);
  lines.push(`Cajero / Receptor,"${session.tellerName}"`);
  lines.push(`Fondo Inicial Apertura,${session.initialCash.toFixed(2)}`);
  lines.push('');

  // Table header
  lines.push(
    [
      'Correlativo',
      'Código Operación',
      'Fecha y Hora',
      'Código Transacción',
      'Nombre Transacción',
      'Categoría',
      'Tipo (Efecto)',
      'Monto (Q)',
      'Saldo Anterior (Q)',
      'Nuevo Saldo (Q)',
      'Referencia / Socio',
      'Estado',
      'Motivo Anulación',
    ]
      .map((col) => `"${col}"`)
      .join(',')
  );

  // Rows
  session.records.forEach((rec) => {
    lines.push(
      [
        rec.correlative,
        `"${rec.operationCode || ''}"`,
        `"${new Date(rec.timestamp).toLocaleString('es-GT')}"`,
        `"${rec.code}"`,
        `"${rec.codeName.replace(/"/g, '""')}"`,
        `"${rec.category}"`,
        `"${rec.type}"`,
        (rec.type === 'INGRESO' ? rec.amount : -rec.amount).toFixed(2),
        rec.balanceBefore.toFixed(2),
        rec.balanceAfter.toFixed(2),
        `"${(rec.reference || '').replace(/"/g, '""')}"`,
        `"${rec.isVoided ? 'ANULADA' : 'ACTIVA'}"`,
        `"${(rec.voidReason || '').replace(/"/g, '""')}"`,
      ].join(',')
    );
  });

  lines.push('');
  lines.push('RESUMEN FINANCIERO');
  lines.push(`Total Ingresos (+),${totalIncome.toFixed(2)}`);
  lines.push(`Total Egresos (-),${totalExpense.toFixed(2)}`);
  lines.push(`Saldo Total en Gaveta,${theoreticalBalance.toFixed(2)}`);
  lines.push('Fondo Final Fijo en Gaveta (Para Siguiente Día),2000.00');
  lines.push(`Excedente para Envío a Bóveda (602),${Math.max(0, theoreticalBalance - 2000.0).toFixed(2)}`);
  lines.push(`Total Efectivo Físico Contado,${totalPhysicalCash.toFixed(2)}`);
  lines.push(`Diferencia de Cuadre,${difference.toFixed(2)}`);
  lines.push(
    `Estado de Cuadre,"${
      Math.abs(difference) < 0.005
        ? 'CUADRADO EXACTO'
        : difference > 0
        ? 'SOBRANTE'
        : 'FALTANTE'
    }"`
  );

  lines.push('');
  lines.push('CONTROL DE ARQUEOS DEL DIA');
  if (session.lunchArqueo) {
    lines.push(`Arqueo Mediodia (Almuerzo) - Hora,"${new Date(session.lunchArqueo.timestamp).toLocaleString('es-GT')}"`);
    lines.push(`Arqueo Mediodia - Fisico Contado,${session.lunchArqueo.totalPhysical.toFixed(2)}`);
    lines.push(`Arqueo Mediodia - Saldo Registros,${session.lunchArqueo.theoreticalBalance.toFixed(2)}`);
    lines.push(`Arqueo Mediodia - Diferencia,${session.lunchArqueo.difference.toFixed(2)}`);
    lines.push(`Arqueo Mediodia - Estado,"${session.lunchArqueo.status}"`);
  } else {
    lines.push('Arqueo Mediodia (Almuerzo),PENDIENTE');
  }

  if (session.closingArqueo) {
    lines.push(`Arqueo Cierre del Dia - Hora,"${new Date(session.closingArqueo.timestamp).toLocaleString('es-GT')}"`);
    lines.push(`Arqueo Cierre - Fisico Contado,${session.closingArqueo.totalPhysical.toFixed(2)}`);
    lines.push(`Arqueo Cierre - Saldo Registros,${session.closingArqueo.theoreticalBalance.toFixed(2)}`);
    lines.push(`Arqueo Cierre - Diferencia,${session.closingArqueo.difference.toFixed(2)}`);
    lines.push(`Arqueo Cierre - Estado,"${session.closingArqueo.status}"`);
  } else {
    lines.push('Arqueo Cierre del Dia,PENDIENTE');
  }

  if (session.notes) {
    lines.push(`Observaciones,"${session.notes.replace(/"/g, '""')}"`);
  }

  // Desglose de billetes y monedas
  lines.push('');
  lines.push('DESGLOSE DE EFECTIVO FISICO (ARQUEO)');
  lines.push('Denominación,Tipo,Cantidad,Subtotal (Q)');
  GUATEMALA_DENOMINATIONS.forEach((denom) => {
    const qty = getDenomCount(session.physicalCount, denom);
    const subtotal = qty * denom.value;
    lines.push(`"${denom.label}","${denom.type}",${qty},${subtotal.toFixed(2)}`);
  });

  // UTF-8 BOM \uFEFF ensures Excel renders accents, ñ, and special characters properly
  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const filename = `Caja_CIC_RL_${session.registerNumber}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
