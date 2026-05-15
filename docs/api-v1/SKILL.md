# SKILL: API v1

## 1) Objetivo de esta documentación

Esta carpeta documenta dos bloques relacionados:

- la implementación actual de autenticación API con `Laravel Sanctum`
- el requerimiento de un primer endpoint `API v1` para inventario, enfocado en consulta de `products` y `stocks`

El propósito es dejar claro:

- qué ya fue construido
- cómo funciona el acceso por token
- qué decisiones quedaron cerradas
- cómo se recomienda implementar el endpoint de inventario con paginación, filtros y optimización

---

## 2) Estado actual: acceso API con Sanctum

### Ya implementado

- instalación de `Laravel Sanctum`
- tabla `personal_access_tokens`
- trait `HasApiTokens` en `User`
- archivo `config/sanctum.php`
- uso de `routes/api.php`
- módulo admin `Configuration > Access`
- creación de tokens asociados a un `User`
- visualización del token en `plain text` una sola vez al momento de crearlo
- listado de tokens creados
- revocación de tokens

### Decisiones cerradas

- los tokens se crean **por usuario**
- no se usarán `abilities` o `scopes` por ahora
- si un usuario tiene un token válido, podrá consumir los endpoints que la API exponga y proteja con `auth:sanctum`
- el nombre del token se genera automáticamente

### Formato actual del nombre del token

```text
token-[user_id]-[user_name_slug]
```

Ejemplo:

```text
token-12-john-doe
```

### Comportamiento actual del token

- el token se muestra una sola vez después de crearlo
- luego Sanctum solo conserva el hash
- si el usuario pierde el valor del token, debe revocarlo y generar uno nuevo

### Expiración

En el estado actual del proyecto:

- los tokens no expiran automáticamente
- permanecen válidos hasta que sean revocados

Esto puede cambiar después desde `config/sanctum.php` si se desea una expiración global.

---

## 3) Archivos relevantes del acceso API

### Backend

- `app/Models/User.php`
- `app/Http/Controllers/Admin/AccessController.php`
- `app/Http/Requests/Admin/StoreAccessTokenRequest.php`
- `app/Http/Resources/AccessTokenResource.php`
- `app/Http/Middleware/HandleInertiaRequests.php`
- `routes/admin.php`
- `routes/api.php`
- `config/sanctum.php`
- `database/migrations/2026_05_15_051138_create_personal_access_tokens_table.php`

### Frontend admin

- `resources/js/pages/admin/access/index.tsx`
- `resources/js/components/app-sidebar.tsx`
- `resources/js/routes/admin/access/index.ts`

### Pruebas

- `tests/Feature/Admin/AccessAdminTest.php`
- `tests/Feature/HandleInertiaRequestsTest.php`

---

## 4) Flujo actual para creación de tokens

1. Admin entra a `Configuration > Access`
2. Admin selecciona un usuario
3. El sistema genera el nombre del token automáticamente
4. El sistema crea el token con Sanctum
5. El sistema redirige al listado
6. Se muestra una tarjeta con el `plain_text_token`
7. El token queda almacenado y puede revocarse después

### Consideraciones operativas

- un usuario puede tener múltiples tokens
- cada token representa un acceso independiente
- revocar un token no afecta los demás tokens del mismo usuario

---

## 5) Requerimiento aprobado para API v1

Se construirá un endpoint de inventario parametrizado que permita consultar:

- productos
- variantes
- stock
- stock por bodega cuando aplique

El enfoque debe priorizar:

- paginación
- filtros
- respuesta consistente
- buena performance
- posibilidad de crecimiento

---

## 6) Recomendación de arquitectura para API v1

### Estructura base

- versión inicial bajo `/api/v1`
- rutas protegidas con `auth:sanctum`
- controladores dedicados para API
- `FormRequest` para validar filtros
- `JsonResource` para controlar respuesta
- consultas con eager loading y agregados

### Ruta recomendada inicial

```text
GET /api/v1/inventory/products
```

### Protección recomendada

```php
Route::middleware('auth:sanctum')
```

No se usarán `abilities` por ahora.

---

## 7) Responsabilidad del endpoint inicial

El endpoint debe servir para consulta de inventario, no para auditoría completa de movimientos.

### Debe incluir

- información principal del producto
- relación con marca y categoría
- variantes cuando aplique
- resumen de stock
- stock por bodega si se solicita
- paginación
- filtros

### No debe incluir inicialmente

- historial completo de movimientos
- ajustes detallados
- reservas detalladas
- transferencias
- datos demasiado pesados en la respuesta por defecto

---

## 8) Diseño recomendado del endpoint

### Endpoint principal

```text
GET /api/v1/inventory/products
```

### Parámetros sugeridos

- `search`
- `brand_id`
- `category_id`
- `warehouse_id`
- `has_stock`
- `type`
- `is_active`
- `updated_from`
- `updated_to`
- `page`
- `per_page`
- `sort`
- `direction`
- `include`

### Ejemplo de uso

```text
/api/v1/inventory/products?search=rolex&brand_id=3&warehouse_id=2&has_stock=1&per_page=25&sort=name&direction=asc&include=variants,stocks
```

---

## 9) Respuesta recomendada

### Estructura general

- `data`
- `links`
- `meta`

### Datos sugeridos por producto

- `id`
- `name`
- `slug`
- `sku` si aplica
- `brand`
- `category`
- `type`
- `is_active`
- `variants`
- `stock_summary`
- `stocks`
- `updated_at`

### Ejemplo conceptual

```json
{
  "data": [
    {
      "id": 10,
      "name": "Rolex Submariner",
      "brand": {
        "id": 2,
        "name": "Rolex"
      },
      "category": {
        "id": 1,
        "name": "Timepieces"
      },
      "type": "serial",
      "stock_summary": {
        "total_quantity": 3,
        "available_quantity": 2
      },
      "stocks": [
        {
          "warehouse_id": 1,
          "warehouse_name": "Main Warehouse",
          "quantity": 2
        }
      ]
    }
  ],
  "links": {},
  "meta": {}
}
```

---

## 10) Estrategia de optimización

### Reglas recomendadas

- usar `paginate()` desde el inicio
- limitar `per_page` a un máximo razonable, por ejemplo `100`
- no cargar relaciones innecesarias
- usar `with()` solo para relaciones permitidas por `include`
- usar agregados (`withSum`, `withCount`) cuando sea útil
- evitar N+1 en todas las relaciones
- ordenar solo por columnas controladas
- no permitir `sort` arbitrario sobre cualquier campo

### Includes recomendados

Primera versión sugerida:

- `brand`
- `category`
- `variants`
- `stocks`

### Ordenamientos recomendados

- `name`
- `created_at`
- `updated_at`
- `stock`

### Seguridad de rendimiento

- no devolver payloads masivos por defecto
- no incluir movimientos históricos en el endpoint principal
- dividir endpoints si el detalle crece demasiado

---

## 11) Endpoints complementarios recomendados

Para no sobrecargar el endpoint principal, se recomienda separar después:

- `GET /api/v1/inventory/products/{product}`
- `GET /api/v1/inventory/products/{product}/stocks`
- `GET /api/v1/inventory/products/{product}/serials`

Esto permite:

- mantener el listado ligero
- cargar detalle solo cuando se necesite
- escalar la API sin volver inmanejable la respuesta principal

---

## 12) Propuesta de implementación técnica

### Rutas

- `routes/api.php`

### Controlador sugerido

- `App\Http\Controllers\Api\V1\Inventory\ProductInventoryController`

### Request sugerido

- `App\Http\Requests\Api\V1\Inventory\IndexInventoryProductsRequest`

### Resources sugeridos

- `App\Http\Resources\Api\V1\InventoryProductResource`
- `App\Http\Resources\Api\V1\InventoryProductCollection` opcional

### Servicio o query layer opcional

Si la consulta crece, conviene moverla a:

- `App\Actions\Api\Inventory\ListInventoryProducts`

o una clase equivalente de consulta.

---

## 13) Reglas recomendadas para filtros

### `search`

Debe buscar al menos en:

- nombre del producto
- SKU si existe
- nombre de variante si aplica

### `brand_id`

- filtro exacto

### `category_id`

- filtro exacto

### `warehouse_id`

- filtra stock existente en una bodega determinada

### `has_stock`

- `1` devuelve solo productos con stock
- `0` opcionalmente puede devolver productos sin stock

### `type`

- `simple`
- `variant`
- `serial`

### `include`

Debe ser controlado y validado. No aceptar valores libres sin whitelist.

---

## 14) Riesgos a evitar

- endpoint sin paginación
- devolver todo el inventario completo en una sola respuesta
- N+1 por relaciones de variantes o stocks
- filtros sin validación
- `sort` libre sobre columnas no indexadas
- mezclar movimientos históricos con listado operativo
- exponer información sensible que no deba salir por API

---

## 15) Fase sugerida de implementación

### Fase 1

- asegurar `auth:sanctum`
- crear endpoint `GET /api/v1/inventory/products`
- agregar paginación
- agregar filtros base
- agregar response resource
- agregar tests feature

### Fase 2

- agregar `include=variants,stocks`
- agregar detalle por producto
- agregar endpoint de stocks por producto

### Fase 3

- optimizaciones adicionales
- cache selectiva si aplica
- mejoras de trazabilidad y documentación externa

---

## 16) Resultado esperado de esta iteración

Al finalizar este bloque, el proyecto debe tener:

- autenticación API funcional con tokens Sanctum por usuario
- un panel admin para emisión y revocación de tokens
- lineamientos claros para API v1
- una base documentada para construir el endpoint de inventario con filtros y paginación

---

## 17) Próximo paso recomendado

El siguiente paso natural es implementar el primer endpoint real:

```text
GET /api/v1/inventory/products
```

con:

- `auth:sanctum`
- `FormRequest`
- `JsonResource`
- paginación
- filtros base
- test feature dedicado

---

## 18) Flujo actual de creación de Product en la plataforma

Antes de implementar un endpoint `POST` para productos, es importante dejar documentada la lógica real que el sistema ya usa hoy en el panel admin.

### Regla central ya existente

Un `Product` siempre se crea con al menos un `ProductVariant`.

### Qué hace hoy el flujo actual

1. Se crea el `Product`
2. En el mismo proceso se crean uno o varios `ProductVariant`
3. Los seriales **no** se crean en ese mismo endpoint
4. Si el producto usa seriales, estos se registran posteriormente en una pantalla/flujo separado

### Qué significa esto a nivel de dominio

- `Product` = cabecera del artículo
- `ProductVariant` = unidad comercial mínima obligatoria para ese producto
- `ProductSerial` = trazabilidad individual posterior, solo cuando aplica

---

## 19) Reglas cerradas del flujo de Product

### 19.1 Product siempre requiere Variant

El request actual obliga:

- `variants` requerido
- `variants` debe ser array
- `variants` debe tener mínimo 1 elemento

Esto significa que la API no debe permitir crear un `Product` “vacío” sin variantes.

### 19.2 Los seriales no nacen en el create de Product

Aunque el producto sea:

- `product_type = serializable`
- `has_serial_numbers = true`

eso **no** implica que los seriales se creen junto con el producto.

La lógica actual del sistema separa:

- creación comercial del producto y sus variantes
- registro físico/operativo de seriales

### 19.3 Los seriales pertenecen a una Variant

Los seriales no cuelgan directamente del `Product`, sino de `ProductVariant`.

Por eso, para registrar un serial, primero debe existir:

- el producto
- la variante correspondiente

### 19.4 Registrar serial puede afectar inventario

El flujo actual de seriales no es solo informativo. Al registrar un serial:

- puede asignarse una bodega
- puede generarse stock inicial
- puede generarse movimiento de inventario inicial

Esto confirma que los seriales son un segundo paso más operativo que la creación del producto base.

---

## 20) Implicación para la API

La API debe seguir la misma separación de responsabilidades que hoy tiene el sistema.

### Recomendación principal

No implementar un único endpoint que cree:

- producto
- variantes
- seriales

todo en una sola operación.

### Enfoque recomendado

Separar la API en al menos dos endpoints:

#### Endpoint 1

```text
POST /api/v1/inventory/products
```

Responsable de:

- crear `Product`
- crear `ProductVariant`
- guardar atributos de producto
- guardar atributos de variante

#### Endpoint 2

```text
POST /api/v1/inventory/products/{product}/serials
```

Responsable de:

- registrar seriales sobre una variante existente
- asignar bodega cuando aplique
- generar stock inicial cuando corresponda
- generar movimiento inicial cuando corresponda

---

## 21) Beneficios de respetar este diseño actual

- mantiene consistencia con el panel admin
- evita duplicar lógica distinta entre web y API
- reduce complejidad del endpoint de creación de producto
- conserva la trazabilidad actual de inventario
- permite que seriales sigan siendo un paso operativo controlado

---

## 22) Diseño recomendado para el endpoint POST de Product

### Endpoint propuesto

```text
POST /api/v1/inventory/products
```

### Responsabilidad

Crear un producto con una o varias variantes, sin seriales.

### Campos esperados

- `category_id`
- `brand_id`
- `name`
- `sku`
- `description` nullable
- `product_type`
- `track_stock`
- `has_serial_numbers`
- `status`
- `attributes` opcional
- `variants` requerido

### Ejemplo de payload

```json
{
  "category_id": 1,
  "brand_id": 2,
  "name": "Rolex Submariner",
  "sku": "ROL-SUB-001",
  "description": "Luxury watch",
  "product_type": "serializable",
  "track_stock": true,
  "has_serial_numbers": true,
  "status": "active",
  "attributes": [],
  "variants": [
    {
      "sku": "ROL-SUB-001-VAR",
      "cost": 10000,
      "price": 15000,
      "compare_price": 16000,
      "attributes": []
    }
  ]
}
```

### Reglas mínimas

- debe existir al menos una variante
- cada variante debe tener `sku`
- no deben crearse seriales en este endpoint
- si `product_type = serializable`, eso solo prepara el producto para aceptar seriales después

---

## 23) Diseño recomendado para el endpoint POST de Serials

### Endpoint propuesto

```text
POST /api/v1/inventory/products/{product}/serials
```

### Responsabilidad

Registrar uno o varios seriales para una variante existente del producto.

### Campos base esperados

- `product_variant_id`
- `serial_number`
- `imei_or_reference` nullable
- `warehouse_id` nullable
- `status`
- `attributes` opcional

### Regla importante

La variante enviada debe pertenecer al producto de la URL.

---

## 24) Orden recomendado de implementación

### Fase 1

- documentar el flujo actual
- implementar `GET /api/v1/inventory/products`

### Fase 2

- implementar `POST /api/v1/inventory/products`
- reutilizar la lógica actual de `StoreProductRequest` y `ProductController@store`

### Fase 3

- implementar `POST /api/v1/inventory/products/{product}/serials`
- reutilizar la lógica actual de `StoreProductSerialRequest` y `ProductSerialController@store`

---

## 25) Resultado esperado tras documentar este flujo

Debe quedar claro para cualquier implementación futura que:

- un `Product` no existe sin `Variant`
- los seriales no forman parte del alta inicial del producto
- la API debe respetar esa misma separación
- el diseño correcto es `product create` primero y `serial create` después

---

## 26) Blueprint de endpoints API v1 para Leads

Antes de implementar endpoints CRM para `Leads`, se debe dejar claro que la API no solo expondrá datos: también replicará acciones operativas que hoy ya existen en el panel admin.

La idea correcta no es crear un endpoint único “de leads” con todo mezclado, sino separar por responsabilidad:

- lead principal
- interacciones
- propuestas
- negociaciones
- ofertas de negociación

---

## 27) Objetivo funcional de la API de Leads

La API de `Leads` debe permitir:

- consultar el pipeline comercial
- crear y actualizar leads
- registrar seguimiento comercial
- generar propuestas
- iniciar negociaciones
- registrar ofertas dentro de una negociación
- cerrar o mover el estado del lead según avance real

Debe comportarse como una extensión programática del CRM interno, no como un flujo separado con reglas distintas.

---

## 28) Reglas que la API debe respetar en Leads

- todos los endpoints deben ir protegidos con `auth:sanctum`
- las listas deben usar paginación
- las acciones anidadas deben validar pertenencia real entre recursos
- la API debe respetar la lógica actual del sistema:
  - un lead puede cambiar de estado
  - una propuesta pertenece a un lead
  - una negociación pertenece a un lead
  - una oferta pertenece a una negociación
  - una negociación acordada puede impactar el estado del lead

---

## 29) Endpoints principales de Leads

## 29.1 `GET /api/v1/leads`

### Necesidad

Se necesita para consultar el pipeline general de leads desde integraciones externas, paneles comerciales o procesos automatizados.

### Propósito

Devolver una lista paginada de leads con filtros operativos para búsqueda, clasificación y seguimiento.

### Qué se espera hacer con este endpoint

- listar leads activos o históricos
- filtrar por estado
- filtrar por fuente
- filtrar por responsable asignado
- buscar por título o cliente relacionado
- construir dashboards o sincronizaciones externas

### Filtros sugeridos

- `search`
- `status`
- `source`
- `assigned_to`
- `client_id`
- `page`
- `per_page`
- `sort`
- `direction`

### Información esperada en respuesta

- `id`
- `title`
- `status`
- `source`
- `product_interest`
- `expected_value`
- `closed_at`
- `created_at`
- `client`
- `assigned_user`
- `interactions_count`

---

## 29.2 `GET /api/v1/leads/{lead}`

### Necesidad

Se necesita para consultar el detalle completo de un lead desde clientes externos, flujos internos o integraciones CRM.

### Propósito

Entregar el estado detallado de un lead y, opcionalmente, sus recursos asociados.

### Qué se espera hacer con este endpoint

- abrir la ficha completa del lead
- revisar historial de interacciones
- revisar propuestas creadas
- revisar negociaciones activas o cerradas
- revisar datos del cliente vinculado

### Includes sugeridos

- `client`
- `assigned_user`
- `interactions`
- `proposals`
- `negotiations`

### Información esperada en respuesta

- todos los campos base del lead
- cliente
- usuario asignado
- interacciones
- propuestas
- negociaciones

---

## 29.3 `POST /api/v1/leads`

### Necesidad

Se necesita para permitir ingreso programático de leads desde landing pages, formularios externos, WhatsApp bridges, CRMs de terceros o procesos internos.

### Propósito

Crear un nuevo lead dentro del pipeline comercial del sistema.

### Qué se espera hacer con este endpoint

- registrar prospectos nuevos
- asociarlos a un cliente existente si aplica
- asignarlos a un usuario responsable
- definir fuente y estado inicial
- guardar contexto comercial básico

### Payload esperado

- `client_id` nullable
- `assigned_to` nullable
- `title`
- `status`
- `source`
- `product_interest`
- `expected_value`
- `notes`

### Notas de negocio

- el estado inicial típico debería ser `new`
- la fuente debe respetar el catálogo actual:
  - `whatsapp`
  - `web`
  - `referral`
  - `social`
  - `walk_in`
  - `other`

---

## 29.4 `PATCH /api/v1/leads/{lead}`

### Necesidad

Se necesita para actualizar el lead conforme avanza el proceso comercial.

### Propósito

Modificar el estado, asignación o información relevante del lead.

### Qué se espera hacer con este endpoint

- cambiar estado del lead
- reasignar responsable
- actualizar interés o monto esperado
- completar notas
- cerrar lead como `won` o `lost`

### Regla importante

Debe respetar la lógica actual de `closed_at`:

- si pasa a `won` o `lost`, se debe registrar `closed_at`
- si vuelve a un estado abierto, `closed_at` puede limpiarse

### Payload esperado

- mismos campos base del create

---

## 29.5 `DELETE /api/v1/leads/{lead}`

### Necesidad

Se necesita para casos administrativos donde un lead fue creado por error o debe eliminarse del pipeline.

### Propósito

Eliminar un lead de forma controlada.

### Qué se espera hacer con este endpoint

- eliminar leads duplicados
- eliminar leads creados por error
- depurar registros inválidos

### Consideración importante

Antes de implementarlo conviene cerrar la política de borrado:

- permitir borrado siempre
- impedir borrado si ya tiene propuestas
- impedir borrado si ya tiene negociaciones
- impedir borrado si ya generó quote o sale

---

## 30) Endpoints de Lead Interactions

## 30.1 `POST /api/v1/leads/{lead}/interactions`

### Necesidad

Se necesita para registrar seguimiento comercial sin editar el lead principal.

### Propósito

Agregar una interacción puntual al historial del lead.

### Qué se espera hacer con este endpoint

- registrar llamada
- registrar email
- registrar visita
- registrar mensaje de WhatsApp
- registrar cualquier seguimiento manual

### Payload esperado

- `type`
- `notes`

### Campos que debe completar backend

- `user_id`
- `interacted_at`

### Tipos actuales soportados

- `call`
- `email`
- `visit`
- `whatsapp`
- `other`

---

## 30.2 `DELETE /api/v1/leads/{lead}/interactions/{interaction}`

### Necesidad

Se necesita para corregir errores de captura o limpiar interacciones inválidas.

### Propósito

Eliminar una interacción específica del historial del lead.

### Qué se espera hacer con este endpoint

- borrar seguimiento duplicado
- borrar interacción capturada por error

### Regla importante

Debe validarse que la interacción realmente pertenezca al lead de la URL.

---

## 31) Endpoints de Lead Proposals

## 31.1 `GET /api/v1/proposals`

### Necesidad

Se necesita para listados globales de propuestas, reportería operativa y seguimiento comercial fuera de la vista individual del lead.

### Propósito

Listar propuestas emitidas por el equipo comercial.

### Qué se espera hacer con este endpoint

- consultar propuestas por estado
- consultar propuestas por usuario
- consultar propuestas enviadas por un canal específico
- integrar con dashboards de seguimiento comercial

### Filtros sugeridos

- `search`
- `status`
- `sent_via`
- `user_id`
- `lead_id`
- `page`
- `per_page`

---

## 31.2 `GET /api/v1/leads/{lead}/proposals/{proposal}`

### Necesidad

Se necesita para abrir una propuesta concreta dentro del contexto de un lead.

### Propósito

Consultar el detalle completo de una propuesta, incluyendo sus ítems y datos de envío.

### Qué se espera hacer con este endpoint

- revisar contenido de la propuesta
- ver ítems propuestos
- revisar estado de envío
- obtener datos para un preview o cliente externo

### Información esperada

- datos base de la propuesta
- usuario creador
- ítems
- producto / variante / serial si fueron relacionados
- `sent_via`
- `sent_at`

### Regla importante

Debe validarse que la propuesta pertenezca al lead de la URL.

---

## 31.3 `POST /api/v1/leads/{lead}/proposals`

### Necesidad

Se necesita para permitir la creación programática de propuestas comerciales ligadas a un lead.

### Propósito

Generar una propuesta con uno o varios ítems.

### Qué se espera hacer con este endpoint

- armar propuestas de venta
- asociar productos del catálogo
- definir precios sugeridos
- preparar base para negociación posterior

### Payload esperado

- `title`
- `notes`
- `items`

### Cada item debería incluir

- `product_id`
- `product_variant_id` nullable
- `product_serial_id` nullable
- `name`
- `model`
- `suggested_price`
- `description`
- `notes`

### Regla importante

Además del `exists`, debe validarse:

- que la variante pertenezca al producto
- que el serial pertenezca al producto o variante correcta

---

## 31.4 `POST /api/v1/leads/{lead}/proposals/{proposal}/send`

### Necesidad

Se necesita para reflejar y auditar el momento en que una propuesta fue compartida al cliente.

### Propósito

Marcar o ejecutar el envío de una propuesta.

### Qué se espera hacer con este endpoint

- marcar como enviada por WhatsApp
- enviarla por email
- registrar fecha y canal de envío

### Payload esperado

- `sent_via`

### Valores actuales

- `whatsapp`
- `email`

### Reglas de negocio

- si es `email`, el lead debería tener cliente con email válido
- si es `whatsapp`, conviene validar presencia de teléfono en una fase posterior

---

## 31.5 `DELETE /api/v1/leads/{lead}/proposals/{proposal}`

### Necesidad

Se necesita para corregir propuestas inválidas o eliminarlas antes de continuar el flujo comercial.

### Propósito

Eliminar una propuesta ligada a un lead.

### Qué se espera hacer con este endpoint

- borrar propuesta creada por error
- limpiar propuestas duplicadas

### Regla importante

Debe validarse pertenencia lead/proposal antes de eliminar.

---

## 32) Endpoints de Negotiations

## 32.1 `GET /api/v1/negotiations`

### Necesidad

Se necesita para consulta global de negociaciones activas, acordadas o rechazadas.

### Propósito

Listar negociaciones del pipeline comercial.

### Qué se espera hacer con este endpoint

- ver negociaciones abiertas
- filtrar por responsable
- filtrar por estado
- construir vistas de seguimiento

### Filtros sugeridos

- `status`
- `user_id`
- `lead_id`
- `lead_proposal_id`
- `page`
- `per_page`

---

## 32.2 `GET /api/v1/leads/{lead}/negotiations/{negotiation}`

### Necesidad

Se necesita para abrir el detalle de una negociación en contexto.

### Propósito

Consultar negociación, propuesta base y oferta histórica.

### Qué se espera hacer con este endpoint

- revisar ofertas registradas
- revisar estado actual
- revisar precio inicial y final
- revisar notas de cierre

### Regla importante

Debe validarse que la negociación pertenezca al lead de la URL.

---

## 32.3 `POST /api/v1/leads/{lead}/negotiations`

### Necesidad

Se necesita para iniciar formalmente una negociación sobre un lead.

### Propósito

Crear una negociación nueva, opcionalmente basada en una propuesta.

### Qué se espera hacer con este endpoint

- iniciar negociación directa
- iniciar negociación basada en propuesta
- registrar precio inicial

### Payload esperado

- `lead_proposal_id` nullable
- `initial_price`
- `notes`

### Regla importante

Si se envía `lead_proposal_id`, debe pertenecer al lead actual.

---

## 32.4 `PATCH /api/v1/leads/{lead}/negotiations/{negotiation}`

### Necesidad

Se necesita para cerrar o mover el estado de la negociación según el resultado comercial.

### Propósito

Actualizar el estado de la negociación y su precio final.

### Qué se espera hacer con este endpoint

- mantenerla en curso
- marcarla como acordada
- marcarla como rechazada
- guardar precio final
- guardar notas de resultado

### Payload esperado

- `status`
- `final_price`
- `notes`

### Estados actuales

- `negotiating`
- `agreed`
- `rejected`

### Regla importante

Hoy la lógica actual marca el lead como `won` cuando la negociación pasa a `agreed`.  
Antes de exponer esto por API conviene cerrar la regla inversa:

- qué pasa si una negociación acordada vuelve a `negotiating`
- qué pasa si pasa de `agreed` a `rejected`

---

## 32.5 `DELETE /api/v1/leads/{lead}/negotiations/{negotiation}`

### Necesidad

Se necesita para eliminar negociaciones creadas por error o inválidas.

### Propósito

Eliminar una negociación ligada a un lead.

### Qué se espera hacer con este endpoint

- borrar negociación duplicada
- borrar negociación iniciada por error

### Regla importante

Debe validarse pertenencia lead/negotiation.

---

## 33) Endpoints de Negotiation Offers

## 33.1 `POST /api/v1/leads/{lead}/negotiations/{negotiation}/offers`

### Necesidad

Se necesita para registrar el historial de ofertas dentro de una negociación.

### Propósito

Agregar una oferta a la secuencia de negociación.

### Qué se espera hacer con este endpoint

- registrar oferta propia
- registrar contraoferta del cliente
- mantener trazabilidad cronológica

### Payload esperado

- `type`
- `amount`
- `notes`

### Tipos actuales

- `our_offer`
- `client_counteroffer`

### Regla importante

Conviene bloquear este endpoint cuando la negociación ya no esté en estado `negotiating`.

---

## 33.2 `DELETE /api/v1/leads/{lead}/negotiations/{negotiation}/offers/{offer}`

### Necesidad

Se necesita para corregir errores en el historial de ofertas.

### Propósito

Eliminar una oferta puntual.

### Qué se espera hacer con este endpoint

- borrar oferta duplicada
- borrar oferta mal capturada

### Regla importante

Debe validarse que la oferta pertenezca a la negociación y al lead contextual.

---

## 34) Orden recomendado de implementación para Leads

### Fase 1

- `GET /api/v1/leads`
- `GET /api/v1/leads/{lead}`
- `POST /api/v1/leads`
- `PATCH /api/v1/leads/{lead}`

### Fase 2

- `POST /api/v1/leads/{lead}/interactions`
- `DELETE /api/v1/leads/{lead}/interactions/{interaction}`

### Fase 3

- `POST /api/v1/leads/{lead}/proposals`
- `GET /api/v1/leads/{lead}/proposals/{proposal}`
- `POST /api/v1/leads/{lead}/proposals/{proposal}/send`

### Fase 4

- `POST /api/v1/leads/{lead}/negotiations`
- `PATCH /api/v1/leads/{lead}/negotiations/{negotiation}`
- `POST /api/v1/leads/{lead}/negotiations/{negotiation}/offers`

### Fase 5

- endpoints globales:
  - `GET /api/v1/proposals`
  - `GET /api/v1/negotiations`
- endpoints de borrado donde negocio lo permita

---

## 35) Resultado esperado de este bloque documental

Debe quedar claro que la API de `Leads`:

- no es solo consulta
- replica acciones operativas reales del CRM
- necesita validar pertenencia entre recursos anidados
- debe respetar el flujo comercial actual del sistema
- debe implementarse por dominios: lead, interacción, propuesta, negociación y oferta

---

## 36) Guía de pruebas manuales para Postman: Leads API v1

Esta sección deja listo lo necesario para probar manualmente los endpoints propuestos de `Leads`.

### 36.1 Configuración general

#### Base URL sugerida

```text
http://localhost:8096/api/v1
```

#### Auth

Usar token Sanctum generado desde:

```text
Configuration > Access
```

#### Headers base

```text
Accept: application/json
Authorization: Bearer {SANCTUM_TOKEN}
Content-Type: application/json
```

### 36.2 Variables sugeridas en Postman

```text
base_url = http://localhost:8096/api/v1
token = {SANCTUM_TOKEN}
lead_id = 1
interaction_id = 1
proposal_id = 1
negotiation_id = 1
offer_id = 1
client_id = 1
assigned_to = 1
user_id = 1
product_id = 1
product_variant_id = 1
product_serial_id = 1
```

### 36.3 Valores operativos útiles

#### Lead status

```text
new
contacted
qualified
won
lost
```

#### Lead source

```text
whatsapp
web
referral
social
walk_in
other
```

#### Interaction type

```text
call
email
visit
whatsapp
other
```

#### Proposal send method

```text
email
whatsapp
```

#### Negotiation status

```text
negotiating
agreed
rejected
```

#### Negotiation offer type

```text
our_offer
client_counteroffer
```

---

## 37) Requests listos para probar

## 37.1 `GET /api/v1/leads`

### URL

```text
{{base_url}}/leads
```

### Method

```text
GET
```

### Query Params

```text
search=rolex
status=new
source=web
assigned_to={{assigned_to}}
client_id={{client_id}}
page=1
per_page=15
sort=created_at
direction=desc
```

### Body

```text
No body
```

## 37.2 `GET /api/v1/leads/{lead}`

### URL

```text
{{base_url}}/leads/{{lead_id}}
```

### Method

```text
GET
```

### Query Params

```text
include=client,assigned_user,interactions,proposals,negotiations
```

### Body

```text
No body
```

## 37.3 `POST /api/v1/leads`

### URL

```text
{{base_url}}/leads
```

### Method

```text
POST
```

### Body JSON

```json
{
  "client_id": 1,
  "assigned_to": 1,
  "title": "Lead interesado en Rolex Daytona",
  "status": "new",
  "source": "web",
  "product_interest": "Rolex Daytona Panda",
  "expected_value": 28500,
  "notes": "Cliente pide seguimiento en horario de tarde."
}
```

## 37.4 `PATCH /api/v1/leads/{lead}`

### URL

```text
{{base_url}}/leads/{{lead_id}}
```

### Method

```text
PATCH
```

### Body JSON

```json
{
  "client_id": 1,
  "assigned_to": 1,
  "title": "Lead interesado en Rolex Daytona",
  "status": "contacted",
  "source": "web",
  "product_interest": "Rolex Daytona Panda",
  "expected_value": 29500,
  "notes": "Cliente ya fue contactado y está evaluando propuesta."
}
```

## 37.5 `DELETE /api/v1/leads/{lead}`

### URL

```text
{{base_url}}/leads/{{lead_id}}
```

### Method

```text
DELETE
```

### Body

```text
No body
```

## 37.6 `POST /api/v1/leads/{lead}/interactions`

### URL

```text
{{base_url}}/leads/{{lead_id}}/interactions
```

### Method

```text
POST
```

### Body JSON

```json
{
  "type": "whatsapp",
  "notes": "Se contactó al cliente y confirmó interés en recibir una propuesta."
}
```

## 37.7 `DELETE /api/v1/leads/{lead}/interactions/{interaction}`

### URL

```text
{{base_url}}/leads/{{lead_id}}/interactions/{{interaction_id}}
```

### Method

```text
DELETE
```

### Body

```text
No body
```

## 37.8 `GET /api/v1/proposals`

### URL

```text
{{base_url}}/proposals
```

### Method

```text
GET
```

### Query Params

```text
search=daytona
status=draft
sent_via=email
user_id={{user_id}}
lead_id={{lead_id}}
page=1
per_page=15
```

### Body

```text
No body
```

## 37.9 `GET /api/v1/leads/{lead}/proposals/{proposal}`

### URL

```text
{{base_url}}/leads/{{lead_id}}/proposals/{{proposal_id}}
```

### Method

```text
GET
```

### Query Params

```text
include=items.product,items.variant,items.serial,user
```

### Body

```text
No body
```

## 37.10 `POST /api/v1/leads/{lead}/proposals`

### URL

```text
{{base_url}}/leads/{{lead_id}}/proposals
```

### Method

```text
POST
```

### Body JSON

```json
{
  "title": "Propuesta Rolex Daytona Panda",
  "notes": "Primera propuesta enviada al cliente.",
  "items": [
    {
      "product_id": 1,
      "product_variant_id": 1,
      "product_serial_id": 1,
      "name": "Rolex Daytona Panda",
      "model": "116500LN",
      "suggested_price": 28500,
      "description": "Reloj deportivo en excelente estado.",
      "notes": "Incluye caja y papeles."
    }
  ]
}
```

## 37.11 `POST /api/v1/leads/{lead}/proposals/{proposal}/send`

### URL

```text
{{base_url}}/leads/{{lead_id}}/proposals/{{proposal_id}}/send
```

### Method

```text
POST
```

### Body JSON

```json
{
  "sent_via": "email"
}
```

## 37.12 `DELETE /api/v1/leads/{lead}/proposals/{proposal}`

### URL

```text
{{base_url}}/leads/{{lead_id}}/proposals/{{proposal_id}}
```

### Method

```text
DELETE
```

### Body

```text
No body
```

## 37.13 `GET /api/v1/negotiations`

### URL

```text
{{base_url}}/negotiations
```

### Method

```text
GET
```

### Query Params

```text
status=negotiating
user_id={{user_id}}
lead_id={{lead_id}}
lead_proposal_id={{proposal_id}}
page=1
per_page=15
```

### Body

```text
No body
```

## 37.14 `GET /api/v1/leads/{lead}/negotiations/{negotiation}`

### URL

```text
{{base_url}}/leads/{{lead_id}}/negotiations/{{negotiation_id}}
```

### Method

```text
GET
```

### Query Params

```text
include=proposal,offers,user
```

### Body

```text
No body
```

## 37.15 `POST /api/v1/leads/{lead}/negotiations`

### URL

```text
{{base_url}}/leads/{{lead_id}}/negotiations
```

### Method

```text
POST
```

### Body JSON

```json
{
  "lead_proposal_id": 1,
  "initial_price": 28500,
  "notes": "Cliente solicita mejor precio por pago inmediato."
}
```

## 37.16 `PATCH /api/v1/leads/{lead}/negotiations/{negotiation}`

### URL

```text
{{base_url}}/leads/{{lead_id}}/negotiations/{{negotiation_id}}
```

### Method

```text
PATCH
```

### Body JSON

```json
{
  "status": "agreed",
  "final_price": 27800,
  "notes": "Cliente aceptó la propuesta final."
}
```

## 37.17 `DELETE /api/v1/leads/{lead}/negotiations/{negotiation}`

### URL

```text
{{base_url}}/leads/{{lead_id}}/negotiations/{{negotiation_id}}
```

### Method

```text
DELETE
```

### Body

```text
No body
```

## 37.18 `POST /api/v1/leads/{lead}/negotiations/{negotiation}/offers`

### URL

```text
{{base_url}}/leads/{{lead_id}}/negotiations/{{negotiation_id}}/offers
```

### Method

```text
POST
```

### Body JSON

```json
{
  "type": "client_counteroffer",
  "amount": 27200,
  "notes": "Cliente propone cerrar hoy mismo por este monto."
}
```

## 37.19 `DELETE /api/v1/leads/{lead}/negotiations/{negotiation}/offers/{offer}`

### URL

```text
{{base_url}}/leads/{{lead_id}}/negotiations/{{negotiation_id}}/offers/{{offer_id}}
```

### Method

```text
DELETE
```

### Body

```text
No body
```

---

## 38) Recomendación operativa para pruebas

### Orden sugerido

1. Crear un lead
2. Consultar el lead creado
3. Registrar una interacción
4. Crear una propuesta
5. Consultar la propuesta
6. Iniciar una negociación
7. Registrar una oferta
8. Actualizar la negociación
9. Volver a consultar el lead para validar el impacto funcional

### Notas prácticas

- si el endpoint es `GET` o `DELETE`, no enviar body
- si el endpoint es `POST` o `PATCH`, enviar `raw JSON`
- usar siempre `Accept: application/json`
- usar siempre `Authorization: Bearer {SANCTUM_TOKEN}`
- si una prueba falla por validación, revisar primero:
  - IDs relacionados
  - pertenencia entre lead y recursos hijos
  - valores válidos de catálogos como `status`, `source`, `type`
