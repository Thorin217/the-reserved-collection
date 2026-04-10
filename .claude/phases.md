# Fases de desarrollo — The Reserved Collection
> Actualizado: 2026-04-05
> Estado: Fase 0 completada. Fase 1 (Inventario) en progreso por otro desarrollador.

---

## Estado actual del proyecto

### Completado (base lista)
- Setup inicial de Laravel + Inertia + React
- Auth (Fortify) + 2FA
- Roles y permisos (Spatie)
- Media Library (Spatie)
- Migraciones: branches, warehouses, categories, brands
- Migraciones: products, product_variants, product_serials
- Migraciones: inventory_stocks, inventory_movements, inventory_transfers, inventory_transfer_items
- Migraciones: inventory_adjustments, inventory_adjustment_items, inventory_reservations
- Migraciones: attributes, attribute_options, product_attribute_values
- Modelos Eloquent para todos los modelos anteriores
- API Resources para todos los modelos anteriores

### Pendiente en Fase 1
- Controllers de inventario (CRUD completo)
- Rutas de inventario
- Páginas React/Inertia del módulo inventario
- Lógica de negocio (movimientos, trazabilidad, reservas)
- Tests de inventario

---

## Fase 0 — Setup + arquitectura ✅
**Estado: COMPLETA**

- [x] Repositorio
- [x] Laravel 13 + Inertia v3 + React 19
- [x] Auth con Fortify + 2FA
- [x] Roles: admin, operador, asesor (Spatie)
- [x] Base de datos inicial estructurada
- [x] Modelos y API Resources base

---

## Fase 1 — Inventario (core crítico) 🔄
**Estado: EN PROGRESO (DB y modelos listos)**
**Responsable: desarrollador externo + continuación pendiente**

### 1.1 Completado
- [x] Migraciones de inventario completas
- [x] Modelos con relaciones
- [x] API Resources

### 1.2 Pendiente
- [ ] `ProductController` — CRUD de productos (con variantes y seriales)
- [ ] `InventoryStockController` — consulta de stock por variante/bodega
- [ ] `InventoryMovementController` — registro de entradas/salidas
- [ ] `InventoryTransferController` — transferencias entre bodegas
- [ ] `InventoryAdjustmentController` — ajustes de inventario
- [ ] `InventoryReservationController` — reservas de unidades
- [ ] Rutas en `web.php` o `routes/inventory.php`
- [ ] Páginas React: listado de productos, detalle, formularios
- [ ] Página de seriales por producto (`ProductSerial`)
- [ ] Historial de movimientos por serial
- [ ] Búsqueda y filtros (por estado, categoría, marca, bodega)
- [ ] Tests feature: CRUD productos, movimientos, trazabilidad

### Reglas críticas de inventario
- Seriales **obligatorios** por unidad
- Todo movimiento debe quedar registrado en `inventory_movements`
- Estados de serial: available, reserved, sold, in_maintenance, in_consignment
- Stock real = sum de `inventory_stocks` por bodega

---

## Fase 2 — CRM básico
**Estado: NO INICIADA**
**Depende de: Fase 1 (producto debe existir para asociar a lead)**

### Flujo general
`Lead Entrante → Ver perfil → Crear Propuesta de Catálogo → Iniciar Negociación → Cerrar Venta`

### 2.1 Leads Entrantes
- [ ] Registro de leads desde WhatsApp y formulario del sitio
- [ ] Campos: Nombre, Teléfono/WhatsApp, Email, Fuente, Fecha de ingreso
- [ ] Fuentes: `whatsapp`, `web`, `referral`, `social`, `walk_in`, `other`
- [ ] Estados: `new` (Nuevo), `contacted` (Contactado), `negotiating` (En Negociación), `won` (Ganado), `lost` (Perdido)

### 2.2 Propuestas de Catálogo
- [ ] Crear propuesta personalizada seleccionando productos del inventario
- [ ] Items de propuesta: fotos del artículo, modelo, precio sugerido, descripción, notas
- [ ] Enviar propuesta por WhatsApp o email desde el sistema
- [ ] Historial de propuestas enviadas al cliente
- [ ] Estados de propuesta: `draft`, `sent`, `viewed`, `accepted`, `rejected`

### 2.3 Negociación
- [ ] Historial de ofertas: precio inicial, contraofertas del cliente, contraofertas nuestras, precio final
- [ ] Tipos de oferta: `our_offer`, `client_counteroffer`
- [ ] Estados negociación: `negotiating`, `agreed`, `rejected`
- [ ] Vincular negociación a propuesta y a lead

### 2.4 Cierre y conexión con Ventas (preparar para Fase 3)
- [ ] Negociación ganada → marcar lead como `won`
- [ ] Dejar FK `negotiation_id` lista para vincular con `sales` en Fase 3
- [ ] Actualización de inventario se dispara en Fase 3 al crear la venta

### Base de datos (completado ✅)
- [x] Migración: `clients`
- [x] Migración: `leads`
- [x] Migración: `lead_interactions` (historial de contactos)
- [x] Migración: `lead_proposals` (propuestas de catálogo)
- [x] Migración: `lead_proposal_items` (items de cada propuesta)
- [x] Migración: `negotiations` (negociaciones)
- [x] Migración: `negotiation_offers` (historial de ofertas)
- [x] Enums: `LeadStatus`, `LeadSource`, `ProposalStatus`, `NegotiationStatus`, `NegotiationOfferType`

### Modelos (completado ✅)
- [x] `Client` con relación a leads
- [x] `Lead` con Enums y relaciones a interactions, proposals, negotiations
- [x] `LeadInteraction`
- [x] `LeadProposal` + `LeadProposalItem`
- [x] `Negotiation` + `NegotiationOffer`
- [x] Factories para todos los modelos CRM

### Pendiente
- [ ] `ClientController` — CRUD de clientes
- [ ] `LeadController` — pipeline de leads, cambio de estado
- [ ] `LeadProposalController` — crear/enviar propuestas
- [ ] `NegotiationController` — gestión de negociaciones + ofertas
- [ ] Rutas en `routes/admin.php` o `routes/crm.php`
- [ ] Páginas React: listado clientes, detalle cliente, pipeline de leads
- [ ] Páginas React: creador de propuesta (con selector de inventario)
- [ ] Páginas React: vista negociación (historial de ofertas)
- [ ] Tests feature: CRUD leads, propuestas, negociaciones

---

## Fase 3 — Finanzas
**Estado: NO INICIADA**
**Depende de: Fase 1 + Fase 2**

- [ ] Migración: `quotes` (cotizaciones)
- [ ] Migración: `quote_items`
- [ ] Migración: `sales` (ventas manuales)
- [ ] Migración: `sale_items`
- [ ] Migración: `accounts_receivable`
- [ ] Migración: `accounts_payable`
- [ ] Modelos y relaciones
- [ ] Lógica: cotización → aprobación → venta → cobro
- [ ] Al confirmar venta: mover serial de `available` a `sold` en inventario
- [ ] Páginas React: cotizaciones, ventas, cuentas por cobrar/pagar
- [ ] Tests feature

---

## Fase 4 — Módulos especiales
**Estado: NO INICIADA**
**Depende de: Fase 1 + Fase 3**

- [ ] Migración: `auctions` (subastas — sin tiempo real)
- [ ] Migración: `auction_items`
- [ ] Migración: `negotiations`
- [ ] Migración: `negotiation_messages`
- [ ] Lógica: subasta con fecha cierre, ofertas, adjudicación manual
- [ ] Lógica: negociación cliente ↔ asesor con historial
- [ ] Integración con inventario (reservar serial durante subasta/negociación)
- [ ] Páginas React: panel de subastas, panel de negociaciones
- [ ] Tests feature

---

## Fase 5 — Servicios + Landing
**Estado: NO INICIADA**
**Depende de: Fase 2 (leads) + Fase 1 (productos para catálogo)**

### 5.1 Mantenimiento de relojes
- [ ] Migración: `service_orders`
- [ ] Migración: `service_order_updates`
- [ ] Flujo: recepción → diagnóstico → trabajo → entrega
- [ ] Asociar a cliente y serial (si aplica)
- [ ] Tests feature

### 5.2 Landing page
- [ ] Catálogo público de productos (productos marcados como `is_visible`)
- [ ] Detalle de producto (sin precio visible si el negocio lo requiere)
- [ ] Formulario de contacto → crea lead en ERP automáticamente
- [ ] SEO básico
- [ ] UX premium (Tailwind v4)
- **NO**: carrito, checkout, pagos

---

## Fase 6 — Dashboard + cierre
**Estado: NO INICIADA**
**Depende de: todas las fases anteriores**

- [ ] KPIs: productos en stock, leads activos, ventas del mes, cobros pendientes
- [ ] Gráficas básicas (sin librería pesada si es posible)
- [ ] Reportes exportables (CSV/PDF): inventario, ventas, clientes
- [ ] Testing final end-to-end
- [ ] Revisión de seguridad (roles, policies)
- [ ] Deploy (Sail → producción)
- [ ] Documentación básica de uso

---

## Decisiones de arquitectura (no cambiar sin consenso)

| Decisión | Detalle |
|---|---|
| NO e-commerce | Solo ERP + landing de captación |
| Flujo de venta | lead → cotización → negociación → venta manual |
| Seriales obligatorios | Cada unidad tiene serial único |
| Roles | admin, operador, asesor |
| Frontend admin | React + Inertia (SPA) |
| Landing | Puede ser Inertia o SSR separado — decidir en Fase 5 |
| Pagos | Fuera de alcance |
| Tiempo real | Fuera de alcance |

---

## Fuera de alcance (NO desarrollar)
- App móvil
- Pagos online
- Subastas en tiempo real (WebSockets)
- IA / recomendaciones
- Marketplace / carrito / checkout
