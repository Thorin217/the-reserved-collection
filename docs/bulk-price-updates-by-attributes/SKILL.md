# SKILL: Bulk Price Updates by Attributes

## 1) Objetivo
Implementar una feature de actualización masiva de precios basada en filtros por atributos de producto, aplicando cambios porcentuales sobre `product_variants.price`, con trazabilidad completa (histórico + detalle de cambios).

---

## 2) Decisiones clave (cerradas)
1. **Fuente de verdad del precio:** `product_variants.price`.
2. **Filtros primarios:** atributos de nivel `product`.
3. **`Option` por atributo en filtros:** **opcional**.
  - Con `option`: filtra por combinación exacta `attribute + option`.
  - Sin `option`: filtra por atributo general (cualquier option de ese atributo).
3. **Selección final de impacto:** variantes seleccionadas por el usuario.
4. **Seriales (opcional):** solo como filtro adicional de elegibilidad, **no** como precio individual.
5. **Tipo de ajuste inicial:** porcentaje (`+/- %`).

---

## 3) Alcance funcional
### Incluido
- Botón global en Products: **Update Products**.
- Vista de Price Update con:
  - filtros por atributos,
  - preview de productos/variantes impactadas,
  - ingreso de porcentaje,
  - confirmación de ejecución.
- Persistencia de histórico de ejecución.
- Persistencia de detalle por variante afectada.

### Fuera de alcance (MVP)
- Precio por serial.
- Reglas complejas por rangos o fórmulas múltiples.
- Jobs asíncronos/distribuidos.

---

## 4) Data Model (MVP)
## `price_updates` (cabecera)
- `id`
- `name` (nullable)
- `notes` (nullable)
- `change_type` (`percentage`)
- `change_value` (decimal)
- `affected_variants_count` (int)
- `created_by` (FK users)
- timestamps

## `price_update_filters` (criterios usados)
- `id`
- `price_update_id` (FK)
- `entity_level` (`product`) *(extensible a variant/serial más adelante)*
- `attribute_id` (FK)
- `attribute_option_id` (FK, nullable)
- timestamps

## `price_update_items` (detalle por variante)
- `id`
- `price_update_id` (FK)
- `product_id` (FK)
- `product_variant_id` (FK)
- `old_price` (decimal)
- `new_price` (decimal)
- `delta_price` (decimal)
- timestamps

## Opcional de reporting rápido
## `price_update_products`
- `id`
- `price_update_id` (FK)
- `product_id` (FK)
- unique (`price_update_id`, `product_id`)
- timestamps

---

## 5) Flujo UX esperado
1. Usuario entra a Products y presiona **Update Products**.
2. Selecciona uno o más filtros de atributos (`attribute` y `option` opcional).
3. Sistema muestra preview: productos y variantes candidatas.
4. Usuario marca/desmarca variantes a afectar.
5. Ingresa porcentaje (ej. `+5`, `-3.5`).
6. Visualiza preview de `old_price -> new_price`.
7. Confirma ejecución.
8. Sistema aplica cambios en transacción y muestra resumen final.

---

## 6) Contratos backend
### Endpoints sugeridos
- `GET /admin/products/price-updates` -> pantalla principal.
- `POST /admin/products/price-updates/preview` -> devuelve candidatos y preview.
- `POST /admin/products/price-updates` -> ejecuta actualización + guarda histórico.
- `GET /admin/products/price-updates/history` -> historial (opcional fase 2).

### Validaciones mínimas
- `change_type` debe ser `percentage`.
- `change_value` numérico, con rango seguro (ej. `-100 < x < 1000`).
- variantes seleccionadas existentes y activas.
- `attribute_id` requerido; `attribute_option_id` opcional.
- si viene `attribute_option_id`, debe pertenecer al `attribute_id` enviado.
- `new_price >= 0`.

### Semántica de filtros
- Filtro con `attribute_id` y sin `attribute_option_id`: incluye productos que tengan ese atributo con cualquier valor/opción.
- Filtro con `attribute_id` + `attribute_option_id`: incluye solo productos que coincidan con esa opción específica.

### Regla de cálculo
- `new_price = old_price * (1 + change_value / 100)`
- Redondeo: definir estándar (ej. 2 decimales).

---

## 7) Arquitectura por fases
## Fase 1 — Esqueleto y navegación
- Añadir botón **Update Products** en index de products.
- Crear página Inertia vacía con filtros + layout.
- Crear rutas y controller base.

**Entrega esperada:** navegación end-to-end funcional.

## Fase 2 — Preview
- Implementar formulario de filtros por atributos de product.
- Resolver variantes candidatas.
- Mostrar tabla preview con old/new price simulado.

**Entrega esperada:** usuario puede previsualizar impacto sin persistir.

## Fase 3 — Ejecución + histórico
- Crear migraciones de histórico.
- Guardar cabecera, filtros y detalle por variante.
- Aplicar cambios en `product_variants.price` con transacción.

**Entrega esperada:** actualización real + auditoría completa.

## Fase 4 — Historial UI
- Página/listado de ejecuciones.
- Vista de detalle por ejecución.

**Entrega esperada:** trazabilidad consultable por negocio.

## Fase 5 — Hardening
- Tests de integración y validaciones borde.
- Optimización de queries (evitar N+1).
- Ajustes de UX y mensajes.

**Entrega esperada:** feature estable para producción.

---

## 8) Criterios de aceptación (DoD)
1. Se puede filtrar por atributos de producto y obtener variantes candidatas.
2. Se puede aplicar un porcentaje (+/-) sobre variantes seleccionadas.
3. Se actualiza `product_variants.price` correctamente.
4. Se guarda histórico completo de cada ejecución.
5. Existe preview antes de confirmar.
6. Cobertura de tests para casos críticos.

---

## 9) Riesgos y mitigación
- **Riesgo:** actualización masiva accidental.
  - **Mitigación:** preview obligatorio + confirmación explícita + resumen de impacto.
- **Riesgo:** inconsistencias por concurrencia.
  - **Mitigación:** transacción y guardado atómico.
- **Riesgo:** performance en catálogos grandes.
  - **Mitigación:** paginación en preview y consultas indexadas.

---

## 10) Orden recomendado de implementación inmediata
1. Rutas + botón + pantalla base.
2. Endpoint preview.
3. Migraciones histórico.
4. Endpoint ejecución transaccional.
5. Historial UI.
6. Tests y pulido final.
