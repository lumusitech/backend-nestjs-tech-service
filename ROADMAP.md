# Tech Service — Roadmap

Backend API para la administración de servicios tecnológicos — reparación de PC,
notebooks, TVs, instalación de cámaras de seguridad, servicios de electricidad, y más.

**Stack:** NestJS 11, TypeORM, PostgreSQL, Angular 21+ (frontend futuro)

---

## Estado General

🟢 En producción | 🟡 En desarrollo | 🔴 Pendiente

---

## Estructura del Proyecto (Objetivo)

```text
src/
├── common/          🟢 Implementado — BaseEntity, DTOs, filtros, interceptors, enums
├── auth/            🟢 Implementado — JWT, roles (admin, technician), guards
├── users/           🟢 Implementado — CRUD de usuarios del sistema
├── clients/         🔴 Pendiente   — CRUD de clientes (con datos de internet)
├── suppliers/       🔴 Pendiente   — CRUD de proveedores de repuestos/materiales
├── service-types/   🔴 Pendiente   — Catálogo de servicios (reparación, instalación, etc.)
├── work-orders/     🔴 Pendiente   — Órdenes de trabajo (core del sistema)
├── tasks/           🔴 Pendiente   — Subtareas dentro de una orden
├── payments/        🔴 Pendiente   — Pagos (MercadoPago, tarjetas, efectivo)
├── finances/        🔴 Pendiente   — Gastos operativos generales
├── alerts/          🔴 Pendiente   — Notificaciones in-app
├── billing/         🔴 Pendiente   — Facturación ARCA/AFIP (planificado, implementación futura)
├── reports/         🔴 Pendiente   — Reportes financieros y estadísticas
├── portal/          🔴 Pendiente   — Portal público para clientes (sin login)
└── database/        🟢 Implementado — Seeds y migraciones
```

---

## Checklist por Módulo

### 1. `common/` — Módulo compartido

- [x] BaseEntity (id, createdAt, updatedAt)
- [x] Pagination DTOs
- [x] HTTP exception filter global
- [x] Transform interceptor
- [x] Enums globales (status, prioridad, etc.)

> Utilidades, DTOs y filtros reutilizados por todos los módulos.

---

### 2. `auth/` — Autenticación y autorización

- [x] JWT strategy (passport)
- [x] Login endpoint (`POST /auth/login`)
- [x] Register (solo admin crea usuarios)
- [x] JwtGuard
- [x] RolesGuard
- [x] @Roles() decorator
- [x] @CurrentUser() decorator
- [x] @Public() decorator (para rutas sin auth)

> Autenticación por JWT. Roles: `admin` (acceso total, crea técnicos) y `technician` (solo sus órdenes). Clientes no se registran — usan portal público.

---

### 3. `users/` — Usuarios del sistema

- [x] User entity (name, email, password, role, isActive)
- [x] CRUD endpoints (`GET/POST/PATCH/DELETE /users`)
- [x] Password hashing (bcrypt)
- [x] Solo admin puede crear/modificar usuarios
- [ ] Relación con WorkOrder (técnico asignado)

> Usuarios del sistema: admin y technicians. No incluye clientes (acceden por portal sin login).

---

### 4. `clients/` — Clientes

- [ ] Client entity (name, email, phone, address)
- [ ] internetProvider, internetPlan
- [ ] CRUD endpoints (`GET/POST/PATCH/DELETE /clients`)
- [ ] Relación con WorkOrder (un cliente puede tener muchas órdenes)

> Datos de los clientes que solicitan servicios.

---

### 5. `suppliers/` — Proveedores

- [ ] Supplier entity (name, contact, phone, email, address, notes)
- [ ] CRUD endpoints (`GET/POST/PATCH/DELETE /suppliers`)
- [ ] Relación con WorkOrderMaterial (opcional: saber qué proveedor surtió cada material)

> Proveedores de repuestos, herramientas y materiales.

---

### 6. `service-types/` — Catálogo de servicios

- [ ] ServiceType entity (name, description, estimatedDuration, isActive)
- [ ] CRUD endpoints (`GET/POST/PATCH/DELETE /service-types`)
- [ ] Relación con WorkOrder

> Tipos de servicio: "Reparación de PC", "Instalación de cámara", "Servicio eléctrico", etc.

---

### 7. `work-orders/` — Órdenes de trabajo ⭐ CORE

- [ ] WorkOrder entity:
  - Cliente, técnico asignado, tipo de servicio
  - trackingCode único (ej: `TS-A1B2C3`)
  - status: `pending → assigned → in_progress → completed → delivered`
  - priority: `low | medium | high | urgent`
  - location: `on_site` (domicilio) | `workshop` (taller)
  - diagnosis (texto rápido)
  - warrantyUntil, warrantyStatus
  - scheduledDate, startedAt, completedAt
- [ ] WorkOrderNote entity:
  - type: `diagnosis | issue | observation | internal`
  - content, createdBy, createdAt
- [ ] WorkOrderMaterial entity:
  - description, quantity, unitCost, supplierId (opcional)
- [ ] CRUD endpoints (`GET/POST/PATCH/DELETE /work-orders`)
- [ ] Filtros: por estado, técnico, cliente, fechas, tipo de servicio
- [ ] Endpoints anidados:
  - `POST/GET /work-orders/:id/notes`
  - `POST/GET/DELETE /work-orders/:id/materials`

> Entidad central del sistema. Representa un trabajo/servicio. Incluye historial (notas con timestamp), materiales usados y seguimiento por código.

---

### 8. `tasks/` — Subtareas

- [ ] Task entity (title, description, isCompleted, completedAt, assignedTo)
- [ ] CRUD endpoints anidados (`/work-orders/:id/tasks`)

> Checklist o subtareas dentro de una orden de trabajo. Ej: "Verificar fuente", "Probar display", "Limpiar ventiladores".

---

### 9. `payments/` — Pagos

- [ ] Payment entity:
  - amount, currency (ARS)
  - method: `credit_card | debit_card | cash | transfer`
  - provider: `mercadopago | cash | transfer`
  - providerPaymentId (ID en MercadoPago)
  - status: `pending | approved | rejected | refunded | cancelled`
  - workOrderId
  - metadata (JSON con datos del provider)
- [ ] PaymentProvider interface (strategy pattern)
- [ ] MercadoPago provider implementation
- [ ] CRUD endpoints (`GET/POST /payments`)
- [ ] Callback endpoint (`POST /payments/callback`) — webhook de MercadoPago

> Pagos integrados con MercadoPago y tarjetas. Diseñado con patrón strategy para agregar más providers en el futuro.

---

### 10. `finances/` — Gastos operativos

- [ ] Expense entity:
  - description, amount, date
  - category: `rent | utilities | salaries | tools | transport | advertising | supplies | maintenance | other`
  - isRecurring, notes
- [ ] CRUD endpoints (`GET/POST/PATCH/DELETE /expenses`)
- [ ] Filtros: por categoría, fechas, período

> Gastos generales del negocio (alquiler, sueldos, herramientas, etc.). Complementa los ingresos de payments y costos de materials para reportes completos.

---

### 11. `alerts/` — Notificaciones in-app

- [ ] Alert entity (title, message, type, isRead, userId, workOrderId)
- [ ] Endpoints: `GET /alerts` (listar del usuario), `PATCH /alerts/:id/read`
- [ ] Generación automática al cambiar estado de work order

> Notificaciones internas del sistema. Ej: "Orden TS-A1B2C3 asignada a vos", "Trabajo completado". Solo in-app.

---

### 12. `billing/` — Facturación ARCA/AFIP ⏳ Planificado

- [ ] Invoice entity:
  - invoiceNumber, invoiceType (A | B | C)
  - pointOfSale, cae, caeExpiration
  - clientCUIT, clientName, taxCondition
  - subtotal, iva, total
  - workOrderId, status (`draft | issued | cancelled`), issuedAt
- [ ] InvoiceItem entity (description, quantity, unitPrice, ivaRate, subtotal)
- [ ] BillingProvider interface
- [ ] ARCA provider (esqueleto, sin implementar)
- [ ] Enums: InvoiceType, TaxCondition (RI, MT, CF, EX)

> Facturación electrónica vía ARCA/AFIP (WSFEv4). Solo entidades e interfaz por ahora. Implementación real se hace después.

---

### 13. `reports/` — Reportes y estadísticas

- [ ] `GET /reports/income?period=daily|weekly|monthly|bimestral|yearly`
- [ ] `GET /reports/expenses?period=...&category=...`
- [ ] `GET /reports/profit?period=...` (ingresos - materiales - gastos)
- [ ] `GET /reports/summary` — resumen general (dashboard)
- [ ] `GET /reports/services` — servicios más solicitados por período
- [ ] `GET /reports/technicians/:id` — rendimiento por técnico

> Reportes financieros se nutren de Payments (ingresos), WorkOrderMaterial (costos) y Expenses (gastos operativos). También reportes operativos (órdenes, técnicos, servicios).

---

### 14. `portal/` — Portal público del cliente

- [ ] `GET /portal/track/:trackingCode` — público, sin auth
- [ ] Respuesta sanitizada:
  - trackingCode, status, serviceType
  - fechas (scheduled, started, completed)
  - notas públicas (type: `diagnosis | observation`)
  - datos de contacto del negocio
- [ ] NO expone: costos, notas internas, datos de otros clientes, proveedores

> Portal sin autenticación. El cliente ingresa su código de seguimiento (desde comprobante o QR) y ve el estado de su trabajo.

---

### 15. `database/` — Seeds y migraciones

- [x] Seed de admin por defecto
- [ ] Seed de tipos de servicio básicos
- [x] Migraciones (TypeORM)

> Datos iniciales para arrancar. Migraciones para cambios en el esquema.

---

## Entidades y Relaciones

```text
User (admin | technician)
  │
  └──< WorkOrder (assignedTo)

Client (internetProvider, internetPlan)
  │
  └──< WorkOrder (client)
          │
          ├──< WorkOrderNote (type, content, createdBy, createdAt)
          ├──< WorkOrderMaterial (description, qty, unitCost, supplier?)
          ├──< Task (title, isCompleted)
          ├──< Payment (amount, method, status, provider)
          ├──< Invoice (number, type, cae, total)
          └─── Alert (type, isRead)

Supplier
  │
  └──< WorkOrderMaterial (opcional)

Expense (amount, category, date)  ← gastos operativos generales
```

---

## Decisiones Técnicas

| Decisión      | Elección                       | Razón                                                |
| ------------- | ------------------------------ | ---------------------------------------------------- |
| Arquitectura  | Modular (NestJS estándar)      | Proyecto pequeño/mediano, hexagonal es overkill      |
| ORM           | TypeORM                        | Ya configurado en el proyecto                        |
| Autenticación | JWT + passport                 | Stateless, simple, suficiente para el alcance        |
| Roles         | admin, technician              | Admin acceso total, technician solo sus órdenes      |
| Clientes      | No se registran                | Acceden por portal público con código de seguimiento |
| Pagos         | MercadoPago (strategy pattern) | Abierto a otros providers si se necesita             |
| Facturación   | ARCA/AFIP (planificado)        | Entidades e interfaz listas, implementación después  |
| QR            | Frontend (Angular)             | El backend solo devuelve la URL                      |
| Calendario    | Fechas en work orders          | No se necesita módulo aparte                         |
| Contactos     | clients + suppliers + users    | No se necesita módulo de contactos aparte            |
| Alertas       | Solo in-app                    | Sin email/SMS por ahora                              |

---

## Orden de Implementación

1. `common` — base, DTOs, filtros globales
2. `auth` + `users` — JWT, roles, login
3. `clients` — CRUD
4. `suppliers` — CRUD
5. `service-types` — catálogo
6. `work-orders` — core (con notes + materials)
7. `tasks` — subtareas
8. `payments` — MercadoPago + tarjetas
9. `finances` — gastos operativos
10. `alerts` — notificaciones in-app
11. `billing` — entidades + interfaz (implementar ARCA después)
12. `reports` — reportes financieros y operativos
13. `portal` — portal público del cliente
14. `database` — seeds y migraciones

---

## Notas

- **Frontend:** Angular 21+ (a desarrollar más adelante)
- **Mobile:** Android nativo + Jetpack Compose (a decidir)
- **Facturación ARCA/AFIP:** La interfaz y entidades se crean desde el inicio, pero la integración real con los WS de ARCA se implementa en una fase posterior
- **Tracking code:** Se genera automáticamente al crear una work order. Formato sugerido: `TS-XXXXX` (ej: `TS-A1B2C3`)
- **QR:** Lo genera el frontend a partir de la URL `https://dominio/portal/track/{code}`
