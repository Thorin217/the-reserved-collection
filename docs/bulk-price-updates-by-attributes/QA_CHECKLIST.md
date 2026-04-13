# QA Checklist — Bulk Price Updates by Attributes

## 1) Navigation
- [ ] En Products existe el botón **Update products**.
- [ ] El botón abre `/admin/products/price-updates`.
- [ ] Desde Update Products se puede abrir **View history**.

## 2) Filters + Preview
- [ ] Se puede agregar y eliminar filtros dinámicamente.
- [ ] `Attribute` usa searchable select.
- [ ] `Option` usa searchable select y permite **Any option**.
- [ ] Preview con solo `attribute` trae variantes de cualquier opción.
- [ ] Preview con `attribute + option` trae variantes específicas.
- [ ] Tabla Preview muestra: product, product SKU, variant SKU, current price.

## 3) Selection UX
- [ ] Se puede seleccionar/deseleccionar variantes individuales.
- [ ] Funciona **Select all** y **Clear selection**.
- [ ] Se muestra contador de variantes seleccionadas.

## 4) Execute Update
- [ ] No permite aplicar si no hay variantes seleccionadas.
- [ ] No permite aplicar si porcentaje es `0`.
- [ ] Permite porcentaje positivo (ej. `+5`).
- [ ] Permite porcentaje negativo (ej. `-3.5`).
- [ ] Después de aplicar, se actualiza `product_variants.price`.
- [ ] Muestra resumen de ejecución aplicada.

## 5) Business Rules
- [ ] `option` es opcional y respeta semántica de filtro general/específico.
- [ ] Si una `option` no pertenece al `attribute`, el backend rechaza.
- [ ] Si `variant_ids` no coincide con filtros, el backend rechaza.

## 6) History
- [ ] `/admin/products/price-updates/history` lista ejecuciones.
- [ ] Listado muestra: ID, Name, Change %, Affected variants, Updated rows, Creator, Created at.
- [ ] Se puede entrar al detalle de una ejecución.
- [ ] Detalle muestra summary, filtros aplicados e items afectados.
- [ ] En detalle, `delta` se visualiza con signo y color contextual.

## 7) Data Integrity (DB)
- [ ] Se crea 1 registro en `price_updates` por ejecución.
- [ ] Se crean filtros en `price_update_filters`.
- [ ] Se crean items en `price_update_items` por variante actualizada.
- [ ] `affected_variants_count` coincide con variantes actualizadas.

## 8) Regression
- [ ] Flujo de Products existente no se rompe (listado/filtros/acciones).
- [ ] Historial soporta búsqueda y paginación.
- [ ] Feature tests del módulo pasan en Sail.
