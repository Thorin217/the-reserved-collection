---
name: product-import-excel
description: "Use this skill when implementing or maintaining Excel import/export for Products + Variants in admin inventory. Includes template download, async processing with queues, row-level validation, tracking, error traceability, and completion notification via Event -> Listener -> Notification."
license: MIT
metadata:
  author: The Reserved Collection
---

# Product Import Excel (Products + Variants)

## Propósito

Implementar una importación robusta de `Products` y `ProductVariants` desde Excel en el módulo de inventario admin, con enfoque en:

- Seguridad de datos.
- Trazabilidad completa por fila.
- Procesamiento en segundo plano.
- Retroalimentación al usuario autenticado (email + estado en sistema).

Stack objetivo:

- Paquete: `maatwebsite/excel`
- Frontend: Inertia + React (`useForm`)
- Backend: Laravel (queues, eventos, listeners, notifications)

---

## Cuándo activar esta skill

Activar cuando el trabajo incluya alguno de estos puntos:

- Botón `Import products` en admin.
- Modal de carga de archivo Excel.
- Descarga de plantilla `.xlsx`.
- Import asíncrono por colas/chunks.
- Validación por fila y reporte de errores.
- Tracking de ejecución de importación.
- Notificación final al usuario autenticado.

---

## Alcance funcional esperado

1. Descarga de plantilla Excel oficial.
2. Subida de archivo desde modal en Products.
3. Creación de registro de importación (estado inicial).
4. Ejecución en queue con chunk reading.
5. Creación/actualización de Product y sus Variants.
6. Registro de errores por fila (si aplica).
7. Cambio de estado final (success/partial/failed).
8. Disparo de evento de finalización.
9. Listener que envía notificación por email al usuario autenticado.

---

## Fases de desarrollo (con tareas)

## Fase 0 — Diseño y contratos

### Tareas
- Definir formato de plantilla (columnas obligatorias y opcionales).
- Definir regla de agrupación: `product_sku` + `variant_sku`.
- Definir estrategia de idempotencia (`upsert` por SKU).
- Definir estados de importación: `pending`, `processing`, `completed`, `completed_with_errors`, `failed`.
- Definir estructura de errores por fila y código de error.

### Resultado esperado
- Contrato técnico de importación congelado antes de codificar.

---

## Fase 1 — Infraestructura backend base

### Tareas
- Instalar y configurar `maatwebsite/excel`.
- Crear tabla `imports` (tracking):
  - `id`, `user_id`, `type`, `status`, `file_path`, `total_rows`, `processed_rows`, `successful_rows`, `failed_rows`, `started_at`, `finished_at`, `meta`.
- Crear tabla `import_errors`:
  - `id`, `import_id`, `row_number`, `attribute`, `value`, `error_code`, `message`, `payload`.
- Crear modelo(s) para tracking y errores.
- Agregar índices por `import_id`, `status`, `user_id`.

### Resultado esperado
- Base persistente para auditoría y monitoreo de importaciones.

---

## Fase 2 — API/Controladores/endpoints

### Tareas
- Endpoint para descargar plantilla (`GET`).
- Endpoint para subir archivo (`POST`) con validación de mimetype/tamaño.
- Crear registro en `imports` al subir.
- Encolar job principal de procesamiento.
- Responder rápido al frontend con `import_id` y estado `pending`.

### Resultado esperado
- Flujo HTTP no bloqueante, listo para UX reactiva.

---

## Fase 3 — Import class dedicada (Maatwebsite)

### Tareas
- Crear clase de import con concerns adecuados (`WithHeadingRow`, `WithChunkReading`, `ShouldQueue`, `WithValidation`, etc. según diseño final).
- Validar cada fila con reglas de negocio:
  - Producto obligatorio.
  - Al menos una variante por producto.
  - SKU únicos y consistentes.
  - Integridad de FK (marca/categoría si vienen por identificador).
- Implementar estrategia `upsert` para productos y variantes.
- Capturar errores sin romper todo el proceso (tolerancia por fila).

### Resultado esperado
- Importación robusta, escalable, tolerante a errores parciales.

---

## Fase 4 — Procesamiento async, eventos y notificaciones

### Tareas
- Job/pipe de procesamiento en queue (`imports`).
- Actualizar progreso en tabla `imports` por chunk.
- Al finalizar: disparar `ProductsImportCompleted` (o equivalente).
- Listener dedicado:
  - compone resumen (totales, éxitos, errores).
  - envía Notification por email al `user_id` autenticado que inició la importación.
- Notification con contenido accionable:
  - estado final,
  - métricas,
  - enlace al detalle de errores.

### Resultado esperado
- Cierre de ciclo completo con comunicación automática al usuario.

---

## Fase 5 — Frontend (Products + modal)

### Tareas
- Agregar botón `Import products` en listado de productos.
- Implementar modal con:
  - descarga de plantilla,
  - carga de archivo,
  - estado de envío,
  - mensajes de validación.
- Usar `useForm` (Inertia) para subir archivo.
- Mostrar feedback inicial (`Import started successfully`).
- (Opcional recomendado) Vista de historial con estado por import.

### Resultado esperado
- UX clara y guiada para usuarios admin/operador.

---

## Fase 6 — QA y fallos esperados (review)

### Casos de fallo a cubrir
- Archivo no Excel / extensión inválida.
- Encabezados incorrectos o faltantes.
- SKU de variant duplicado en el archivo.
- Producto sin variants válidas.
- Fila con marca/categoría inexistente.
- Precios con formato inválido.
- Archivo muy grande (timeout/memoria) sin chunk.
- Error de queue worker detenido.
- Notificación fallida por mail transport.

### Tareas
- Tests feature para endpoints de template/upload.
- Tests de import por filas válidas/mixtas/inválidas.
- Test de job async + actualización de estados.
- Test Event -> Listener -> Notification.
- Verificar que nunca se rompa la integridad Product/Variant.

### Resultado esperado
- Import confiable con observabilidad y recuperación controlada.

---

## Criterios de aceptación

- Se puede descargar plantilla oficial desde Products.
- El import corre en segundo plano y no bloquea la UI.
- Se crean/actualizan productos con sus variantes de forma consistente.
- Se registra trazabilidad de errores por fila.
- Usuario autenticado recibe email de finalización con resumen.
- Existen pruebas automatizadas del flujo crítico.

---

## Convenciones recomendadas para este proyecto

- Mantener `Product` como entidad padre y `ProductVariant` como entidad operativa.
- No crear productos huérfanos sin variantes válidas.
- Priorizar idempotencia para evitar duplicados en reintentos.
- Evitar fallos globales por errores de fila: degradación parcial controlada.
- Reusar convenciones de rutas/controladores del módulo `admin/products`.

---

## Resultado final esperado de la feature

Un módulo de importación de Excel productivo, escalable y auditable para `Products + Variants`, con ejecución asíncrona, manejo serio de errores y notificación automática al usuario que inició el proceso.
