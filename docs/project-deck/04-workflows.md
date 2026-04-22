# Flujos de Trabajo — Business Workflows

---

## 1. Flujo Lead → Cobro (Sales Cycle)

```
┌──────────┐    ┌──────────────┐    ┌─────────────┐
│   LEAD   │───>│  PROPUESTA   │───>│ NEGOCIACIÓN │
│ (CRM)    │    │ (items+precios)   │ (oferta/    │
└──────────┘    └──────────────┘    │ contraoferta│
                                    └──────┬──────┘
                                           │ precio acordado
                                           ▼
                                    ┌─────────────┐
                                    │ COTIZACIÓN  │
                                    │  draft→sent │
                                    │  →approved  │
                                    └──────┬──────┘
                                           │ convertir
                                           ▼
                              ┌────────────────────────┐
                              │         VENTA          │
                              │   draft → confirmed    │
                              └──────────┬─────────────┘
                                         │ al confirmar
                          ┌──────────────┼────────────────────┐
                          ▼              ▼                     ▼
                   ┌──────────┐  ┌─────────────┐   ┌──────────────────┐
                   │INVENTARIO│  │  FACTURA    │   │ CUENTA POR COBRAR│
                   │-stock    │  │  (PDF/Print)│   │  pending         │
                   │-serial   │  └─────────────┘   │  → partial       │
                   │ → sold   │                     │  → paid          │
                   └──────────┘                     └──────────────────┘
                                                            │
                                                    registrar pagos
                                                    (cash/transfer/card)
```

### Notas del flujo:
- El lead puede saltarse propuesta y negociación → ir directo a cotización
- La cotización puede crearse sin lead (venta directa)
- Una venta puede crearse sin cotización
- `AccountReceivable` se crea automáticamente al confirmar la venta si `balance_due > 0`
- `AccountReceivable` también puede crearse manualmente (deudas fuera del sistema de ventas)

---

## 2. Flujo Compra → Pago (Purchase-to-Pay)

```
┌──────────┐    ┌──────────────────┐    ┌──────────────────┐
│PROVEEDOR │───>│ CUENTA POR PAGAR │───>│    PAGOS         │
│ (Vendor) │    │                  │    │                  │
│ - nombre │    │ vendor_id o      │    │ amount           │
│ - email  │    │ vendor_name libre│    │ payment_method   │
│ - tax_id │    │                  │    │ payment_date     │
└──────────┘    │ pending          │    │ reference        │
                │ → partial        │    └──────────────────┘
                │ → paid           │
                └──────────────────┘
```

### Notas:
- El proveedor es opcional: se puede registrar un payable con solo `vendor_name` (texto libre)
- Los pagos reducen `balance_due` y actualizan `paid_amount`
- Al llegar a `balance_due = 0` → estado `paid` y se registra `paid_at`

---

## 3. Flujo de Inventario al Confirmar Venta

```
Sale.confirm()
  │
  ├── Por cada SaleItem:
  │     ├── Decrementar InventoryStock (warehouse)
  │     ├── Si es serializable: marcar ProductSerial → sold
  │     └── Crear InventoryMovement (type: sale)
  │
  └── Crear AccountReceivable si sale.balance_due > 0
```

---

## 4. Flujo de Transferencia Inter-Bodega

```
┌─────────────────────────────────────────────────────┐
│  Bodega Origen                    Bodega Destino     │
│                                                      │
│  stock: 100     ────── draft ──────>                │
│                                                      │
│  stock: 90      ─── sent (despacho) ──>             │
│  (-10 al despachar)                                  │
│                                                      │
│                 <── received (recepción) ──  +10    │
└─────────────────────────────────────────────────────┘
```

- El estado `sent` descuenta del origen
- El estado `received` acredita en destino
- Si se cancela antes de `sent`: sin impacto en stock
- Los items pueden incluir seriales específicos para trazabilidad

---

## 5. Flujo de Ajuste de Inventario

```
Crear Ajuste (draft)
  │
  ├── Agregar items (variante + cantidad + tipo: in/out)
  │
  └── Confirmar ──> Crear InventoryMovement(s)
                    ├── adjustment_in  → +stock
                    └── adjustment_out → -stock
```

---

## 6. Flujo del Portal de Cliente

```
Cliente (portal)
  │
  ├── Catálogo ──> Agregar al Carrito ──> Checkout ──> Order/Sale
  │
  ├── Wishlist ──> Guardar para después
  │
  ├── Auction House ──> Pujar / Comprar
  │
  └── My Collection ──> Ver artículos adquiridos
```

- El portal usa el mismo modelo `Client` que el CRM admin
- El `User` del portal está vinculado al `Client` vía `user_id`
- Un checkout del portal crea una `Sale` con estado `draft` → se confirma con pago

---

## 7. Flujo de Importación Masiva de Productos

```
Subir Excel ──> Validar ──> Vista Previa de Errores
                │
                └── Procesar ──> ImportRun (status: processing → completed)
                                    │
                                    ├── Crear/actualizar productos
                                    ├── Crear variantes
                                    └── ImportError[] si hay filas con problemas
```

---

## 8. Flujo de Actualización de Precios

```
Definir filtros (atributos/categorías) ──> Preview de productos afectados
                                                │
                                                └── Confirmar ──> PriceUpdate
                                                                    │
                                                                    └── PriceUpdateItem[]
                                                                         (precio anterior + nuevo)
```

---

## Resumen de Acciones de Negocio (Action Classes)

| Acción | Trigger | Efecto |
|--------|---------|--------|
| `SaveQuote` | Crear/editar cotización | Persiste cotización + items |
| `SaveSale` | Crear/editar venta | Persiste venta + items |
| `CreateSaleFromQuote` | Aprobar cotización | Crea venta desde cotización |
| `CreateSaleFromCart` | Checkout portal | Crea venta desde carrito |
| `ConfirmSale` | Confirmar venta | Descuenta stock + crea AccountReceivable |
| `RecordReceivablePayment` | Registrar pago cliente | Actualiza balance + estado |
| `RecordPayablePayment` | Registrar pago proveedor | Actualiza balance + estado |
