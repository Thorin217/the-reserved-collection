# SKILL: Auctions Module

## 1) Punto de partida obligatorio: qué se debe cerrar antes de implementar

Antes de construir migraciones, modelos, controladores o pantallas del módulo de subastas, se debe cerrar la lógica operativa y los lineamientos mínimos del proceso. En el estado actual del proyecto existe una experiencia visual de `Auction House` del lado cliente, pero no existe todavía un dominio real de subastas en backend/admin.

### Decisiones ya definidas

- **Tipo de subasta inicial:** subasta tradicional con puja ascendente.
- **Nivel del evento:** un producto/unidad por subasta en el MVP.
- **Origen del lote:** siempre proviene de inventario existente.
- **Relación con inventario:** si el producto opera por `variant`, la subasta se crea sobre esa unidad; si opera por `serial`, se crea sobre esa unidad serializada; si es `simple`, se crea sobre su variante operativa.
- **Datos del lote:** la subasta reutiliza información del inventario como nombre, descripción, imagen y demás información general disponible.
- **Precio base / reserva:** el precio de venta actual de la variante servirá como referencia inicial y podrá editarse al crear la subasta.
- **Regla de incrementos:** coexistirán dos reglas, un incremento mínimo requerido y la posibilidad de ofertar libremente por encima de ese mínimo.
- **Registro de pujadores:** podrá pujar cualquier usuario registrado que no sea `admin`.
- **Cierre de subasta:** será mixto, con cierre automático por tiempo y cierre manual disponible para admin.
- **Selección de ganador:** siempre gana la puja válida más alta.
- **Comisiones y fees en MVP:** no se aplicarán fees/comisiones adicionales; el `hammer price` será el monto final a pagar.
- **Pago y post-cierre en MVP:** el módulo no generará automáticamente ventas, cuentas por cobrar ni asientos contables.
- **Visibilidad de la reserva:** el cliente solo verá la puja más alta observable; no se mostrará información adicional de reserva alcanzada.
- **Visibilidad:** el cliente podrá ver en cuáles subastas ha participado; el admin podrá ver todas.

### Decisiones que aún conviene cerrar

- **Post-MVP económico:** definir en una fase posterior cómo se conectará el cierre con ventas, cuentas por cobrar o contabilidad.
- **Inventario durante auction activa:** queda pendiente definir el comportamiento operativo formal (`in_auction`, reserva visual, exclusión del catálogo o política equivalente).
- **Notificación por email:** queda pendiente para una fase posterior; no se implementará en el bloque actual.

### Riesgo de no cerrar esto antes

- diseño de tablas ambiguo
- reglas inconsistentes entre admin y cliente
- cierres manuales difíciles de auditar
- bugs en elección de ganador
- retrabajo de frontend al cambiar reglas de puja

---

## 2) Objetivo del módulo

Construir un módulo de subastas en versión simple, operable desde admin y visible/usable desde cliente, capaz de:

- crear eventos de subasta
- publicar lotes/subastas con fechas y precios base
- registrar pujadores y pujas
- operar sin tiempo real por sockets
- cerrar subastas
- seleccionar ganador
- calcular comisiones base
- dejar trazabilidad suficiente para posteriores reportes

---

## 3) Alcance funcional aprobado para esta fase

### Incluido

- creación de eventos de subasta desde admin
- creación/configuración de una unidad/lote subastable por evento
- definición de fechas de inicio y cierre
- definición de precio inicial
- definición de precio de reserva
- registro de pujadores
- registro de pujas sin tiempo real
- visualización del estado de la subasta desde cliente
- cierre de subasta
- selección de ganador
- resumen final de cierre
- historial básico de pujas

### Fuera de alcance por ahora

- tiempo real con sockets
- live streaming o chat en vivo
- automatizaciones complejas de notificación
- reportería avanzada
- dashboards ejecutivos
- reglas avanzadas de subasta multi-formato
- conciliación financiera completa
- generación automática de ventas o asientos contables

### Notas de alcance

- La reportería no desaparece del plan general, pero queda como fase posterior.
- El foco inmediato es el núcleo operativo: `evento -> pujas -> cierre -> ganador`.
- Aunque la estructura pueda soportar evolución futura a múltiples lotes por evento, el flujo inicial se diseña como `una subasta = una unidad/lote`.

---

## 4) Estado actual del proyecto respecto a Auctions

### Estado real del módulo

El módulo base de `Auctions` ya fue implementado en una primera versión funcional para admin y cliente. El proyecto dejó de tener solo una UI mock de `Auction House` y ahora cuenta con un dominio inicial persistido en backend.

### Implementado

- tabla `auctions`
- tabla `auction_bids`
- enums base de estados y resultado de cierre
- modelo `Auction`
- modelo `AuctionBid`
- factories del dominio
- creación de subasta desde admin
- publicación de subasta
- cierre manual por admin
- cierre automático por scheduler
- selección automática de ganador por mayor puja válida
- persistencia de `hammer_price`
- persistencia de `total_due`
- registro de pujas desde cliente
- restricción para impedir pujas de usuarios `admin`
- vista cliente de subastas activas
- vista cliente de detalle de subasta
- vista cliente de subastas en las que participó
- historial básico de pujas
- reglas anti-spam de pujas:
    - no permitir que el líder actual vuelva a pujar sobre sí mismo
    - cooldown de 4 segundos entre pujas del mismo usuario en la misma subasta
- pruebas feature del flujo crítico

### No implementado todavía

- edición de subastas existentes
- reportería de subastas
- integración económica/contable post-cierre
- notificaciones automáticas por email
- tiempo real con sockets
- capa avanzada de permisos/aprobaciones de pujadores
- bloqueo o reserva operativa visible de inventario por subasta
- estado post-cierre visible para participante (`won`, `lost`, `reserve_not_met`)
- acceso visible a `My Auctions` desde `Profile`
- acceso visible a `My Auctions` desde `Auctions` en el navbar/encabezado de la sección

### Ajuste importante del diseño respecto al plan inicial

- Para el MVP implementado se simplificó el dominio a `auctions + auction_bids`.
- No se creó `auction_lots` porque el alcance aprobado es `una subasta = una unidad`.
- No se creó `auction_bidders` porque cualquier usuario autenticado no-admin puede pujar.

### Conclusión

El módulo ya no está “por construir desde cero”. Ahora se encuentra en estado `MVP funcional implementado`, pendiente de validación final en entorno real, pulido UX y siguientes integraciones.

---

## 5) Flujo de negocio propuesto (versión simple)

### Flujo principal

1. Admin crea una subasta desde admin.
2. Admin selecciona la unidad a subastar desde inventario.
3. El sistema precarga información de inventario como referencia.
4. Admin define fechas, precio inicial, precio de reserva y regla mínima de incremento.
5. La subasta se publica.
6. Los usuarios registrados que no sean admin pueden pujar desde cliente.
7. Las pujas se registran en backend sin tiempo real.
8. Cliente ve historial, puja actual y estado al refrescar o navegar.
9. Al llegar la fecha de cierre, o por acción del admin, la subasta se cierra.
10. El sistema determina automáticamente la puja válida más alta.
11. El sistema fija el `hammer price` como monto final de adjudicación.
12. El ganador ve el resultado y el monto a pagar.
13. Admin ve el cierre completo de la subasta sin afectar todavía módulos contables.

### Estados sugeridos para evento/subasta

- `draft`
- `scheduled`
- `live`
- `closed`
- `cancelled`

### Estados sugeridos para unidad/lote

- `draft`
- `scheduled`
- `live`
- `reserve_not_met`
- `sold`
- `unsold`
- `cancelled`

### Elegibilidad de pujador en MVP

- cualquier usuario autenticado y no admin puede pujar
- no se requiere aprobación previa para la primera versión
- se podrá extender más adelante si se decide control de bidders

---

## 6) Modelo de datos implementado en el MVP

## `auctions`

- `id`
- `title`
- `slug`
- `description` nullable
- `status`
- `closure_result` nullable
- `product_id`
- `product_variant_id`
- `product_serial_id` nullable
- `inventory_source_type`
- `lot_number`
- `starting_price`
- `reserve_price` nullable
- `minimum_increment`
- `current_bid_amount` nullable
- `current_bid_user_id` nullable
- `winning_bid_id` nullable
- `winner_user_id` nullable
- `hammer_price` nullable
- `total_due` nullable
- `starts_at`
- `ends_at`
- `closed_at` nullable
- `is_manually_closed`
- `created_by`
- `closed_by` nullable
- `inventory_snapshot` nullable JSON
- `notes` nullable
- timestamps

### Notas

- `current_bid_amount` acelera lectura en cliente/admin.
- `hammer_price` representa la puja ganadora final.
- `total_due` en el MVP puede ser igual a `hammer_price`.
- `inventory_snapshot` permite congelar datos visuales/comerciales del artículo al momento de crear la subasta.

## `auction_bids`

- `id`
- `auction_id`
- `user_id`
- `amount`
- `is_winning` default false
- `placed_at`
- timestamps

### Tablas descartadas en el MVP

- `auction_lots`
- `auction_bidders`
- `auction_fee_lines`
- `auction_reports_snapshots`

### Razón

El alcance actual prioriza un dominio simple y funcional. Estas tablas quedan reservadas para una evolución posterior si el módulo crece hacia eventos multi-lote, aprobaciones de bidder o reportería materializada.

---

## 7) Integraciones esperadas con módulos existentes

### Inventario

- la subasta se vincula a `product`, `product_variant` o `product_serial` según el tipo operativo del producto
- debe reutilizar imagen, nombre, referencia y datos generales del inventario
- si el lote se vende, debe prepararse la integración con `sales` y estado de inventario al cierre

### CRM / Clientes

- el ganador puede ser un `user` vinculado a `client`
- si el proyecto ya usa `clients` como entidad comercial, conviene diseñar el puente desde ahora

### Comercial / Finance

- en el MVP no habrá creación automática de `sales`, `account_receivables` ni asientos
- el módulo solo dejará listo el resultado de la subasta para futura integración

### Portal / Cliente

- se reutiliza la idea visual de `Auction House`
- la UI actual deberá pasar de mock hardcodeado a datos reales
- el siguiente bloque funcional debe enfocarse en experiencia post-participación:
    - acceso a `My Auctions`
    - resultado visible para usuario participante
    - mensaje de ganador o perdedor al cierre

---

## 8) Backend implementado y pendiente

### Entidades implementadas

- `Auction`
- `AuctionBid`

### Enums implementados

- `AuctionStatus`
- `AuctionClosureResult`

### Laravel components implementados

- migraciones
- modelos
- factories
- form requests
- resources
- controladores admin
- controladores portal/cliente
- acciones de dominio para pujas y cierre

### Controladores implementados

- `Admin/AuctionController`
- `Portal/AuctionController`
- `Portal/AuctionBidController`

### Acciones/servicios implementados

- `CreateAuction`
- `StartAuction`
- `RegisterAuctionBid`
- `CloseAuction`

### Infraestructura implementada

- command para iniciar subastas programadas
- command para cerrar subastas expiradas
- scheduler para apertura/cierre automático

### Pendiente en backend

- edición/update de subastas
- políticas dedicadas si se quiere endurecer autorización
- integración con ventas/finance en fase posterior
- lógica de clasificación post-cierre para participantes:
    - ganador
    - perdedor
    - cierre sin reserva alcanzada

### Reglas de negocio mínimas

- no aceptar pujas si el lote no está `live`
- no aceptar pujas de usuarios `admin`
- no aceptar pujas de usuarios no autenticados
- no aceptar pujas menores o iguales a la puja actual
- validar incremento mínimo requerido
- no cerrar dos veces el mismo loteail
- al cerrar, elegir la puja más alta válida
- si no se alcanza reserva, marcar `reserve_not_met` o `unsold`
- al cerrar, guardar `hammer_price` como monto final

---

## 9) Frontend admin implementado y pendiente

### Pantallas implementadas

- listado de subastas
- crear subasta
- detalle de subasta
- historial de pujas
- acciones de publicar, cerrar y cancelar

### Funcionalidad implementada

- crear subasta desde inventario
- programar fechas
- seleccionar unidad `variant` o `serial`
- definir precios base
- revisar historial de pujas
- publicar subasta
- cerrar subasta
- cancelar subasta
- ver ganador y `hammer price`

### Pendiente en admin

- edición de subasta
- filtros más avanzados
- confirmaciones UX más robustas
- indicadores más claros de resultado/cierre

---

## 10) Frontend cliente implementado y pendiente

### Pantallas implementadas

- listado de subastas visibles
- detalle de subasta
- formulario de puja
- historial de pujas
- vista de subastas en las que el usuario participó

### Adaptación ya realizada

- `Auction House` dejó de usar arrays hardcodeados y ahora consume datos reales
- la puja ahora se registra contra backend
- el historial de bids renderiza datos persistidos
- el detalle ya refleja estado, puja actual y monto mínimo permitido

### Pendiente en cliente

- vista clara de `ganaste / no ganaste`
- countdown y estados más visibles
- pulido de feedback al pujar
- decidir si se mantiene, se separa o se elimina la parte visual de `Live Negotiation`
- acceso a `My Auctions` desde `Profile`
- botón `My Auctions` en la parte superior derecha de `Auctions`
- badges/estado por participación dentro de `My Auctions`
- mensaje visible en auction cerrada si el usuario participó:
    - `You won`
    - `You did not win`
    - `Reserve not met`

### Consideraciones UX

- como no habrá sockets, la UI debe tolerar refrescos manuales o polling simple
- la experiencia debe ser clara al mostrar:
    - puja actual
    - incremento mínimo requerido
    - puja mínima permitida
    - hora de cierre
    - estado de la subasta

---

## 11) Validaciones funcionales mínimas

- `starts_at < ends_at`
- `starting_price >= 0`
- `reserve_price >= starting_price` si así se define
- no permitir pujas sobre lotes cerrados/cancelados
- no permitir pujas por usuarios admin
- `bid.amount` debe ser mayor al monto vigente
- `bid.amount` debe respetar el incremento mínimo configurado
- cierre debe guardar:
    - ganador
    - hammer price
    - total due

---

## 12) Fases de desarrollo y estado actual

## Fase 0 — Definición funcional y reglas

- estado: completada
- se definió subasta tradicional
- se definió una unidad por subasta
- se definió cierre mixto
- se definió `hammer price` sin fees extra en MVP

**Resultado:** contrato funcional cerrado para el MVP.

## Fase 1 — Diseño del dominio y datos

- estado: completada
- se simplificó el dominio a `auctions + auction_bids`
- se definieron enums, relaciones e inventario snapshot

**Resultado:** modelo de datos estable e implementado.

## Fase 2 — Backend admin base

- estado: completada
- migraciones creadas
- modelos y factories creados
- requests y resources creados
- flujo admin de creación/publicación/cierre implementado

**Resultado:** admin puede crear y operar subastas.

## Fase 3 — Cliente/portal funcional

- estado: completada
- `Auction House` conectada a datos reales
- detalle de subasta implementado
- registro de pujas implementado
- historial básico implementado
- vista de participaciones implementada

**Resultado:** cliente puede participar en subastas sin sockets.

## Fase 4 — Cierre y resolución

- estado: completada
- cierre manual implementado
- cierre automático implementado
- resolución de ganador implementada
- persistencia de resultado final implementada

**Resultado:** flujo núcleo de subasta operable.

## Fase 5 — Hardening y preparación para evolución

- estado: parcial
- pruebas feature del flujo crítico ya implementadas
- falta validación completa en entorno MySQL real
- falta pulido UX
- falta definición de integraciones posteriores
- el siguiente bloque funcional aprobado dentro del portal es `My Auctions + resultado post-cierre`

**Resultado esperado:** módulo estable, validado en entorno real y listo para crecer.

---

## 13) Tareas concretas pendientes

1. Ejecutar migraciones en entorno MySQL real y validar el flujo end-to-end.
2. Validar visualmente admin y portal con datos reales.
3. Confirmar que el scheduler del servidor ejecute apertura/cierre automático.
4. Regenerar `Wayfinder` cuando el entorno permita correr `php artisan wayfinder:generate`.
5. Implementar `My Auctions` como sección visible para usuarios con participación.
6. Agregar acceso a `My Auctions` dentro de `Profile`.
7. Agregar botón `My Auctions` en la vista principal de `Auctions`.
8. Mostrar resultado post-cierre para el usuario que participó:
    - ganador
    - perdedor
    - reserva no alcanzada
9. Definir si las unidades subastadas deben quedar visibles, ocultas o marcadas dentro del resto del catálogo.
10. Definir el comportamiento del inventario al cerrar una subasta sin ganador o sin reserva alcanzada.
11. Decidir después el siguiente alcance: reportería, emails o integración comercial/financiera.

---

## 14) Información o lineamientos que aún conviene cerrar

### Operativo

- qué tratamiento tendrá inventario cuando una unidad esté subastándose
- qué sucede operativamente si una subasta cierra sin ganador o sin alcanzar reserva

### Técnico

- cuándo se podrá regenerar `Wayfinder` en el entorno correcto
- si el cliente tendrá refresh manual, polling simple o solo navegación normal como estrategia de actualización

### Evolución posterior

- cuándo y cómo se conectará el cierre con ventas, cuentas por cobrar o contabilidad
- si existirán reportes propios de subastas en una siguiente fase
- si habrá notificación por email al ganador/perdedor en una fase posterior

---

## 14.1) Bloque aprobado para trabajar ahora

### Alcance inmediato

- crear una experiencia visible de `My Auctions`
- registrar allí las subastas donde el usuario tenga bids
- agregar acceso desde `Profile`
- agregar acceso desde el header/top action de `Auctions`
- mostrar el resultado al usuario cuando la subasta ya cerró y él participó

### Reglas deseadas para este bloque

- si el usuario participó y su `user_id` coincide con `winner_user_id`, debe ver mensaje de ganador
- si el usuario participó, la subasta está cerrada y `winner_user_id` es otro usuario, debe ver mensaje de perdedor
- si la subasta cierra con `reserve_not_met`, debe ver mensaje específico aunque haya sido el mayor postor
- esto debe mostrarse sin depender todavía de email

### Fuera del bloque inmediato

- cambios operativos de inventario
- notificaciones por email
- integración contable o comercial post-cierre

---

## 15) Resultado esperado del desarrollo actual

Con el alcance actual, la plataforma cuenta o debe cerrar inmediatamente con un módulo de subastas simple pero funcional, donde:

- admin puede crear y operar subastas
- admin puede preparar condiciones base desde inventario
- usuarios autorizados pueden registrar pujas desde cliente
- las pujas quedan persistidas y auditables
- cada subasta puede cerrarse correctamente
- el sistema determina ganador y monto final
- la base queda lista para reportería e integración económica futura

En términos prácticos, el resultado esperado es un flujo real:

`crear subasta -> publicar -> registrar pujas -> cerrar subasta -> ganador + hammer price`

sin sockets, sin reportería avanzada y sin automatizaciones contables, pero con la base correcta para seguir creciendo.

### Estado del resultado hoy

- implementado a nivel de código
- cubierto con pruebas feature del módulo
- pendiente de validación final en entorno real
- pendiente del bloque de experiencia post-cierre para participantes
- pendiente de definiciones de inventario y email

---

## 16) Riesgos y mitigación

- **Riesgo:** confundir `Auctions` con `Negotiations`.
    - **Mitigación:** tratarlos como dominios distintos desde rutas, tablas, modelos y UI.

- **Riesgo:** usar la UI mock actual como si ya fuera funcional.
    - **Mitigación:** rediseñar esa página sobre datos reales y contratos claros.

- **Riesgo:** reglas ambiguas de cierre y ganador.
    - **Mitigación:** centralizar la resolución en acciones de dominio.

- **Riesgo:** mezclar demasiado pronto inventario, ventas y finanzas.
    - **Mitigación:** MVP enfocado primero en núcleo de subasta.

- **Riesgo:** expectativa de “live auction” sin tiempo real.
    - **Mitigación:** comunicar claramente que la primera versión opera sin sockets.

---

## 17) Orden recomendado para la siguiente iteración

1. validar migraciones y flujo real en MySQL
2. validar scheduler en entorno de ejecución
3. implementar `My Auctions` y accesos visibles en portal
4. implementar estado ganador/perdedor/reserva no alcanzada para participantes
5. revisar UX admin y portal con datos reales
6. decidir tratamiento de inventario durante subasta
7. dejar email y reportería para una fase posterior

---

## 18) Blueprint técnico para iniciar desarrollo

Esta sección deja aterrizado el diseño técnico base para empezar implementación en este proyecto.

## 18.1 Estructura final sugerida del dominio

### Enfoque recomendado para el MVP

- mantener `auctions` como la entidad principal de la subasta
- mantener `auction_bids` como historial de pujas
- evitar complejidad innecesaria de múltiples lotes por evento en esta primera versión
- modelar la “unidad subastable” directamente dentro de `auctions`

### Razón

Como el flujo aprobado es `una subasta = una unidad/producto/serial`, crear una tabla `auction_lots` desde el día uno puede ser una sobreabstracción. Se puede añadir después si negocio evoluciona a eventos multi-lote.

### Dominio recomendado para MVP

- `Auction`
- `AuctionBid`

### Entidad opcional

- `AuctionBidder`
    - solo si se quiere guardar explícitamente participación por usuario además de inferirla desde `auction_bids`

---

## 18.2 Esquema final sugerido de tablas

## `auctions`

- `id`
- `title`
- `slug`
- `description` nullable
- `status`
- `product_id`
- `product_variant_id`
- `product_serial_id` nullable
- `inventory_source_type`
- `lot_number`
- `starting_price`
- `reserve_price` nullable
- `minimum_increment`
- `current_bid_amount` nullable
- `current_bid_user_id` nullable
- `winning_bid_id` nullable
- `winner_user_id` nullable
- `hammer_price` nullable
- `total_due` nullable
- `starts_at`
- `ends_at`
- `closed_at` nullable
- `is_manually_closed` default false
- `created_by`
- `closed_by` nullable
- `inventory_snapshot` JSON nullable
- `notes` nullable
- timestamps

### Campos clave

- `product_id`, `product_variant_id`, `product_serial_id`
    - mantienen relación con inventario real
- `inventory_source_type`
    - valores sugeridos: `simple`, `variant`, `serial`
- `lot_number`
    - identificador visible para admin/cliente
- `current_bid_amount`
    - acelera listados y detalle sin recalcular
- `current_bid_user_id`
    - facilita mostrar quién lidera internamente si luego se necesita
- `winning_bid_id`, `winner_user_id`
    - se llenan al cierre
- `hammer_price`
    - monto final adjudicado
- `total_due`
    - en MVP será igual a `hammer_price`
- `inventory_snapshot`
    - snapshot del nombre, imagen, marca, SKU, serial, referencia y datos visuales del inventario

### Índices recomendados

- index `status`
- index `starts_at`
- index `ends_at`
- index `winner_user_id`
- unique `slug`
- unique `lot_number`
- unique parcial lógica para evitar re-subastar simultáneamente la misma unidad operativa
    - idealmente a nivel aplicación:
        - no permitir otra subasta `draft/scheduled/live` para la misma `product_variant_id` + `product_serial_id`

## `auction_bids`

- `id`
- `auction_id`
- `user_id`
- `amount`
- `placed_at`
- `is_winning` default false
- timestamps

### Índices recomendados

- index `auction_id`
- index `user_id`
- index [`auction_id`, `placed_at`]
- index [`auction_id`, `amount`]

### Regla de orden de pujas

- la prioridad natural debe ser:
    1. monto más alto
    2. si empatan, gana la más antigua válida

## `auction_bidders` opcional

- `id`
- `auction_id`
- `user_id`
- `first_bid_at` nullable
- `last_bid_at` nullable
- `highest_bid_amount` nullable
- timestamps

### Recomendación

- para el MVP se puede omitir
- la participación del cliente puede inferirse desde `auction_bids`

---

## 18.3 Snapshot recomendado de inventario

El JSON `inventory_snapshot` debería guardar, como mínimo:

- `product_name`
- `product_slug`
- `brand_name`
- `category_name`
- `product_sku`
- `variant_sku`
- `serial_number`
- `image_url`
- `price_reference`
- `product_type`
- `has_serial_numbers`
- `attribute_summary`

### Propósito

- mostrar la subasta sin depender de joins frágiles para todo
- preservar cómo se veía la pieza al momento de crear la subasta
- mantener consistencia visual aunque cambie el inventario después

---

## 18.4 Enums sugeridos

## `AuctionStatus`

- `Draft`
- `Scheduled`
- `Live`
- `Closed`
- `ReserveNotMet`
- `Sold`
- `Unsold`
- `Cancelled`

### Interpretación recomendada

- `Draft`: creada, no publicada
- `Scheduled`: publicada, aún no inicia
- `Live`: aceptando pujas
- `Closed`: cerrada técnicamente, pendiente de resolución final si quieres separar
- `ReserveNotMet`: cerró pero no alcanzó reserva
- `Sold`: cerró con ganador válido
- `Unsold`: cerró sin pujas o sin adjudicación
- `Cancelled`: anulada manualmente

### Alternativa más limpia

Si quieres evitar mezclar “estado operativo” y “resultado”, también se puede partir en:

- `status`: `draft`, `scheduled`, `live`, `closed`, `cancelled`
- `closure_result`: `sold`, `reserve_not_met`, `unsold`

Para este proyecto, esa alternativa es más clara y escalable.

## Recomendación final

Usar dos campos:

- `status`
- `closure_result` nullable

## `AuctionClosureResult`

- `Sold`
- `ReserveNotMet`
- `Unsold`

---

## 18.5 Estados y transiciones recomendadas

### `status`

- `draft -> scheduled`
- `scheduled -> live`
- `scheduled -> cancelled`
- `live -> closed`
- `live -> cancelled`

### `closure_result`

- `closed + sold`
- `closed + reserve_not_met`
- `closed + unsold`

### Reglas

- solo `live` acepta pujas
- solo `draft` y `scheduled` pueden editarse libremente
- una subasta `closed` o `cancelled` ya no acepta edición estructural

---

## 18.6 Flujo backend recomendado

### Creación

1. Admin selecciona unidad desde inventario.
2. Backend valida que esa unidad no esté en otra subasta activa.
3. Backend genera snapshot.
4. Backend guarda subasta en `draft`.

### Publicación

1. Admin define fechas y precios.
2. Si todo es válido, subasta pasa a `scheduled`.
3. Un scheduler/command la mueve a `live` cuando `starts_at <= now`.

### Puja

1. Usuario autenticado y no admin envía puja.
2. Backend valida:
    - subasta `live`
    - tiempo no expirado
    - monto > puja actual
    - monto >= puja actual + incremento mínimo
3. Backend crea `auction_bid`.
4. Backend actualiza `current_bid_amount` y `current_bid_user_id`.

### Cierre automático

1. Scheduler busca subastas `live` con `ends_at <= now`.
2. Ejecuta acción de cierre.
3. Determina:
    - puja ganadora
    - reserva alcanzada o no
    - `hammer_price`
    - `total_due`
    - `winner_user_id`
    - `winning_bid_id`

### Cierre manual

1. Admin ejecuta cierre.
2. Se usa la misma acción de dominio del cierre automático.

---

## 18.7 Acciones/servicios recomendados

### `CreateAuction`

- recibe unidad de inventario
- construye snapshot
- guarda subasta

### `PublishAuction`

- valida reglas mínimas
- mueve `draft` a `scheduled`

### `RegisterAuctionBid`

- valida elegibilidad del usuario
- valida estado/tiempo/monto
- persiste puja
- actualiza puja vigente

### `StartScheduledAuctions`

- acción reusable para scheduler
- mueve `scheduled` a `live`

### `CloseAuction`

- cierra subasta
- calcula ganador
- resuelve resultado
- guarda `hammer_price`

### `ResolveAuctionWinner`

- obtiene puja más alta válida
- aplica desempate por antigüedad
- valida reserva

---

## 18.8 Rutas admin sugeridas

### Admin routes

- `GET /admin/auctions`
- `GET /admin/auctions/create`
- `POST /admin/auctions`
- `GET /admin/auctions/{auction}`
- `GET /admin/auctions/{auction}/edit`
- `PUT /admin/auctions/{auction}`
- `POST /admin/auctions/{auction}/publish`
- `POST /admin/auctions/{auction}/close`
- `POST /admin/auctions/{auction}/cancel`
- `GET /admin/auctions/{auction}/bids`

### Acciones internas recomendadas

- `POST /admin/auctions/{auction}/preview-source`
    - opcional si necesitas preview al seleccionar unidad

---

## 18.9 Rutas cliente sugeridas

### Portal routes

- `GET /auctions`
- `GET /auctions/{auction:slug}`
- `POST /auctions/{auction}/bids`
- `GET /profile/auctions`

### Recomendación de naming

- mantener la URL visible como `auctions`
- puedes dejar compatibilidad temporal con `auction-house` si ya existe enlace público

---

## 18.10 Pantallas admin sugeridas

### `admin/auctions/index`

- listado de subastas
- filtros:
    - estado
    - resultado
    - fecha
    - creador
    - búsqueda por lote/producto

### `admin/auctions/create`

- selector de unidad desde inventario
- formulario de precios
- fechas
- preview del snapshot

### `admin/auctions/show`

- resumen de subasta
- datos del artículo
- estado actual
- puja actual
- historial de pujas
- acciones: publicar, cerrar, cancelar

### `admin/auctions/edit`

- edición permitida solo antes de `live`

### `admin/auctions/bids`

- historial paginado de pujas
- usuario
- monto
- fecha/hora

---

## 18.11 Pantallas cliente sugeridas

### `portal/auctions/index`

- listado de subastas activas y programadas
- card con:
    - imagen
    - nombre
    - marca
    - puja actual
    - precio inicial
    - hora de cierre
    - estado

### `portal/auctions/show`

- detalle de la subasta
- historial de pujas
- formulario para pujar
- puja mínima requerida
- countdown
- resultado final si ya cerró

### `portal/profile/auctions`

- subastas en las que el usuario ha participado
- estado
- monto máximo ofertado por el usuario
- resultado final

---

## 18.12 Scheduler / automatización mínima

### Comandos recomendados

- `auctions:start-scheduled`
- `auctions:close-expired`

### Scheduler

- ejecutar cada minuto

### Responsabilidad

- pasar `scheduled` a `live`
- cerrar `live` expiradas

### Importante

- el cierre debe ser idempotente
- si el comando corre dos veces, no debe duplicar lógica ni cambiar ganador incorrectamente

---

## 18.13 Reglas de UI/UX ya decididas

- cliente verá la puja más alta observable
- no habrá sockets
- polling simple o refresh al navegar es suficiente para MVP
- el modal actual de la UI mock debe convertirse en submit real al backend
- la pestaña de `Live Negotiation` no forma parte del dominio `Auctions` y no debe mezclarse en esta implementación

---

## 18.14 Pruebas mínimas requeridas

### Feature tests backend

- crear subasta desde inventario
- impedir crear subasta duplicada para la misma unidad activa
- publicar subasta válida
- registrar puja válida
- rechazar puja de admin
- rechazar puja menor a la actual
- rechazar puja sin incremento mínimo
- cerrar subasta sin pujas -> `unsold`
- cerrar subasta con reserva no alcanzada -> `reserve_not_met`
- cerrar subasta con ganador -> `sold`
- desempate por puja más antigua

### Feature tests UI/admin

- admin puede ver listado
- admin puede crear subasta
- admin puede cerrar manualmente

### Feature tests portal

- usuario autenticado puede pujar
- usuario invitado no puede pujar
- usuario puede ver subastas donde participó

---

## 18.15 Orden técnico recomendado de implementación

1. enums y migraciones
2. modelos + factories
3. acciones de dominio
4. rutas y controladores admin
5. rutas y controladores portal
6. adaptar UI cliente actual
7. scheduler/commands
8. pruebas
