# Modelo de Datos — Relaciones entre Entidades

---

## Mapa de Relaciones

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ENTIDADES PRINCIPALES                            │
└─────────────────────────────────────────────────────────────────────────────┘

User ──────────────────────────────────────────────────────────────┐
  │                                                                │
  └─ hasOne ──> Client (portal user)                             │
                  │                                               │
                  ├─ hasMany ──> Lead                            │
                  │               │                              │
                  │               ├─ hasMany ──> LeadInteraction │
                  │               │                              │
                  │               ├─ hasMany ──> LeadProposal    │
                  │               │               │              │
                  │               │               ├─ hasMany ──> LeadProposalItem
                  │               │               │              │
                  │               │               └─ hasMany ──> NegotiationOffer
                  │               │                              │
                  │               ├─ hasMany ──> Negotiation     │
                  │               │               │              │
                  │               │               └─ hasMany ──> NegotiationOffer
                  │               │                              │
                  │               ├─ hasMany ──> Quote ──────────┤
                  │               │               │              │
                  │               │               └─ hasMany ──> QuoteItem
                  │               │                              │
                  │               └─ hasMany ──> Sale ───────────┘
                  │
                  ├─ hasMany ──> Quote
                  │
                  ├─ hasMany ──> Sale ─────────────────────────────────────────┐
                  │               │                                             │
                  │               ├─ hasMany ──> SaleItem                     │
                  │               │               └─ belongsTo ──> ProductVariant
                  │               │                                             │
                  │               ├─ hasOne  ──> AccountReceivable            │
                  │               │               └─ hasMany ──> ReceivablePayment
                  │               │                                             │
                  │               └─ belongsTo ──> Warehouse                  │
                  │                                                             │
                  └─ hasMany ──> AccountReceivable (manual)                   │
                                                                               │
┌──────────────────────────────────────────────────────────────────────────────┘
│
│  INVENTARIO
│
├─ Product ──────────────────────────────────────────────────────────────────┐
│    │                                                                        │
│    ├─ belongsTo ──> Category (árbol, parent_id)                           │
│    ├─ belongsTo ──> Brand                                                  │
│    ├─ hasMany ──> ProductVariant                                           │
│    │               │                                                       │
│    │               ├─ hasMany ──> InventoryStock ──> belongsTo Warehouse  │
│    │               ├─ hasMany ──> InventoryMovement                       │
│    │               ├─ hasMany ──> InventoryReservation                    │
│    │               └─ hasMany ──> ProductSerial                           │
│    │                               │                                       │
│    │                               └─ hasMany ──> InventoryMovement       │
│    │                                                                       │
│    └─ hasMany ──> ProductAttributeValue                                   │
│                    └─ belongsTo ──> AttributeOption ──> belongsTo Attribute
│
├─ InventoryTransfer ──────────────────────────────────────────────────────┐
│    ├─ belongsTo ──> Warehouse (from_warehouse_id)                         │
│    ├─ belongsTo ──> Warehouse (to_warehouse_id)                           │
│    └─ hasMany ──> InventoryTransferItem                                   │
│                                                                            │
└─ InventoryAdjustment                                                      │
     ├─ belongsTo ──> Warehouse                                             │
     └─ hasMany ──> InventoryAdjustmentItem                                 │
                                                                            │
  FINANZAS (Pagar)                                                          │
                                                                            │
  Vendor ─────────────────────────────────────────────────────────────────┘
    └─ hasMany ──> AccountPayable
                    └─ hasMany ──> PayablePayment
```

---

## Tablas y Columnas Clave

### `clients`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | bigint | PK |
| user_id | bigint FK | nullable — portal account |
| name | string | |
| email | string | nullable |
| phone | string | nullable |
| document_type | enum | rut, passport, other |
| document_number | string | nullable |
| address | string | nullable |
| is_active | boolean | default true |

---

### `leads`
| Columna | Tipo | Notas |
|---------|------|-------|
| client_id | FK | nullable |
| assigned_user_id | FK | vendedor asignado |
| status | enum | LeadStatus |
| source | enum | LeadSource |
| title | string | |
| product_interest | text | nullable |
| expected_value | decimal | nullable |

---

### `sales`
| Columna | Tipo | Notas |
|---------|------|-------|
| client_id | FK | |
| lead_id | FK | nullable |
| quote_id | FK | nullable |
| negotiation_id | FK | nullable |
| warehouse_id | FK | bodega de despacho |
| user_id | FK | vendedor |
| sale_number | string | único, ej. `SALE-0001` |
| status | enum | SaleStatus |
| subtotal | decimal | |
| discount | decimal | |
| tax | decimal | |
| total | decimal | |
| paid_amount | decimal | |
| balance_due | decimal | |

---

### `account_receivables`
| Columna | Tipo | Notas |
|---------|------|-------|
| sale_id | FK | nullable (manual o de venta) |
| client_id | FK | |
| reference | string | nullable |
| status | enum | PaymentStatus |
| amount | decimal(12,2) | monto original |
| paid_amount | decimal(12,2) | suma de pagos |
| balance_due | decimal(12,2) | amount - paid_amount |
| due_date | date | nullable |
| paid_at | datetime | nullable — cuando llega a $0 |

---

### `account_payables`
| Columna | Tipo | Notas |
|---------|------|-------|
| vendor_id | FK | nullable (proveedor formal) |
| vendor_name | string | nullable (nombre libre) |
| sale_id | FK | nullable |
| reference | string | nullable (n° factura proveedor) |
| status | enum | PaymentStatus |
| amount | decimal(12,2) | |
| paid_amount | decimal(12,2) | |
| balance_due | decimal(12,2) | |
| due_date | date | nullable |

---

### `inventory_stocks`
| Columna | Tipo | Notas |
|---------|------|-------|
| product_variant_id | FK | |
| warehouse_id | FK | |
| quantity | integer | stock disponible |
| reserved_quantity | integer | reservado |

---

## Enums del Sistema

### Ciclos de Vida (Workflows)

```
LeadStatus:      new → contacted → negotiating → won / lost
QuoteStatus:     draft → sent → approved / rejected / expired
SaleStatus:      draft → confirmed / cancelled
ProposalStatus:  draft → sent → viewed → accepted / rejected
NegotiationStatus: negotiating → agreed / rejected
PaymentStatus:   pending → partial → paid
                 pending → overdue (si vence sin pago)
                 any → cancelled
```

### Inventario

```
ProductSerialStatus:      available → reserved → sold → returned
                          available → damaged
                          any → in_transit

InventoryTransferStatus:  draft → sent → received / cancelled
InventoryAdjustmentStatus: draft → confirmed / cancelled
InventoryReservationStatus: active → released / consumed / cancelled
```

### Tipos

```
ProductType:          simple | variant | serializable
WarehouseType:        main | display | returns | transit | reserved | damaged
InventoryMovementType: opening | purchase | sale | sale_return |
                       purchase_return | transfer_out | transfer_in |
                       adjustment_in | adjustment_out
PaymentMethod:        cash | bank_transfer | card | check | other
AttributeDataType:    text | textarea | number | decimal | boolean | date | select
```
