# Módulos — Funcionalidades Detalladas

---

## 1. Inventario

### 1.1 Productos
**Ruta:** `/admin/products`

| Funcionalidad | Descripción |
|---------------|-------------|
| CRUD de productos | Nombre, SKU, precio, tipo, estado, categoría, marca |
| Tipos de producto | `simple` · `variant` (talla/color) · `serializable` (trazabilidad unitaria) |
| Variantes | Combinaciones de atributos (ej. Talla M + Color Rojo) |
| Seriales | Cada unidad tiene serial propio con ciclo de vida completo |
| Importación masiva | Excel → validación → vista previa → historial de importaciones |
| Actualización de precios | Por filtro de atributos, con historial y preview antes de confirmar |
| Atributos personalizados | Sistema flexible: texto, número, boolean, select, fecha |

**Estados del serial:** `available → reserved → sold → returned → damaged → in_transit`

---

### 1.2 Stock y Movimientos
**Ruta:** `/admin/inventory/stocks`, `/admin/inventory/movements`

- Vista de stock por producto/variante/bodega
- Movimiento apertura (stock inicial)
- Registro automático al confirmar ventas, transferencias y ajustes

**Tipos de movimiento:**
```
opening · purchase · sale · sale_return
purchase_return · transfer_out · transfer_in
adjustment_in · adjustment_out
```

---

### 1.3 Transferencias Inter-Bodega
**Ruta:** `/admin/inventory/transfers`

Flujo: `draft → sent → received / cancelled`

- Define items a transferir (variante + cantidad + seriales opcionales)
- Despacho actualiza stock de origen
- Recepción actualiza stock de destino

---

### 1.4 Ajustes de Inventario
**Ruta:** `/admin/inventory/adjustments`

Flujo: `draft → confirmed / cancelled`

- Ajuste positivo/negativo de stock
- Requiere confirmación antes de impactar inventario
- Registra usuario que confirma

---

### 1.5 Reservas
**Ruta:** `/admin/inventory/reservations`

- Reserva unidades para operaciones futuras (preventas, apartados)
- Estados: `active → released / consumed / cancelled`
- Vinculada a variante + bodega

---

### 1.6 Maestros
| Maestro | Ruta | Descripción |
|---------|------|-------------|
| Marcas | `/admin/brands` | Marca del producto |
| Categorías | `/admin/categories` | Árbol jerárquico (parent_id) |
| Bodegas | `/admin/warehouses` | Tipos: main, display, returns, transit, reserved, damaged |
| Sucursales | `/admin/branches` | Ubicaciones físicas del negocio |
| Atributos | `/admin/attributes` | Definición de atributos y sus opciones |

---

## 2. CRM

### 2.1 Clientes
**Ruta:** `/admin/clients`

- Datos de contacto (email, teléfono, dirección, tipo/número de documento)
- Historial de leads, cotizaciones y ventas vinculadas
- Saldo pendiente de cuentas por cobrar
- Vinculación a usuario del portal (cuenta de acceso)
- Activar/desactivar cliente

---

### 2.2 Leads
**Ruta:** `/admin/leads`

Ciclo de vida: `new → contacted → negotiating → won / lost`

**Orígenes:** WhatsApp · Web · Referido · Social Media · Walk-in · Otro

Funcionalidades por lead:
- **Interacciones**: registro de llamadas, emails, visitas, WhatsApp
- **Propuestas**: documentos formales con items/productos y precios sugeridos
- **Negociaciones**: proceso de ofertas/contraofertas hasta acuerdo de precio final

---

### 2.3 Propuestas
**Ruta:** `/admin/leads/{lead}/proposals`, índice en `/admin/proposals`

Flujo: `draft → sent → viewed → accepted / rejected`

- Envío por WhatsApp o Email
- Items con producto, variante, serial y precio sugerido
- Puede convertirse en cotización

---

### 2.4 Negociaciones
**Ruta:** `/admin/leads/{lead}/negotiations`, índice en `/admin/negotiations`

Flujo: `negotiating → agreed / rejected`

- Registro de rondas de oferta (nuestra oferta vs. contraoferta del cliente)
- Precio final acordado → genera cotización o venta directa

---

## 3. Comercial

### 3.1 Cotizaciones
**Ruta:** `/admin/finance/quotes`

Flujo: `draft → sent → approved / rejected / expired`

- Items con descuento por línea
- Conversión directa a venta cuando es aprobada
- Asociada a cliente, lead y/o negociación

---

### 3.2 Ventas
**Ruta:** `/admin/finance/sales`

Flujo: `draft → confirmed / cancelled`

Al **confirmar** una venta:
1. Se descuenta el inventario (crea `InventoryMovement`)
2. Se marca el serial como `sold`
3. Se genera automáticamente una `AccountReceivable` si hay saldo pendiente

Funcionalidades adicionales:
- Ver factura (layout de impresión con items, totales, datos del cliente)
- Vinculada a cliente, lead, cotización, negociación, bodega

---

### 3.3 Facturas
**Ruta:** `/admin/finance/sales/{sale}/invoice`

- Vista print-friendly de la venta confirmada
- Muestra: datos del cliente (nombre, documento, dirección), items, subtotal, descuentos, impuestos, total y saldo pendiente
- Botón "Imprimir" (`window.print()`)

---

## 4. Finanzas

### 4.1 Cuentas por Cobrar
**Ruta:** `/admin/finance/receivables`

| Funcionalidad | Descripción |
|---------------|-------------|
| Listado con filtros | Por estado y búsqueda por referencia/cliente |
| Métricas en tiempo real | Pendientes · Parciales · Vencidos · Saldo total |
| Detalle de receivable | Estado, cliente, venta relacionada, historial de pagos |
| Registro de pagos | Monto, método, fecha, referencia, notas |
| Estados automáticos | `pending → partial → paid` según pagos; `overdue` si vence |
| Creación manual | Registrar deuda fuera del flujo de ventas |

**Métodos de pago:** Efectivo · Transferencia bancaria · Tarjeta · Cheque · Otro

---

### 4.2 Cuentas por Pagar
**Ruta:** `/admin/finance/payables`

| Funcionalidad | Descripción |
|---------------|-------------|
| Listado con filtros | Por estado y búsqueda por proveedor/referencia |
| Métricas en tiempo real | Pendientes · Parciales · Vencidos · Saldo total |
| Creación | Con proveedor existente O nombre libre (sin proveedor formal) |
| Registro de pagos | Monto, método, fecha, referencia, notas |
| Estados automáticos | `pending → partial → paid` según pagos |

---

### 4.3 Proveedores (Vendors)
**Ruta:** `/admin/finance/vendors`

- Datos de contacto: nombre, email, teléfono, tax_id (RUC/RFC/NIT), persona de contacto, dirección
- Historial de todas sus cuentas por pagar
- Activar/desactivar proveedor
- Registro directo de payables desde el perfil del proveedor

---

## 5. Portal de Clientes

**Prefijo URL:** `/` (sin `/admin`)

| Sección | Funcionalidad |
|---------|---------------|
| Catálogo | Explorar productos disponibles con filtros |
| Carrito | Agregar/quitar items, checkout |
| Wishlist | Lista de deseos |
| Pedidos | Historial de órdenes propias |
| Auction House | Subasta de artículos exclusivos |
| My Collection | Artículos comprados (colección personal) |
| Perfil | Datos personales del usuario portal |

---

## 6. Configuración

| Sección | Funcionalidad |
|---------|---------------|
| Usuarios | Ver y actualizar roles/estado de usuarios admin |
| Historial de importaciones | Log de importaciones masivas con descarga de errores |
| Sucursales | CRUD de ubicaciones físicas |
| Bodegas | CRUD con tipo de bodega |
