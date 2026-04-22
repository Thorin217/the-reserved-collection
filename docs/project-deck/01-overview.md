# The Reserved Collection — Visión General

## ¿Qué es?

Plataforma B2B de gestión integral para negocios de colección (artículos exclusivos, subastas, inventario serializado). Combina **CRM → Comercial → Inventario → Finanzas** en un solo sistema, con un portal de cliente separado.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Backend | Laravel 13 (PHP 8.4) |
| Frontend | React 19 + Inertia.js v3 (SPA sin API REST explícita) |
| Estilos | Tailwind CSS v4 |
| Rutas tipadas | Laravel Wayfinder v0 |
| Base de datos | MySQL (via Sail/Docker) |
| Autenticación | Laravel Fortify v1 |
| Tests | Pest v4 |

---

## Módulos del Sistema

```
┌────────────────────────────────────────────────────────────────┐
│                        ADMIN PANEL                             │
│                                                                │
│  ┌──────────┐   ┌──────────┐   ┌───────────┐   ┌──────────┐  │
│  │INVENTARIO│   │   CRM    │   │ COMERCIAL │   │ FINANZAS │  │
│  │          │   │          │   │           │   │          │  │
│  │ Productos│   │ Clientes │   │  Cotiz.   │   │Cobrar    │  │
│  │ Stock    │   │ Leads    │   │  Ventas   │   │Pagar     │  │
│  │ Transf.  │   │ Prop.    │   │  Facturas │   │Proveed.  │  │
│  │ Ajustes  │   │ Negoc.   │   │           │   │          │  │
│  │ Reservas │   │          │   │           │   │          │  │
│  └──────────┘   └──────────┘   └───────────┘   └──────────┘  │
│                                                                │
│  ┌──────────────────────────┐   ┌──────────────────────────┐  │
│  │      CONFIGURACIÓN       │   │         PORTAL           │  │
│  │  Usuarios · Sucursales   │   │  Catálogo · Carrito      │  │
│  │  Importaciones           │   │  Pedidos · Subastas      │  │
│  └──────────────────────────┘   └──────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

## Flujo Principal (Lead → Cobro)

```
Lead
  └─> Propuesta  ──> Negociación
        └─> Cotización
              └─> Venta ──────────────> Factura (PDF)
                    │
                    ├─> Movimiento de Inventario (descuento stock)
                    │
                    └─> Cuenta por Cobrar ──> Pagos del Cliente
```

---

## Rutas Base

| Sección | Prefijo URL | Nombre de ruta |
|---------|-------------|----------------|
| Inventario | `/admin/products`, `/admin/inventory/...` | `admin.products.*`, `admin.inventory.*` |
| CRM | `/admin/clients`, `/admin/leads` | `admin.clients.*`, `admin.leads.*` |
| Comercial | `/admin/finance/quotes`, `/admin/finance/sales` | `admin.finance.quotes.*`, `admin.finance.sales.*` |
| Finanzas | `/admin/finance/receivables`, `/admin/finance/payables`, `/admin/finance/vendors` | `admin.finance.receivables.*`, etc. |
| Config | `/admin/users`, `/admin/branches`, `/admin/warehouses` | `admin.users.*`, etc. |
| Portal | `/` (sin prefix admin) | Rutas del portal de clientes |
