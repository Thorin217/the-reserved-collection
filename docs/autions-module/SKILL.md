# SKILL: Auctions Module

## 1) Punto de partida obligatorio: qué se debe cerrar antes de implementar

Antes de construir migraciones, modelos, controladores o pantallas del módulo de subastas, se debe cerrar la lógica operativa y los lineamientos mínimos del proceso. En el estado actual del proyecto existe una experiencia visual de `Auction House` del lado cliente, pero no existe todavía un dominio real de subastas en backend/admin.

### Decisiones ya definidas

- **Tipo de subasta inicial:** subasta tradicional con puja ascendente.
- **Nivel del evento actualizado:** una subasta representa un `lote`.
- **Composición del lote:** una subasta podrá contener múltiples productos a través de `auction_items`.
- **Origen del lote:** siempre proviene de inventario existente.
- **Relación con inventario por ahora:** los productos del lote seguirán tomando su referencia desde inventario, pero sin reserva operativa ni afectación formal de stock en esta fase.
- **Datos del lote:** la subasta almacenará información general del lote y cada `auction_item` conservará su snapshot individual.
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
- **Comportamiento visual del lote:** definir si la imagen principal del lote será manual, tomada del primer item o derivada por alguna regla de prioridad.
- **Composición permitida del lote:** queda por confirmar si un lote podrá mezclar productos `serial`, `variant` y `simple` sin restricciones de UX, aunque el modelo lo soportará.

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
- El foco inmediato es el núcleo operativo: `lote -> pujas -> cierre -> ganador`.
- La evolución aprobada cambia el concepto base del módulo a `una subasta = un lote`.
- Cada lote podrá contener múltiples `auction_items`, pero la puja seguirá registrándose sobre la subasta completa, no por item.

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

- El MVP inicial se construyó como `una subasta = una unidad`.
- La siguiente evolución aprobada cambia `auctions` para que represente la cabecera del lote.
- Se creará `auction_items` como detalle de productos por lote.
- `auction_bids` seguirá vinculado a `auctions`, porque la puja pertenece al lote completo.
- No se creó `auction_bidders` porque cualquier usuario autenticado no-admin puede pujar.

### Conclusión

El módulo ya no está “por construir desde cero”. Ahora se encuentra en estado `MVP funcional implementado`, pendiente de validación final en entorno real, pulido UX y siguientes integraciones.

---

## 5) Flujo de negocio propuesto (versión lote)

### Flujo principal

1. Admin crea una subasta desde admin.
2. Admin configura la cabecera del lote.
3. Admin agrega uno o varios `auction_items` al lote.
4. Cada item toma su referencia desde inventario y conserva snapshot individual.
5. Admin define fechas, precio inicial, precio de reserva y regla mínima de incremento del lote completo.
6. La subasta se publica.
7. Los usuarios registrados que no sean admin pueden pujar desde cliente.
8. Las pujas se registran en backend sin tiempo real.
9. Cliente ve historial, puja actual, items del lote y estado al refrescar o navegar.
10. Al llegar la fecha de cierre, o por acción del admin, la subasta se cierra.
11. El sistema determina automáticamente la puja válida más alta.
12. El sistema fija el `hammer price` como monto final de adjudicación del lote.
13. El ganador ve el resultado y el monto a pagar.
14. Admin ve el cierre completo de la subasta sin afectar todavía módulos contables.

### Estados sugeridos para evento/subasta

- `draft`
- `scheduled`
- `live`
- `closed`
- `cancelled`

### Estados sugeridos para lote

- `draft`
- `scheduled`
- `live`
- `reserve_not_met`
- `sold`
- `unsold`
- `cancelled`

### Reglas cerradas para el cambio a lotes

- `auctions` deja de ser la referencia directa a un solo producto y pasa a ser la cabecera del lote.
- `auction_items` será la tabla de detalle del lote.
- una subasta puede tener uno o varios `auction_items`.
- una puja siempre aplica al lote completo, nunca a un item individual.
- el ganador gana el lote completo.
- `starting_price`, `reserve_price`, `minimum_increment`, `current_bid_amount` y `hammer_price` pertenecen a `auctions`, no a `auction_items`.
- cada `auction_item` mantiene su propio snapshot para preservar nombre, imagen y contexto comercial del producto agregado al lote.
- en esta fase no habrá reserva operativa de inventario ni decremento de stock al agregar items al lote.
- se permitirá reutilizar el mismo producto base en distintas subastas futuras mientras no se defina una política formal de afectación de inventario.

### Elegibilidad de pujador en MVP

- cualquier usuario autenticado y no admin puede pujar
- no se requiere aprobación previa para la primera versión
- se podrá extender más adelante si se decide control de bidders

---

## 6) Modelo de datos objetivo tras el cambio a lotes

## `auctions`

- `id`
- `title`
- `slug`
- `description` nullable
- `status`
- `closure_result` nullable
- `lot_number`
- `hero_image_url` nullable
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
- `notes` nullable
- timestamps

### Notas

- `current_bid_amount` acelera lectura en cliente/admin.
- `hammer_price` representa la puja ganadora final del lote.
- `total_due` en el MVP puede ser igual a `hammer_price`.
- `auctions` deja de cargar relación directa a producto individual.
- la imagen principal del lote puede definirse manualmente o derivarse después desde los items.

## `auction_items`

- `id`
- `auction_id`
- `position`
- `product_id`
- `product_variant_id` nullable
- `product_serial_id` nullable
- `inventory_source_type`
- `reference_price` nullable
- `snapshot` JSON
- `notes` nullable
- timestamps

### Notas

- `snapshot` conserva datos visuales y comerciales del item al momento de agregarse al lote.
- `position` permite ordenar la visualización dentro del lote.
- `reference_price` es informativo y no reemplaza los precios de puja del lote.
- la tabla no implica por sí sola una reserva operativa de inventario.

## `auction_bids`

- `id`
- `auction_id`
- `user_id`
- `amount`
- `is_winning` default false
- `placed_at`
- timestamps

### Tablas descartadas por ahora

- `auction_lots`
- `auction_bidders`
- `auction_fee_lines`
- `auction_reports_snapshots`

### Razón

El alcance actual prioriza un dominio claro y funcional. `auctions` ya cubre la cabecera del lote, `auction_items` cubre el detalle y `auction_bids` mantiene la puja sobre el lote completo. Las demás tablas quedan reservadas para evoluciones posteriores como aprobaciones de bidder o reportería materializada.

---

## 7) Integraciones esperadas con módulos existentes

### Inventario

- cada `auction_item` se vincula a `product`, `product_variant` o `product_serial` según el tipo operativo del producto
- cada item debe reutilizar imagen, nombre, referencia y datos generales del inventario
- en esta fase no habrá bloqueo, reserva ni decremento de inventario
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

### Entidad a incorporar en la siguiente iteración

- `AuctionItem`

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

- migración de `auctions` para eliminar relación directa con producto único
- migración para crear `auction_items`
- refactor de creación de subasta para permitir múltiples items por lote
- adaptación de resources y acciones de dominio al nuevo modelo
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

- crear subasta simple desde inventario
- programar fechas
- seleccionar una unidad `variant` o `serial`
- definir precios base
- revisar historial de pujas
- publicar subasta
- cerrar subasta
- cancelar subasta
- ver ganador y `hammer price`

### Pendiente en admin

- convertir la creación de subasta a creación de lote
- permitir agregar múltiples `auction_items`
- permitir quitar/reordenar items del lote
- mostrar resumen del lote en detalle admin
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

- mostrar lote con múltiples items dentro del detalle de la subasta
- definir galería/listado de items del lote
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
    - composición del lote

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
- se redefinió la subasta como lote
- se definió cierre mixto
- se definió `hammer price` sin fees extra en MVP

**Resultado:** contrato funcional cerrado para el MVP.

## Fase 1 — Diseño del dominio y datos

- estado: en actualización
- el dominio inicial `auctions + auction_bids` debe evolucionar a `auctions + auction_items + auction_bids`
- se debe separar cabecera del lote y detalle de productos

**Resultado esperado:** modelo de datos de lotes estable y listo para migración.

## Fase 2 — Backend admin base

- estado: parcial
- migraciones, modelos y flujo base ya existen
- falta refactor del backend para soportar múltiples `auction_items`

**Resultado esperado:** admin puede crear y operar lotes.

## Fase 3 — Cliente/portal funcional

- estado: parcial
- `Auction House` ya está conectada a datos reales
- falta adaptar detalle y listados a composición multi-item del lote

**Resultado esperado:** cliente puede participar en subastas por lote sin sockets.

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
- falta terminar el cambio estructural a lotes
- falta definición de integraciones posteriores

**Resultado esperado:** módulo estable, validado en entorno real y listo para crecer.

---

## 13) Tareas concretas pendientes

1. Crear migración para remover de `auctions` la referencia directa a producto único.
2. Crear migración para `auction_items`.
3. Refactorizar modelo `Auction` y crear modelo `AuctionItem`.
4. Adaptar factories y seeders del módulo.
5. Adaptar requests, resources y acciones de dominio para creación de lotes.
6. Refactorizar admin create/edit para agregar múltiples `auction_items`.
7. Adaptar admin show para renderizar composición del lote.
8. Adaptar portal `Auction House` y detalle para mostrar múltiples items por subasta.
9. Validar que `auction_bids` siga funcionando sobre la subasta/lote sin cambios de concepto.
10. Ejecutar pruebas y agregar cobertura específica para lotes multi-item.
11. Confirmar que el scheduler del servidor ejecute apertura/cierre automático.
12. Regenerar `Wayfinder` cuando el entorno permita correr `php artisan wayfinder:generate`.
13. Dejar para fase posterior la afectación de inventario, reportería, emails e integración comercial/financiera.

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

---

## 19) Planeación de implementación — Evolución a `auction_events`

Esta sección reemplaza el blueprint anterior como guía vigente para la siguiente gran iteración del módulo. El objetivo ya no es solo manejar `auctions` por lote, sino soportar dos comportamientos bajo una misma agrupación visible:

- un `auction_event` con una sola `auction` que recibe pujas por el lote completo
- un `auction_event` con múltiples `auctions`, donde cada una recibe pujas por un producto específico del grupo

### Regla conceptual cerrada

- `auction_events` será la tabla padre de agrupación
- `auctions` seguirá siendo la unidad real que recibe pujas
- `auction_items` seguirá siendo el detalle de productos de cada `auction`
- `auction_bids` seguirá vinculado a `auctions`

### Interpretación operativa

- si un `auction_event` tiene `1 auction` con múltiples `auction_items`
    - se trata de puja al lote completo
- si un `auction_event` tiene múltiples `auctions`, y cada una contiene `1 auction_item`
    - se trata de puja por producto individual dentro del mismo grupo

### Objetivo técnico de la iteración

Permitir que el sistema modele ambas experiencias sin duplicar lógica de bids, cierre, ganador, scheduler ni UI de resultados. El cambio debe preservar el módulo actual y migrarlo sin romper el flujo ya operativo.

---

## 19.1 Diseño objetivo del dominio

### `auction_events`

Nueva tabla padre para representar el grupo visible en admin y cliente.

Campos sugeridos:

- `id`
- `title`
- `slug`
- `description` nullable
- `format`
- `status`
- `starts_at`
- `ends_at`
- `hero_image_url` nullable
- `notes` nullable
- `created_by`
- `closed_by` nullable
- `closed_at` nullable
- timestamps

### `auctions`

Se mantiene como entidad de puja, pero ahora pertenece a `auction_events`.

Campos nuevos o ajustados:

- `auction_event_id`
- `sequence` nullable

Campos que se mantienen:

- `title`
- `slug`
- `lot_number`
- `status`
- `closure_result`
- `starting_price`
- `reserve_price`
- `minimum_increment`
- `current_bid_amount`
- `winner_user_id`
- `winning_bid_id`
- `hammer_price`
- `starts_at`
- `ends_at`
- `hero_image_url`
- `inventory_snapshot`

### `auction_items`

Se mantiene como detalle de cada `auction`.

Campos vigentes:

- `auction_id`
- `position`
- `inventory_source_type`
- `product_id`
- `product_variant_id` nullable
- `product_serial_id` nullable
- `reference_price`
- `snapshot`
- `notes` nullable

### `auction_bids`

Sin cambio de concepto:

- cada puja pertenece a una `auction`
- nunca a `auction_event`
- nunca directamente a `auction_item`

---

## 19.2 Reglas de negocio para `auction_events`

### `format`

Valores sugeridos:

- `lot`
- `grouped_items`

### Significado

- `lot`
    - el evento normalmente tendrá una sola `auction`
    - esa `auction` puede contener varios `auction_items`
    - el usuario puja al monto total del lote

- `grouped_items`
    - el evento tendrá múltiples `auctions`
    - cada `auction` normalmente tendrá un solo `auction_item`
    - el usuario puja por productos individuales dentro del grupo

### `status`

Valores sugeridos:

- `draft`
- `scheduled`
- `live`
- `closed`
- `cancelled`

### Regla de sincronización sugerida

El estado de `auction_event` no debe manejarse como un estado aislado. Debe derivarse del conjunto de `auctions` hijas.

Reglas sugeridas:

- si todas las hijas están `draft` -> evento `draft`
- si al menos una hija está `scheduled` y ninguna `live` -> evento `scheduled`
- si al menos una hija está `live` -> evento `live`
- si todas las hijas están `closed` -> evento `closed`
- si todas las hijas están `cancelled` -> evento `cancelled`

### Action sugerida

- `SyncAuctionEventStatus`

Esta acción deberá ejecutarse cuando:

- se cree una `auction` hija
- se publique una hija
- se cierre una hija
- se cancele una hija
- el scheduler cambie estado de una hija

---

## 19.3 Estrategia de migración desde el estado actual

La migración debe preservar el flujo actual, donde hoy cada `auction` ya existe como registro funcional.

### Paso 1 — Crear la tabla padre

Crear migración para `auction_events` con:

- datos generales del grupo
- `format`
- `status`
- `starts_at`
- `ends_at`
- `hero_image_url`
- metadata de auditoría

### Paso 2 — Conectar `auctions`

Agregar a `auctions`:

- `auction_event_id` nullable
- `sequence` nullable

### Paso 3 — Backfill de datos

Por cada `auction` existente:

- crear un `auction_event`
- copiar:
    - `title`
    - `slug`
    - `starts_at`
    - `ends_at`
    - `hero_image_url`
    - `created_by`
    - `closed_by`
    - `closed_at`
- definir `format = lot`
- definir `status` alineado al estado actual de la `auction`
- setear `auction.auction_event_id`

### Paso 4 — Endurecer la relación

Cuando el backfill esté estable:

- hacer `auction_event_id` required
- agregar FK e índices definitivos

### Paso 5 — Adaptar resources y consultas

Actualizar:

- modelos
- relations
- resources
- eager loading
- filtros admin
- payload del portal

---

## 19.4 Fases recomendadas de implementación

## Fase A — Infraestructura de datos

- crear migración `auction_events`
- agregar `auction_event_id` y `sequence` en `auctions`
- crear backfill de eventos 1:1 desde auctions existentes
- ajustar factories
- ajustar seeders

**Resultado esperado:** todas las `auctions` actuales quedan agrupadas bajo un `auction_event`.

## Fase B — Dominio backend

- crear modelo `AuctionEvent`
- agregar relaciones:
    - `AuctionEvent hasMany Auctions`
    - `Auction belongsTo AuctionEvent`
- crear enum `AuctionEventFormat`
- crear lógica `SyncAuctionEventStatus`
- adaptar `CreateAuction`, `UpdateAuction`, `CloseAuction`
- adaptar scheduler para considerar el evento padre

**Resultado esperado:** el backend entiende `auction_event` como agrupador sin romper el flujo actual.

## Fase C — Admin base para eventos

- crear listado `auction-events/index`
- crear `auction-events/show`
- crear `auction-events/create`
- crear `auction-events/edit`

### Flujo admin inicial recomendado

- el admin crea un `auction_event`
- elige `format`
- según formato:
    - `lot`: crea una sola `auction` con varios `auction_items`
    - `grouped_items`: crea varias `auctions`, cada una con su item y sus reglas de puja

**Resultado esperado:** el admin ya opera sobre eventos, no directamente sobre auctions aisladas.

## Fase D — Compatibilidad y transición de UI

- mantener `auctions/index` como vista operativa secundaria temporal
- añadir accesos desde `auction_events/show` a las hijas
- revisar acciones publish, close y cancel:
    - por hija
    - o por evento, según convenga

**Resultado esperado:** transición segura sin reescribir toda la operación en un solo paso.

## Fase E — Portal cliente

- reemplazar la idea actual de “una auction visible” por “un event visible”
- si el evento es `lot`
    - mostrar una sola subasta con múltiples items
- si el evento es `grouped_items`
    - mostrar varios productos/subastas dentro del mismo grupo
    - cada uno con su propia acción de bid

**Resultado esperado:** el usuario entiende si está pujando por todo el lote o por un producto específico.

---

## 19.5 Tareas concretas de implementación

1. Crear migración `create_auction_events_table`.
2. Crear migración `add_auction_event_id_to_auctions_table`.
3. Crear script de backfill en migración o acción de datos controlada.
4. Crear modelo `AuctionEvent`.
5. Crear enum `AuctionEventFormat`.
6. Agregar relaciones Eloquent entre `AuctionEvent`, `Auction` y `AuctionItem`.
7. Crear action `SyncAuctionEventStatus`.
8. Adaptar `AuctionResource` para incluir información del evento padre.
9. Crear `AuctionEventResource`.
10. Crear factories y actualizar `AuctionSeeder`.
11. Crear rutas admin para `auction-events`.
12. Implementar pantallas admin para crear y ver eventos.
13. Adaptar portal para mostrar eventos agrupados.
14. Mantener temporalmente compatibilidad con el flujo actual de `auctions/index`.
15. Agregar pruebas feature de migración funcional:
    - evento tipo `lot`
    - evento tipo `grouped_items`
    - sincronización de estado padre
    - cierre de hijas y resolución visible

---

## 19.6 Qué no se hará en esta iteración

- afectación operativa de inventario
- reserva real de seriales o stock
- reportería avanzada
- integración contable
- emails al ganador o perdedor
- sockets o tiempo real

---

## 19.7 Resultado esperado de esta planeación

Al terminar esta iteración, el módulo debe quedar listo para soportar dos tipos de experiencia sobre una misma arquitectura:

- subasta de lote completo con múltiples productos
- grupo de productos donde cada uno tiene su propia subasta

Sin cambiar el principio central:

- `auction_event` agrupa
- `auction` recibe bids
- `auction_item` describe productos
- `auction_bid` registra pujas

Con esto, el módulo queda preparado para crecer sin volver ambiguo el dominio ni duplicar reglas de cierre, ganador y visualización.

---

## 19.8 Checklist exacta para iniciar implementación

Esta checklist está pensada para ejecutarse en orden, minimizando riesgo sobre el módulo actual.

### Entrega 1 — Infraestructura y compatibilidad

#### Objetivo

Introducir `auction_events` sin romper el flujo actual de `auctions`.

#### Archivos / piezas a tocar

- nueva migración `create_auction_events_table`
- nueva migración `add_auction_event_id_to_auctions_table`
- `app/Models/Auction.php`
- nuevo `app/Models/AuctionEvent.php`
- `database/factories/AuctionFactory.php`
- nuevo `database/factories/AuctionEventFactory.php`
- `database/seeders/AuctionSeeder.php`
- `app/Http/Resources/AuctionResource.php`

#### Tareas

1. Crear la tabla `auction_events`.
2. Agregar `auction_event_id` nullable a `auctions`.
3. Agregar `sequence` nullable a `auctions`.
4. Crear el modelo `AuctionEvent`.
5. Agregar relaciones Eloquent:
   - `AuctionEvent::auctions()`
   - `Auction::event()`
6. Crear backfill 1:1 desde `auctions` actuales hacia `auction_events`.
7. Actualizar factories y seeder.
8. Ajustar `AuctionResource` para incluir información básica del evento padre.

#### Criterio de cierre

- toda `auction` existente queda vinculada a un `auction_event`
- `auctions/index`, `show`, `publish`, `close`, `cancel` siguen funcionando
- no cambia todavía la UX principal del admin

---

### Entrega 2 — Dominio backend de eventos

#### Objetivo

Hacer que el backend entienda `auction_event` como agrupador oficial.

#### Archivos / piezas a tocar

- nuevo `app/Enums/AuctionEventFormat.php`
- `app/Models/AuctionEvent.php`
- `app/Models/Auction.php`
- nueva action `app/Actions/Auctions/SyncAuctionEventStatus.php`
- `app/Actions/Auctions/CreateAuction.php`
- `app/Actions/Auctions/UpdateAuction.php`
- `app/Actions/Auctions/CloseAuction.php`
- scheduler / commands de auctions

#### Tareas

1. Crear enum `AuctionEventFormat`.
2. Definir formatos:
   - `lot`
   - `grouped_items`
3. Crear action `SyncAuctionEventStatus`.
4. Invocar esa action en:
   - create
   - update
   - publish
   - close
   - cancel
   - scheduler
5. Asegurar que el estado del evento padre derive correctamente de las hijas.

#### Criterio de cierre

- el evento padre refleja el estado operativo de sus subastas hijas
- no hay inconsistencia entre `auction.status` y `auction_event.status`

---

### Entrega 3 — Admin de `auction_events` para formato `lot`

#### Objetivo

Mover la operación principal del admin hacia eventos, empezando por el caso `lot`.

#### Archivos / piezas a tocar

- nuevas rutas en `routes/admin.php`
- nuevo `app/Http/Controllers/Admin/AuctionEventController.php`
- nuevo request `StoreAuctionEventRequest`
- nuevo request `UpdateAuctionEventRequest`
- nuevas páginas:
  - `resources/js/pages/commercial/auction-events/index.tsx`
  - `resources/js/pages/commercial/auction-events/create.tsx`
  - `resources/js/pages/commercial/auction-events/show.tsx`
  - `resources/js/pages/commercial/auction-events/edit.tsx`
- nuevos helpers en `resources/js/routes/admin/auction-events`

#### Tareas

1. Crear CRUD base de `auction_events`.
2. En `create`, permitir seleccionar `format`.
3. Implementar primero solo `format = lot`.
4. Reutilizar el flujo actual de:
   - una `auction`
   - múltiples `auction_items`
5. Crear una `auction` hija automáticamente dentro del evento.
6. Mostrar desde `show`:
   - info del evento
   - subastas hijas
   - items del lote

#### Criterio de cierre

- el admin puede crear un `auction_event` de tipo `lot`
- ese evento genera una `auction` hija funcional
- el flujo actual de pujas no se rompe

---

### Entrega 4 — Compatibilidad operativa y transición

#### Objetivo

Mantener el módulo usable mientras se migra la operación hacia `auction_events`.

#### Archivos / piezas a tocar

- `resources/js/pages/commercial/auctions/index.tsx`
- `resources/js/pages/commercial/auctions/show.tsx`
- sidebar o navegación admin
- resources y breadcrumbs relacionados

#### Tareas

1. Mantener `auctions/index` como vista operativa secundaria.
2. Añadir navegación hacia `auction-events`.
3. Desde `auction-events/show`, enlazar a las `auctions` hijas cuando haga falta.
4. Definir si `publish`, `close` y `cancel` siguen siendo por `auction` o si luego habrá acciones por evento.

#### Criterio de cierre

- no se pierde trazabilidad ni operatividad durante la transición
- el equipo puede seguir usando el módulo mientras se completa la evolución

---

### Entrega 5 — Soporte a `grouped_items`

#### Objetivo

Abrir el segundo comportamiento: varias subastas hijas dentro del mismo evento.

#### Archivos / piezas a tocar

- `AuctionEventController`
- actions de creación del dominio
- nuevas UI admin para cargar múltiples hijas
- portal de auctions
- resources del evento y de las subastas

#### Tareas

1. Permitir `format = grouped_items`.
2. Crear múltiples `auctions` hijas bajo un mismo evento.
3. Asociar normalmente un `auction_item` a cada hija.
4. Permitir definir por hija:
   - `starting_price`
   - `reserve_price`
   - `minimum_increment`
   - fechas si no se heredan
5. Ajustar cliente para mostrar el grupo y sus subastas individuales.

#### Criterio de cierre

- un mismo `auction_event` puede renderizarse como grupo de subastas individuales
- cada hija recibe bids y ganador independientes

---

### Entrega 6 — Portal adaptado a eventos

#### Objetivo

Hacer visible al usuario final la nueva arquitectura sin confusión.

#### Archivos / piezas a tocar

- `app/Http/Controllers/Portal/AuctionController.php`
- `app/Http/Resources/AuctionResource.php`
- nuevo `AuctionEventResource` si aplica
- `resources/js/components/portal/auction-room.tsx`
- `resources/js/pages/portal/auctions/*`
- `resources/js/types/auctions.ts`

#### Tareas

1. Mostrar `auction_event` como agrupación principal.
2. Si es `lot`:
   - renderizar una sola subasta con múltiples items
3. Si es `grouped_items`:
   - renderizar varias subastas dentro del evento
   - dejar claro por cuál producto se está pujando
4. Mantener `My Auctions` compatible con ambas modalidades.

#### Criterio de cierre

- el usuario entiende si está pujando por el lote completo o por un item/subasta específica

---

### Entrega 7 — Pruebas de regresión y cobertura nueva

#### Objetivo

Cerrar la evolución con seguridad sobre los dos modos del dominio.

#### Archivos / piezas a tocar

- `tests/Feature/Admin/AuctionAdminTest.php`
- nuevos tests para `AuctionEvent`
- `tests/Feature/Portal/AuctionPortalTest.php`
- tests de seeders/factories si aplica

#### Tareas

1. Probar backfill de `auction_events`.
2. Probar evento `lot`.
3. Probar evento `grouped_items`.
4. Probar sincronización de estado padre.
5. Probar cierre de hijas sin romper resultado del evento.
6. Probar render portal para ambas modalidades.

#### Criterio de cierre

- la nueva arquitectura está cubierta con tests del flujo crítico

---

## 19.9 Recomendación de arranque inmediato

Si el desarrollo inicia ahora mismo, el primer bloque concreto a ejecutar debería ser este:

1. crear migración `auction_events`
2. agregar `auction_event_id` a `auctions`
3. crear modelo `AuctionEvent`
4. hacer backfill 1:1
5. adaptar relaciones y resources
6. correr tests del módulo actual

### Razón

Ese bloque no cambia todavía la experiencia del usuario ni obliga a rehacer pantallas. Solo instala la nueva columna vertebral del dominio y deja al sistema listo para crecer hacia `lot` y `grouped_items`.
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
