import { TransactionCode, Denomination, OperationType, PhysicalCount } from '../types';

export const CIC_TRANSACTION_CODES: TransactionCode[] = [
  // 0-CAJA
  {
    code: '001',
    name: 'Abrir Caja (Fondo Inicial)',
    category: '0-CAJA',
    defaultType: 'INGRESO',
    description: 'Apertura de caja y asignación de fondo inicial de efectivo',
  },

  // 1-DEPOSITOS
  {
    code: '101',
    name: 'Depósito Moneda Nacional',
    category: '1-DEPOSITOS',
    defaultType: 'INGRESO',
    description: 'Recepción de depósito de ahorro en Quetzales',
  },
  {
    code: '103',
    name: 'Depósito Plazos Fijos',
    category: '1-DEPOSITOS',
    defaultType: 'INGRESO',
    description: 'Aporte para constitución de depósito a plazo fijo',
  },

  // 2-PAGO DE CREDITOS
  {
    code: '201',
    name: 'Préstamos Moneda Nacional',
    category: '2-PAGO DE CREDITOS',
    defaultType: 'INGRESO',
    description: 'Pago o amortización de cuota de crédito en Quetzales',
  },
  {
    code: '204',
    name: 'Visa Dólares',
    category: '2-PAGO DE CREDITOS',
    defaultType: 'INGRESO',
    description: 'Pago de tarjeta de crédito Visa en Dólares',
  },
  {
    code: '205',
    name: 'Visa Moneda Nacional',
    category: '2-PAGO DE CREDITOS',
    defaultType: 'INGRESO',
    description: 'Pago de tarjeta de crédito Visa en Quetzales',
  },

  // 3-OTROS INGRESOS
  {
    code: '301',
    name: 'Cobros Judiciales',
    category: '3-OTROS INGRESOS',
    defaultType: 'INGRESO',
    description: 'Cobro y recuperación de cuentas en gestión judicial',
  },
  {
    code: '302',
    name: 'Trámites De Jurídico',
    category: '3-OTROS INGRESOS',
    defaultType: 'INGRESO',
    description: 'Honorarios y gastos de asesoría y trámites jurídicos',
  },
  {
    code: '303',
    name: 'Gastos de Créditos',
    category: '3-OTROS INGRESOS',
    defaultType: 'INGRESO',
    description: 'Cobro de gastos administrativos, avalúos o papelería',
  },
  {
    code: '304',
    name: 'Cobros Cuentas Nuevas',
    category: '3-OTROS INGRESOS',
    defaultType: 'INGRESO',
    description: 'Cobro de apertura de cuenta o cuota de ingreso a la cooperativa',
  },
  {
    code: '307',
    name: 'Otros Ingresos Efectivo',
    category: '3-OTROS INGRESOS',
    defaultType: 'INGRESO',
    description: 'Ingresos misceláneos o comisiones varias en ventanilla',
  },
  {
    code: '308',
    name: 'Ingresos Caja',
    category: '3-OTROS INGRESOS',
    defaultType: 'INGRESO',
    description: 'Ingresos extraordinarios directos a caja',
  },

  // 4-Autorización Monto TC (Retiros y transferencias)
  {
    code: '401',
    name: 'Retiro Moneda Nacional',
    category: '4-Autorización Monto TC',
    defaultType: 'EGRESO',
    description: 'Entrega de efectivo por retiro de cuenta de ahorro corriente',
  },
  {
    code: '406',
    name: 'Retiro Servicios',
    category: '4-Autorización Monto TC',
    defaultType: 'EGRESO',
    description: 'Retiro o liquidación de cobro de servicios',
  },
  {
    code: '407',
    name: 'Cancelación Plazos Fijos',
    category: '4-Autorización Monto TC',
    defaultType: 'EGRESO',
    description: 'Pago total o liquidación de plazo fijo vencido en efectivo',
  },
  {
    code: '424',
    name: 'Transferencia Ahorro Caja',
    category: '4-Autorización Monto TC',
    defaultType: 'EGRESO',
    description: 'Débito o transferencia directa de cuenta de ahorros',
  },
  {
    code: '425',
    name: 'Transferencia Préstamo Caja',
    category: '4-Autorización Monto TC',
    defaultType: 'EGRESO',
    description: 'Desembolso de préstamo directo a ventanilla',
  },
  {
    code: '426',
    name: 'Transferencia Ingresos Caja',
    category: '4-Autorización Monto TC',
    defaultType: 'EGRESO',
    description: 'Transferencia interna de egreso entre cuentas de caja',
  },
  {
    code: '432',
    name: 'Autorización Monto TC',
    category: '4-Autorización Monto TC',
    defaultType: 'EGRESO',
    description: 'Autorización de egreso o consumo sobre tarjeta',
  },
  {
    code: '433',
    name: 'Aumento Monto TC',
    category: '4-Autorización Monto TC',
    defaultType: 'EGRESO',
    description: 'Ampliación autorizada de fondos de tarjeta',
  },
  {
    code: '434',
    name: 'Disminución Monto TC',
    category: '4-Autorización Monto TC',
    defaultType: 'INGRESO',
    description: 'Reintegro o reducción de fondos sobre tarjeta',
  },
  {
    code: '435',
    name: 'Cancelación Aumento de Monto TC',
    category: '4-Autorización Monto TC',
    defaultType: 'INGRESO',
    description: 'Reversión de incremento previo de tarjeta',
  },
  {
    code: '436',
    name: 'Cancelación de Disminución de Monto TC',
    category: '4-Autorización Monto TC',
    defaultType: 'EGRESO',
    description: 'Ajuste de disminución previa',
  },

  // 6-BÓVEDA
  {
    code: '601',
    name: 'Solicitud Efectivo Bóveda',
    category: '6-BÓVEDA',
    defaultType: 'INGRESO',
    description: 'Entrada de efectivo a ventanilla procedente de la bóveda central',
  },
  {
    code: '602',
    name: 'Envío Efectivo / Cheques Bóveda',
    category: '6-BÓVEDA',
    defaultType: 'EGRESO',
    description: 'Salida de remesa o exceso de efectivo desde ventanilla hacia la bóveda',
  },

  // 7-BANCO
  {
    code: '701',
    name: 'Depósito a Banco (Remesa Bancaria)',
    category: '7-BANCO',
    defaultType: 'EGRESO',
    description: 'Salida de efectivo entregado a camión blindado o depósito bancario',
  },
  {
    code: '702',
    name: 'Retiro de Banco (Ingreso Efectivo)',
    category: '7-BANCO',
    defaultType: 'INGRESO',
    description: 'Recepción de remesa bancaria para abastecimiento de caja',
  },

  // 8-COMPRA/VENTA DOLARES
  {
    code: '801',
    name: 'Compra Dólares (Salida Efectivo Q)',
    category: '8-COMPRA/VENTA DOLARES',
    defaultType: 'EGRESO',
    description: 'Compra de divisa estadounidense: entrega Quetzales del cajón',
  },
  {
    code: '802',
    name: 'Venta Dólares (Entrada Efectivo Q)',
    category: '8-COMPRA/VENTA DOLARES',
    defaultType: 'INGRESO',
    description: 'Venta de divisa estadounidense: recibe Quetzales al cajón',
  },

  // 9-REVERSIONES
  {
    code: '901',
    name: 'Reversión Transacciones Caja',
    category: '9-REVERSIONES',
    defaultType: 'EGRESO',
    isSpecial: true,
    description: 'Anulación o ajuste contra-asiento de transacción errónea',
  },

  // 10-CONSULTAS/REPORTES
  {
    code: '1001',
    name: 'Consulta Servicios Socio',
    category: '10-CONSULTAS/REPORTES',
    defaultType: 'INGRESO',
    isSpecial: true,
    description: 'Consulta operativa de saldos de socio sin movimiento de efectivo',
  },
  {
    code: '1007',
    name: 'Consulta Préstamos',
    category: '10-CONSULTAS/REPORTES',
    defaultType: 'INGRESO',
    isSpecial: true,
    description: 'Consulta de plan de pagos o saldos adeudados',
  },
  {
    code: '1009',
    name: 'IVE CO 03',
    category: '10-CONSULTAS/REPORTES',
    defaultType: 'INGRESO',
    isSpecial: true,
    description: 'Formulario de Intendencia de Verificación Especial',
  },
];

// Guatemalan Quetzales Denominations with distinct IDs (billetes 'b...' vs monedas 'm...')
export const GUATEMALA_DENOMINATIONS: Denomination[] = [
  { id: 'b200', value: 200, label: 'Q 200.00', type: 'billete' },
  { id: 'b100', value: 100, label: 'Q 100.00', type: 'billete' },
  { id: 'b50', value: 50, label: 'Q 50.00', type: 'billete' },
  { id: 'b20', value: 20, label: 'Q 20.00', type: 'billete' },
  { id: 'b10', value: 10, label: 'Q 10.00', type: 'billete' },
  { id: 'b5', value: 5, label: 'Q 5.00', type: 'billete' },
  { id: 'b1', value: 1, label: 'Q 1.00 (Billete)', type: 'billete' },
  { id: 'm1', value: 1.0, label: 'Q 1.00 (Moneda)', type: 'moneda' },
  { id: 'm050', value: 0.5, label: 'Q 0.50 (50¢)', type: 'moneda' },
  { id: 'm025', value: 0.25, label: 'Q 0.25 (25¢)', type: 'moneda' },
  { id: 'm010', value: 0.1, label: 'Q 0.10 (10¢)', type: 'moneda' },
  { id: 'm005', value: 0.05, label: 'Q 0.05 (5¢)', type: 'moneda' },
  { id: 'm001', value: 0.01, label: 'Q 0.01 (1¢)', type: 'moneda' },
];

export function getDenomCount(counts: PhysicalCount, denom: Denomination): number {
  if (counts[denom.id] !== undefined) return counts[denom.id] || 0;
  // Fallback for legacy counts keyed by numeric value
  if (denom.id === 'm1') return 0;
  return counts[denom.value] || 0;
}

export function calculateTotalPhysicalCash(counts: PhysicalCount): number {
  return GUATEMALA_DENOMINATIONS.reduce((sum, denom) => {
    return sum + getDenomCount(counts, denom) * denom.value;
  }, 0);
}

export function findCode(query: string): TransactionCode | undefined {
  const clean = query.trim().toLowerCase();
  if (!clean) return undefined;

  // Direct exact code match
  const direct = CIC_TRANSACTION_CODES.find((c) => c.code === clean);
  if (direct) return direct;

  // Numeric prefix search e.g. "201"
  const prefix = CIC_TRANSACTION_CODES.find((c) => c.code.startsWith(clean));
  if (prefix) return prefix;

  // Name match
  return CIC_TRANSACTION_CODES.find((c) => c.name.toLowerCase().includes(clean));
}

export function getCodeInfo(codeStr: string): { code: string; name: string; type: OperationType; category: string } {
  const match = findCode(codeStr);
  if (match) {
    return { code: match.code, name: match.name, type: match.defaultType, category: match.category };
  }
  const clean = codeStr.trim();
  const isEgreso = clean.startsWith('4') || clean === '602' || clean === '701' || clean === '801';
  return {
    code: clean,
    name: `Operación ${clean}`,
    type: isEgreso ? 'EGRESO' : 'INGRESO',
    category: isEgreso ? 'Egresos Caja' : 'Ingresos Caja',
  };
}

export function generateOperationCode(date: Date = new Date(), correlative: number = 1): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `OPE-${yyyy}${mm}${dd}-${correlative}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace('GTQ', 'Q');
}
