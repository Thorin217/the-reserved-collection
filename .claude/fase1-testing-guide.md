# Guía de pruebas — Fase 1 Inventario

> Proyecto: The Reserved Collection  
> Fecha: 2026-04-08  
> Objetivo: validar lógica de negocio end-to-end de inventario y registrar hallazgos.

---

## 1) Resumen breve de lo realizado

Durante Fase 1 se implementó y dejó operativo:

- CRUD operativo de inventario en UI admin (productos, seriales, stocks, transfers, adjustments, reservations).
- Trazabilidad en movimientos con filtros por referencia (`reference_type`, `reference_id`) y botón **Trace** desde módulos operativos.
- Reglas serializadas en backend con selección explícita de seriales en:
    - reservas (consume/release/cancel),
    - ajustes (confirm de decrease serializado),
    - transferencias (send/receive).
- Registro de movimientos por unidad serial en operaciones serializadas.
- Suite de pruebas de inventario en verde al momento de generar esta guía.

---

## 2) Precondiciones de prueba

- Levantar entorno:
    - `sail up -d`
    - `sail npm run dev`
- Usuario con acceso admin.
- Base de datos limpia o dataset controlado.
- Rutas funcionales esperadas:
    - `/admin/branches`
    - `/admin/warehouses`
    - `/admin/products`
    - `/admin/inventory/stocks`
    - `/admin/inventory/movements`
    - `/admin/inventory/transfers`
    - `/admin/inventory/adjustments`
    - `/admin/inventory/reservations`

---

## 3) Convenciones para registrar resultados

Usar esta escala por caso:

- ✅ Pass
- ⚠️ Pass con observación
- ❌ Fail
- ⏸️ Bloqueado

Plantilla de nota por caso:

- **Resultado:**
- **Evidencia (URL/screenshot/log):**
- **Comportamiento observado:**
- **Comportamiento esperado:**
- **Severidad:** Alta / Media / Baja
- **Acción sugerida:**

---

## 4) Datos base recomendados (setup funcional)

1. Crear Branch A y Branch B.
2. Crear Warehouse A1 (origen) en Branch A y Warehouse B1 (destino) en Branch B.
3. Crear 2 productos:
    - Producto simple (sin serial).
    - Producto serializado (`has_serial_numbers = true`).
4. Para producto serializado, crear al menos 5 seriales `available` en Warehouse A1.
5. Verificar stock inicial en `/admin/inventory/stocks`.

Checklist setup:

- [ ] Branches creadas
- [ ] Warehouses creadas
- [ ] Producto simple creado
- [ ] Producto serializado creado
- [ ] Seriales creados y visibles
- [ ] Stock inicial visible

---

## 5) Matriz de prueba por módulo (lógica de negocio)

## 5.1 Branches / Warehouses (base maestra)

### Caso BW-01 — Crear branch

- Acción: crear branch con nombre único.
- Esperado: registro visible en listado, estado correcto.
- Verificar: conteo y datos de contacto.

- [ ] BW-01

### Caso BW-02 — Crear warehouse asociada a branch

- Acción: crear warehouse en branch existente.
- Esperado: aparece en listado con branch correcta y tipo correcto.

- [ ] BW-02

### Caso BW-03 — Restricción de borrado con dependencias

- Acción: intentar eliminar branch/warehouse con historial o relaciones.
- Esperado: sistema bloquea eliminación y muestra mensaje de error.

- [ ] BW-03

---

## 5.2 Products + Serials

### Caso PR-01 — Crear producto simple

- Esperado: visible en listado, editable, sin gestión de serial obligatoria.

- [ ] PR-01

### Caso PR-02 — Crear producto serializado

- Esperado: habilita gestión de seriales por producto.

- [ ] PR-02

### Caso PR-03 — Alta de seriales

- Acción: crear seriales únicos en warehouse.
- Esperado: estado inicial `available`, sin duplicados.

- [ ] PR-03

### Caso PR-04 — Edición/estado de serial

- Acción: editar metadata permitida.
- Esperado: persistencia correcta, sin romper trazabilidad.

- [ ] PR-04

---

## 5.3 Stocks

### Caso ST-01 — Visualización por warehouse y búsqueda

- Acción: filtrar por bodega y SKU.
- Esperado: resultados consistentes con inventario real.

- [ ] ST-01

### Caso ST-02 — Coherencia de métricas

- Validar que para cada variante: `quantity`, `reserved_quantity`, `available_quantity` reflejan operaciones hechas.

- [ ] ST-02

---

## 5.4 Reservations

### Caso RS-01 — Crear reserva de producto simple

- Esperado:
    - `reserved_quantity` sube.
    - `available_quantity` baja.
    - movimiento `reservation` generado.

- [ ] RS-01

### Caso RS-02 — Crear reserva serializada

- Esperado:
    - seriales seleccionados por backend pasan a `reserved`.
    - se crean movimientos por serial.

- [ ] RS-02

### Caso RS-03 — Consume reserva serializada (selector explícito)

- Acción: consumir indicando `serial_ids` exactos.
- Esperado:
    - seriales → `sold` y `warehouse_id = null`.
    - movimiento `sale` por serial.

- [ ] RS-03

### Caso RS-04 — Release/cancel serializada (selector explícito)

- Esperado:
    - seriales vuelven a `available`.
    - movimiento `reservation_release` por serial.

- [ ] RS-04

### Caso RS-05 — Validaciones duras

- Probar:
    - consumir/liberar con cantidad de seriales distinta a la reserva,
    - serial no válido para esa reserva/warehouse/estado.
- Esperado: rechazo con error de validación.

- [ ] RS-05

---

## 5.5 Transfers

### Caso TR-01 — Crear transferencia draft

- Esperado: status `draft`, items correctos.

- [ ] TR-01

### Caso TR-02 — Send no serializado

- Esperado:
    - baja stock origen,
    - movimiento `transfer_out` agregado.

- [ ] TR-02

### Caso TR-03 — Send serializado (selector explícito)

- Acción: seleccionar seriales exactos por ítem.
- Esperado:
    - seriales seleccionados → `in_transit` (sin warehouse),
    - `transfer_out` por serial,
    - rechazo si conteo/seriales no coincide.

- [ ] TR-03

### Caso TR-04 — Receive serializado (selector explícito)

- Acción: seleccionar seriales en tránsito exactos.
- Esperado:
    - seriales → `available` en bodega destino,
    - `transfer_in` por serial,
    - rechazo ante serial inválido o cantidad distinta.

- [ ] TR-04

### Caso TR-05 — Trazabilidad

- Acción: usar botón **Trace** desde transfer.
- Esperado: movimientos filtrados por referencia de esa transferencia.

- [ ] TR-05

---

## 5.6 Adjustments

### Caso AJ-01 — Confirm increase (no serializado)

- Esperado: sube stock y crea `adjustment_in`.

- [ ] AJ-01

### Caso AJ-02 — Confirm decrease serializado (selector explícito)

- Acción: seleccionar seriales exactos.
- Esperado:
    - seriales → `damaged`,
    - `adjustment_out` por serial,
    - rechazo por conteo incorrecto.

- [ ] AJ-02

### Caso AJ-03 — Regla: increase serializado bloqueado

- Esperado: validación rechaza incremento serializado si no aplica al flujo definido.

- [ ] AJ-03

---

## 5.7 Movements (auditoría y trazabilidad)

### Caso MV-01 — Filtros operativos

- Validar filtros por tipo, branch, warehouse, búsqueda.

- [ ] MV-01

### Caso MV-02 — Filtro por referencia (trace)

- Acción: entrar desde Trace en transfer/reservation/adjustment.
- Esperado: banner de filtro activo + listado acotado a referencia.

- [ ] MV-02

### Caso MV-03 — Integridad de campos

- Validar columnas `Reference`, `Serial`, `Notes`, `Quantity`, fecha.

- [ ] MV-03

---

## 6) Casos negativos obligatorios

- [ ] No permitir cantidades negativas o cero en operaciones.
- [ ] No permitir operación sobre estados inválidos (ej: transfer no draft para send).
- [ ] No permitir serial de otra variante/warehouse.
- [ ] No permitir mismatch entre cantidad y seriales seleccionados.
- [ ] No permitir recibir serial no enviado en la transferencia.

---

## 7) Checklist de regresión rápida (smoke)

- [ ] Crear producto serializado + seriales
- [ ] Crear reserva serializada
- [ ] Consumir reserva con seriales explícitos
- [ ] Crear transferencia serializada
- [ ] Send con seriales explícitos
- [ ] Receive con seriales explícitos
- [ ] Crear ajuste decrease serializado y confirmar con seriales
- [ ] Revisar movimientos y trazabilidad de cada operación

---

## 8) Registro de incidencias (bitácora)

| ID      | Módulo | Caso | Resultado | Severidad | Responsable | Estado          | Nota |
| ------- | ------ | ---- | --------- | --------- | ----------- | --------------- | ---- |
| BUG-001 |        |      |           |           |             | Abierto/Cerrado |      |
| BUG-002 |        |      |           |           |             | Abierto/Cerrado |      |

---

## 9) Criterio de cierre de Fase 1

Fase 1 se considera cerrada cuando:

- [ ] Todos los casos críticos (reservas/transfers/adjustments serializados) están en ✅.
- [ ] No hay bugs abiertos de severidad alta.
- [ ] Trazabilidad completa comprobada en movimientos.
- [ ] Smoke de regresión ejecutado completo sin fallos críticos.

---

## 10) Comandos útiles de soporte

- Suite inventario:
    - `sail php artisan test --compact --filter=Inventory`
- Transferencias:
    - `sail php artisan test --compact --filter=InventoryTransferWorkflowTest`
- Reservas:
    - `sail php artisan test --compact --filter=InventoryReservationWorkflowTest`
- Ajustes:
    - `sail php artisan test --compact --filter=InventoryAdjustmentWorkflowTest`
- Rutas fase 1:
    - `sail php artisan test --compact --filter=InventoryPhaseOneRoutesTest`

---

> Recomendación: cuando detectes un fallo, registrar primero en la bitácora (Sección 8), luego enlazar evidencia (captura/log), y finalmente abrir tarea de ajuste con prioridad.
