# Plan de trabajo alineado con propuesta aprobada
## The Reserved Collection

> Basado en el documento entregado al cliente (28 marzo 2026) fileciteturn0file0

---

## 1. Alcance real del proyecto
El proyecto incluye **dos componentes principales integrados**:

### 1. ERP Administrativo
Sistema central para operar el negocio:
- Inventario
- Clientes y leads
- Cuentas por cobrar/pagar
- Facturación
- Cotizaciones
- Módulos especiales (subastas, negociaciones, mantenimiento)

### 2. Landing Page (NO e-commerce completo)
- Catálogo de productos
- Detalle de producto
- Formularios de contacto
- Captura de leads
- Integración con ERP

⚠️ Importante:
- NO incluye pagos online
- NO incluye carrito ni checkout
- Es una plataforma de captación, no de transacción

---

## 2. Ajuste de arquitectura
### Backend
- Laravel (monolito modular)
- API interna para landing + admin

### Frontend
- React + Inertia (admin)
- Landing desacoplada (puede ser Inertia o SSR)

### Base de datos
- MySQL centralizada

### Seguridad
- Roles: admin, operador, asesor

---

## 3. Fases REALES del proyecto (ajustadas)

## Fase 0. Setup + arquitectura
- Repo
- Auth
- Base de datos inicial (users, products, clients)

## Fase 1. Inventario (core crítico)
- Productos
- Seriales
- Estados
- Stock
- Trazabilidad

## Fase 2. CRM básico
- Clientes
- Leads
- Historial

## Fase 3. Finanzas
- Cuentas por cobrar
- Cuentas por pagar
- Cotizaciones
- Base de facturación

## Fase 4. Funcionalidades especiales
- Subastas (NO real-time)
- Negociaciones
- Integración con facturación

## Fase 5. Servicios + landing
- Mantenimiento de relojes
- Landing page
- Captura de leads → ERP

## Fase 6. Dashboard + cierre
- KPIs básicos
- Reportes
- Testing
- Deploy

---

## 4. Cronograma oficial (6 semanas)

### Semana 1
- Setup + arquitectura
- Auth
- DB inicial

### Semana 2
- Inventario + clientes + leads

### Semana 3
- Finanzas + cotizaciones

### Semana 4
- Subastas + negociaciones

### Semana 5
- Servicios + landing page

### Semana 6
- Dashboard + testing + deploy

---

## 5. Decisiones clave (muy importante)

### 1. NO es e-commerce
Esto cambia completamente:
- No hay carrito
- No hay pagos
- No hay órdenes automáticas

👉 Todo es:
**lead → negociación → venta manual**

---

### 2. El ERP es el core del negocio
La landing solo alimenta leads.

---

### 3. Inventario debe ser ultra preciso
- Seriales obligatorios
- Estados
- Historial completo

---

## 6. Entregables finales
- ERP funcional
- Landing funcional
- Base de datos estructurada
- Documentación básica
- Deploy

---

## 7. Fuera de alcance (no desarrollar)
- App móvil
- Pagos online
- Tiempo real (subastas live)
- IA
- Marketplace

---

## 8. Prioridad inmediata de desarrollo
1. Base de datos correcta
2. Inventario
3. Leads
4. Finanzas

