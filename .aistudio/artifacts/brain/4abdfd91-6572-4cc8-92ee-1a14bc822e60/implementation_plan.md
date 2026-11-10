# Calculadora Financiera para Receptores Pagadores - CIC R.L.

Calculadora especializada para ventanilla y cajas de la cooperativa de ahorro y crédito CIC R.L., con reconocimiento instantáneo de códigos de transacción del sistema (depósitos, pagos de préstamo, retiros, remesas de bóveda), asignación automática de Ingreso (+) o Egreso (-), teclado de cálculo rápido estilo sumadora de banco, cinta de arqueo en tiempo real, desglose físico de efectivo y exportación para cuadre de caja.

## Decisiones Críticas y Preferencias Confirmadas

> [!IMPORTANT]
> Decisiones validadas con el usuario para el flujo de caja diario:
> - **Tipo de Operación**: Autoasignación automática según catálogo oficial de códigos bancarios de CIC R.L., permitiendo al cajero alternar o invertir con tecla `+` o `-` al instante.
> - **Control de Efectivo**: Módulo integrado de apertura de caja (saldo inicial) y desglose físico por denominaciones de billetes (Q200, Q100, Q50, Q20, Q10, Q5, Q1) y monedas para cuadre exacto contra saldo teórico.
> - **Reportes & Salidas**: Impresión de cinta de auditoría formato ticket/sumadora bancaria, exportación a Excel (.xlsx/CSV) y guardado histórico local de cortes y sesiones.

---

## 1. Visión General y Concepto

La herramienta está diseñada para receptores pagadores (cajeros de ventanilla) de CIC R.L. que necesitan procesar rápidamente el flujo continuo de transacciones de socios, verificar si una operación suma o resta de su caja física, y mantener un cuadre exacto sin errores humanos.

### Funcionalidades Clave
1. **Entrada Ultrarrápida por Código o Teclado**:
   - Campo de código con autocompletado inteligente (ej. `201` -> Préstamos Moneda Nacional, `101` -> Depósito, `401` -> Retiro, `601` -> Solicitud Bóveda, `602` -> Envío Bóveda, `304` -> Cobros Cuentas Nuevas).
   - Detección inmediata visual y funcional: **Ingreso (+, suma a caja)** o **Egreso (-, resta de caja)**.
   - Atajos directos de teclado: `+` suma directamente, `-` resta directamente, `Enter` confirma, `F2` busca código, `Escape` limpia.
2. **Cinta de Operaciones (Tape / Ribbon de Sumadora)**:
   - Registro cronológico detallado con número de movimiento, hora, código, descripción, socio/referencia opcional, monto e impacto en el saldo acumulado.
   - Posibilidad de anular/revertir movimientos (`901-Transacciones Caja`) con un solo clic.
3. **Módulo de Apertura y Arqueo Físico (Cuadre de Ventanilla)**:
   - Matriz de conteo de billetes y monedas en Quetzales guatemaltecos.
   - Cálculo automático de diferencia: `Efectivo Físico vs. Saldo Teórico en Sistema` (Sobrante / Faltante / Cuadrado).
4. **Exportación e Impresión Profesional**:
   - Generación de comprobante impreso de cinta de caja con membrete de CIC R.L.
   - Exportación de la jornada a Excel (CSV estructurado) con desglose por código contable.

---

## 2. Experiencia de Usuario y Diseño Visual

### Identidad Visual y Estilo
- **Paleta de Colores**:
  - Dominante: Gris pizarra neutro profesional (`#F8FAFC` fondo general, `#0F172A` en modo oscuro opcional).
  - Identidad Cooperativa: Azul financiero profundo (`#1E3A8A` / `#2563EB`) y verde esmeralda institucional (`#059669` / `#10B981`) para ingresos.
  - Alertas contables: Rojo carmesí sobrio (`#DC2626`) para egresos/retiros y diferencias de faltante.
  - Ámbar (`#D97706`) para advertencias o solicitudes especiales de bóveda.
- **Tipografía**:
  - Encabezados e interfaz: `Plus Jakarta Sans` y `DM Sans` con jerarquía clara y sin artificios.
  - Cifras monetarias y códigos: Monospace con cifras tabulares estrictas (`tabular-nums font-mono`).
- **Composición Espacial (Desktop 1440px / Pantallas de Ventanilla)**:
  - **Panel Izquierdo**: Teclado numérico financiero interactivo + Selector rápido de códigos clasificados por categorías (0-Caja, 1-Depósitos, 2-Pago Créditos, 3-Otros Ingresos, 4-Retiros, 6-Bóveda, etc.) basados en el sistema de CIC R.L.
  - **Panel Central**: Calculadora de entrada activa con selector dinámico de signo, indicador gigante de saldo de caja en tiempo real y totales parciales (Total Ingresos, Total Egresos, Saldo Neto).
  - **Panel Derecho**: Cinta de sumadora contable en vivo con opciones de búsqueda, filtro por tipo y botones de exportación/impresión.
  - **Pestaña/Modal Flotante**: Hoja de Arqueo de Caja con desglose por denominaciones (Q200 hasta Q0.01).

---

## 3. Catálogo de Códigos de Transacción de CIC R.L.

```
┌────────────────────────────────────────────────────────────────────────┐
│ Catálogo Oficial Integrado                                             │
├───────────────┬──────────────────────────────────────────┬─────────────┤
│ Código        │ Descripción Transacción                  │ Efecto Caja │
├───────────────┼──────────────────────────────────────────┼─────────────┤
│ 001           │ Abrir Caja (Fondo Inicial)               │ Ingreso (+) │
│ 101           │ Depósito Moneda Nacional                 │ Ingreso (+) │
│ 103           │ Depósito Plazos Fijos                    │ Ingreso (+) │
│ 201           │ Préstamos Moneda Nacional                │ Ingreso (+) │
│ 204           │ Visa Dólares                             │ Ingreso (+) │
│ 205           │ Visa Moneda Nacional                     │ Ingreso (+) │
│ 301           │ Cobros Judiciales                        │ Ingreso (+) │
│ 302           │ Trámites De Jurídico                     │ Ingreso (+) │
│ 303           │ Gastos de Créditos                       │ Ingreso (+) │
│ 304           │ Cobros Cuentas Nuevas                    │ Ingreso (+) │
│ 307           │ Otros Ingresos Efectivo                  │ Ingreso (+) │
│ 308           │ Ingresos Caja                            │ Ingreso (+) │
│ 401           │ Retiro Moneda Nacional                   │ Egreso  (-) │
│ 406           │ Retiro Servicios                         │ Egreso  (-) │
│ 407           │ Cancelación Plazos Fijos                 │ Egreso  (-) │
│ 424           │ Transferencia Ahorro Caja                │ Egreso  (-) │
│ 425           │ Transferencia Préstamo Caja              │ Egreso  (-) │
│ 426           │ Transferencia Ingresos Caja              │ Egreso  (-) │
│ 432           │ Autorización Monto TC                    │ Consulta    │
│ 433           │ Aumento Monto TC                         │ Operación   │
│ 434           │ Disminución Monto TC                     │ Operación   │
│ 435           │ Cancelación Aumento de Monto TC          │ Operación   │
│ 436           │ Cancelación de Disminución de Monto TC   │ Operación   │
│ 601           │ Solicitud Efectivo Bóveda                │ Ingreso (+) │
│ 602           │ Envío Efectivo / Cheques Bóveda          │ Egreso  (-) │
│ 701           │ Depósito Banco Remesa                    │ Egreso  (-) │
│ 702           │ Retiro Banco Efectivo                    │ Ingreso (+) │
│ 801           │ Compra Dólares (Salen Q, Entran $)       │ Egreso  (-) │
│ 802           │ Venta Dólares (Entran Q, Salen $)        │ Ingreso (+) │
│ 901           │ Reversión Transacciones Caja             │ Especial    │
└───────────────┴──────────────────────────────────────────┴─────────────┘
```

---

## 4. Arquitectura del Sistema y Flujo de Datos

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ARQUITECTURA DE LA APLICACIÓN                   │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   [Teclado Físico / Botones]        [Catálogo Códigos CIC R.L.]        │
│          │                                      │                      │
│          ▼                                      ▼                      │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │                 Motor de Registro de Operación               │     │
│   │ - Resuelve código -> Descripción + Tipo (Ingreso/Egreso)     │     │
│   │ - Permite conmutar signo con tecla '+' o '-'                 │     │
│   │ - Valida saldo disponible antes de confirmar                 │     │
│   └──────────────────────────────┬───────────────────────────────┘     │
│                                  │                                     │
│                                  ▼                                     │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │                    Estado de Caja (Store)                    │     │
│   │ - Saldo Inicial / Fondo                                      │     │
│   │ - Lista de Transacciones de la Cinta                         │     │
│   │ - Métricas: Σ Ingresos, Σ Egresos, Saldo Teórico Actual      │     │
│   │ - Arqueo de Efectivo: Conteo de billetes y monedas           │     │
│   │ - Diferencia de Cuadre: Físico - Teórico                     │     │
│   └──────────────────────┬───────────────────────────────┬───────┘     │
│                          │                               │             │
│            ┌─────────────┴─────────────┐         ┌───────┴──────┐      │
│            ▼                           ▼         ▼              ▼      │
│    [Cinta Imprimible]           [Exportar Excel] [LocalStorage] [Audio]│
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Fases de Ejecución

1. **Configuración de Metadatos y Estilos Base**:
   - Actualización de `metadata.json` y `index.html` con títulos institucionales de CIC R.L.
   - Definición de tipografía y variantes de Tailwind CSS.
2. **Definición de Catálogo de Transacciones y Tipos**:
   - Creación de base de datos de códigos bancarios de CIC R.L. con categorías, nombres exactos, tipo por defecto y descripción de soporte.
3. **Componente de Entrada Rápida y Teclado Numérico**:
   - Input de código con autocompletado y atajo a catálogo.
   - Input de monto con formateador de moneda en Quetzales.
   - Botones rápidos de suma `+` y resta `-` con listener de teclado global.
4. **Cinta de Sumadora y Auditoría de Transacciones**:
   - Visualización continua estilo rollo de papel con numeración correlativa.
   - Filtros por categoría y botón de anulación con confirmación.
5. **Módulo de Arqueo Físico de Billetes y Monedas**:
   - Tablero con inputs por denominación (Q200, Q100, Q50, Q20, Q10, Q5, Q1 y monedas).
   - Cálculo en vivo del efectivo en mano y cálculo del cuadre (Sobrante/Faltante).
6. **Exportación e Impresión**:
   - Generación de vista de impresión optimizada para tickets o informe de fin de día.
   - Descarga de archivo CSV/Excel formateado.
   - Persistencia segura en `localStorage` con opción de cierre de caja y reinicio.
7. **Verificación y Pruebas**:
   - Verificación de cálculo, atajos de teclado y compilación sin errores.
