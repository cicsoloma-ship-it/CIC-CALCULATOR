export type OperationType = 'INGRESO' | 'EGRESO';

export interface TransactionCode {
  code: string;
  name: string;
  category: string;
  defaultType: OperationType;
  description: string;
  isSpecial?: boolean;
}

export type TapeItemType = 'LINE' | 'SUBTOTAL' | 'TOTAL';

export interface TapeItem {
  id: string;
  type: TapeItemType;
  amount: number;
  sign?: '+' | '-';
  code?: string;
  text?: string;
}

export interface TransactionRecord {
  id: string;
  operationCode: string; // e.g. OPE-20261110-1
  correlative: number;
  timestamp: string;
  code: string;
  codeName: string;
  category: string;
  type: OperationType;
  amount: number;
  reference: string;
  balanceBefore: number;
  balanceAfter: number;
  tapeItems?: TapeItem[];
  isVoided: boolean;
  voidReason?: string;
  voidedAt?: string;
}

export interface Denomination {
  id: string;
  value: number;
  label: string;
  type: 'billete' | 'moneda';
}

export interface PhysicalCount {
  [key: string]: number; // denomination id (e.g. 'b1', 'm1') or legacy value -> quantity
}

export type ArqueoType = 'ALMUERZO' | 'CIERRE_DIA';

export interface ArqueoRecord {
  id: string;
  type: ArqueoType;
  title: string;
  timestamp: string;
  theoreticalBalance: number;
  physicalCount: PhysicalCount;
  totalPhysical: number;
  difference: number;
  status: 'CUADRADO' | 'SOBRANTE' | 'FALTANTE';
  notes?: string;
}

export interface CashSession {
  id: string;
  tellerName: string;
  tellerAgency: string;
  registerNumber: string;
  openedAt: string;
  initialCash: number;
  records: TransactionRecord[];
  physicalCount: PhysicalCount;
  lunchArqueo?: ArqueoRecord;
  closingArqueo?: ArqueoRecord;
  isClosed: boolean;
  closedAt?: string;
  notes?: string;
}

