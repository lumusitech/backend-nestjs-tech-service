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
├── clients/         🟢 Implementado — CRUD de clientes (con datos de internet)
├── suppliers/       🟢 Implementado — CRUD de proveedores de repuestos/materiales
├── service-types/   🟢 Implementado — Catálogo de servicios (reparación, instalación, etc.)
├── work-orders/     🟢 Implementado — Órdenes de trabajo (core del sistema)
├── tasks/           🟢 Implementado — Subtareas dentro de una orden
├── payments/        🟢 Implementado — Pagos (MercadoPago, tarjetas, efectivo)
├── finances/        🟢 Implementado — Gastos operativos generales
├── notifications/   🟢 Implementado — Notificaciones in-app (WebSocket + EventEmitter)
├── billing/         🔴 Pendiente   — Facturación ARCA/AFIP (planificado, implementación futura)
├── reports/         🟢 Implementado — Reportes financieros y estadísticas
├── portal/          🟢 Implementado — Portal público para clientes (sin login)
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
- [x] Relación con WorkOrder (ManyToMany — múltiples técnicos por orden)

> Usuarios del sistema: admin y technicians. No incluye clientes (acceden por portal sin login).

---

### 4. `clients/` — Clientes

- [x] Client entity (name, email, phone, address)
- [x] internetProvider, internetPlan
- [x] CRUD endpoints (`GET/POST/PATCH/DELETE /clients`)
- [x] Relación con WorkOrder (un cliente puede tener muchas órdenes)

> Datos de los clientes que solicitan servicios.

---

### 5. `suppliers/` — Proveedores

- [x] Supplier entity (name, contact, phone, email, address, notes)
- [x] CRUD endpoints (`GET/POST/PATCH/DELETE /suppliers`)
- [x] Relación con WorkOrderMaterial (opcional: saber qué proveedor surtió cada material)

> Proveedores de repuestos, herramientas y materiales.

---

### 6. `service-types/` — Catálogo de servicios

- [x] ServiceType entity (name, description, estimatedDuration, isActive)
- [x] CRUD endpoints (`GET/POST/PATCH/DELETE /service-types`)
- [x] Relación con WorkOrder

> Tipos de servicio: "Reparación de PC", "Instalación de cámara", "Servicio eléctrico", etc.

---

### 7. `work-orders/` — Órdenes de trabajo ⭐ CORE

- [x] WorkOrder entity:
  - Cliente (ManyToOne), múltiples técnicos (ManyToMany), tipo de servicio
  - trackingCode único (ej: `TS-A1B2C3`) — auto-generado
  - status: `pending → assigned → in_progress → completed → delivered` (also: postponed, cancelled)
  - priority: `low | medium | high | urgent`
  - location: `on_site` (domicilio) | `workshop` (taller)
  - diagnosis (texto rápido)
  - warrantyUntil (warrantyStatus derivado de la fecha)
  - scheduledDate, startedAt, completedAt
- [x] WorkOrderNote entity:
  - type: `diagnosis | issue | observation | internal`
  - content, createdAt
- [x] WorkOrderMaterial entity:
  - description, quantity, unitCost, supplierId (opcional)
- [x] CRUD endpoints (`GET/POST/PATCH/DELETE /work-orders`)
- [x] Soft delete global (DeleteDateColumn en BaseEntity)
- [x] Endpoint hard delete (`DELETE /work-orders/:id/hard`)
- [x] Filtros: por estado, prioridad, técnico, cliente, fechas, tipo de servicio
- [x] Endpoints anidados:
  - `POST/GET /work-orders/:id/notes`
  - `POST/GET/DELETE /work-orders/:id/materials`
- [x] Gestión de técnicos: `PUT /work-orders/:id/technicians` (reemplazo de array)

> Entidad central del sistema. Representa un trabajo/servicio. Incluye historial (notas con timestamp), materiales usados y seguimiento por código.

---

### 8. `tasks/` — Subtareas

- [x] Task entity (title, description, isCompleted, completedAt, assignedTo)
- [x] CRUD endpoints anidados (`/work-orders/:id/tasks`)

> Checklist o subtareas dentro de una orden de trabajo. Ej: "Verificar fuente", "Probar display", "Limpiar ventiladores".

---

### 9. `payments/` — Pagos

- [x] Payment entity:
  - amount, currency (ARS)
  - method: `credit_card | debit_card | cash | transfer`
  - provider: `mercadopago | cash | transfer`
  - providerPaymentId (ID en MercadoPago)
  - status: `pending | approved | rejected | refunded | cancelled`
  - workOrderId
  - metadata (JSON con datos del provider)
  - installmentNumber, totalInstallments, dueDate, paidAt (soporte de cuotas)
- [x] PaymentProvider interface (strategy pattern)
- [x] MercadoPago provider implementation (SDK instalado)
- [x] Cash provider implementation
- [x] Transfer provider implementation
- [x] CRUD endpoints anidados (`/work-orders/:id/payments`)
- [x] Callback endpoint (`POST /payments/mercadopago/webhook`) — webhook de MercadoPago

> Pagos integrados con MercadoPago y tarjetas. Diseñado con patrón strategy para agregar más providers en el futuro.

---

### 10. `finances/` — Gastos operativos

- [x] Expense entity:
  - description, amount, date
  - category: `rent | utilities | salaries | tools | transport | advertising | supplies | maintenance | hosting | other`
  - isRecurring, notes
- [x] CRUD endpoints (`GET/POST/PATCH/DELETE /expenses`)
- [x] Filtros: por categoría, fechas, período

> Gastos generales del negocio (alquiler, sueldos, herramientas, etc.). Complementa los ingresos de payments y costos de materials para reportes completos.

---

### 11. `notifications/` — Notificaciones in-app

- [x] Notification entity (type, title, message, userId, referenceId, referenceType, metadata, isRead, readAt)
- [x] NotificationType enum: work_order.created, work_order.status_changed, work_order.technician_assigned, task.created, task.completed, payment.created, payment.approved, payment.rejected
- [x] WebSocket Gateway (Socket.IO) con autenticación JWT en handshake
- [x] EventEmitter2 para desacoplamiento entre servicios y notificaciones
- [x] NotificationsListener (@OnEvent) genera notificaciones automáticamente
- [x] Endpoints: `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`
- [x] Integración en work-orders: create, update (status), replaceTechnicians, createTask, updateTask
- [x] Integración en payments: create, update, handleMercadoPagoWebhook
- [x] Admin recibe todas las notificaciones, técnicos solo las suyas

> Notificaciones en tiempo real vía WebSocket. El frontend muestra toasts al instante y tiene un panel para leer todas las notificaciones. Desacoplado vía EventEmitter — los servicios emiten eventos, el módulo notifications escucha y persiste.

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

- [x] `GET /reports/summary` — dashboard completo (KPIs, tendencias, gráficas pre-computadas)
- [x] `GET /reports/income?period=...&dateFrom=&dateTo=` — ingresos con tendencia vs período anterior
- [x] `GET /reports/expenses?period=...&category=...` — gastos por categoría con tendencia
- [x] `GET /reports/profit?period=...` — ganancia bruta y neta con tendencia
- [x] `GET /reports/services?period=...` — servicios más pedidos con revenue por servicio
- [x] `GET /reports/technicians` — ranking de técnicos (completados, tiempo promedio, revenue)
- [x] `GET /reports/technicians/:id` — detalle de rendimiento de un técnico
- [x] `GET /reports/clients/:id` — historial completo del cliente (deudas, pagos, trabajos, KPIs)
- [x] `GET /reports/work-orders/:id/budget` — presupuesto detallado (PDF generado con pdfkit)
- [x] `GET /reports/payments/:id/receipt` — comprobante de pago (PDF generado con pdfkit)
- [x] BFF pattern: el backend devuelve datos pre-computados listos para consumir por el frontend
- [x] PDF generation con pdfkit (presupuestos y comprobantes desde el backend para evitar manipulación)

> Reportes financieros se nutren de Payments (ingresos), WorkOrderMaterial (costos) y Expenses (gastos operativos). Dashboard con KPIs, tendencias mensuales, distribuciones y rankings. PDFs generados desde el backend con pdfkit.

---

### 14. `portal/` — Portal público del cliente

- [x] `GET /portal/track/:trackingCode` — público, sin auth (`@Public()`)
- [x] Respuesta sanitizada:
  - trackingCode, status, priority, location, diagnosis
  - fechas (scheduled, started, completed, warrantyUntil, createdAt)
  - serviceType (name, description)
  - clientName (sin email, phone, address)
  - tasks (title, description, isCompleted, completedAt — sin staff info)
  - notas públicas (type: `diagnosis | issue | observation` — excluye `internal`)
  - paymentSummary (totalApproved, paymentCount, hasPayments, isFullyPaid, installmentsPending/Total)
- [x] NO expone: costos de materiales, notas internas, datos de otros clientes, proveedores, técnicos asignados, datos PII del cliente

> Portal sin autenticación. El cliente ingresa su código de seguimiento (desde comprobante o QR) y ve el estado de su trabajo, tareas y resumen de pagos. El frontend agrega QR para MercadoPago y datos de transferencia.

---

### 15. `database/` — Seeds y migraciones

- [x] Seed de admin por defecto
- [x] Seed de tipos de servicio básicos
- [x] Migraciones (TypeORM)

> Datos iniciales para arrancar. Migraciones para cambios en el esquema.

---

## Entidades y Relaciones

```text
User (admin | technician)
  │
  └──<< WorkOrder (ManyToMany — múltiples técnicos por orden)

Client (internetProvider, internetPlan)
  │
  └──< WorkOrder (client)
          │
          ├──< WorkOrderNote (type, content, createdAt)
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

> **Nota:** Todas las entidades heredan de BaseEntity (id, createdAt, updatedAt, deletedAt) para soporte de soft delete.

---

## Decisiones Técnicas

| Decisión      | Elección                                | Razón                                                |
| ------------- | --------------------------------------- | ---------------------------------------------------- |
| Arquitectura  | Modular (NestJS estándar)               | Proyecto pequeño/mediano, hexagonal es overkill      |
| ORM           | TypeORM                                 | Ya configurado en el proyecto                        |
| Autenticación | JWT + passport                          | Stateless, simple, suficiente para el alcance        |
| Roles         | admin, technician                       | Admin acceso total, technician solo sus órdenes      |
| Clientes      | No se registran                         | Acceden por portal público con código de seguimiento |
| Pagos         | MercadoPago (strategy pattern)          | Abierto a otros providers si se necesita             |
| Facturación   | ARCA/AFIP (planificado)                 | Entidades e interfaz listas, implementación después  |
| QR            | Frontend (Angular)                      | El backend solo devuelve la URL                      |
| Calendario    | Fechas en work orders                   | No se necesita módulo aparte                         |
| Contactos     | clients + suppliers + users             | No se necesita módulo de contactos aparte            |
| Alertas       | Solo in-app                             | Sin email/SMS por ahora                              |
| Notificaciones | WebSocket (Socket.IO) + EventEmitter2  | Push real-time al frontend, desacoplamiento de eventos |
| Soft delete   | Global (BaseEntity + DeleteDateColumn)  | Integridad referencial, nada se borra físicamente   |
| Técnicos      | ManyToMany en WorkOrder                 | Múltiples técnicos pueden trabajar en una orden      |
| Reportes      | BFF pattern (backend computa todo)      | Integridad de datos, frontend solo renderiza          |
| PDFs          | pdfkit desde backend                    | Evita manipulación, estructura para emails futuros   |

---

## Orden de Implementación

1. ✅ `common` — base, DTOs, filtros globales
2. ✅ `auth` + `users` — JWT, roles, login
3. ✅ `clients` — CRUD
4. ✅ `suppliers` — CRUD
5. ✅ `service-types` — catálogo
6. ✅ `work-orders` — core (con notes + materials + técnicos ManyToMany)
7. ✅ `tasks` — subtareas
8. ✅ `payments` — MercadoPago + tarjetas
9. ✅ `finances` — gastos operativos
10. ✅ `notifications` — notificaciones in-app (WebSocket + EventEmitter)
11. `billing` — entidades + interfaz (implementar ARCA después)
12. ✅ `reports` — reportes financieros y operativos (BFF + PDFs)
13. ✅ `portal` — portal público del cliente
14. ✅ `database` — seeds y migraciones

---

## Notas

- **Frontend:** Angular 21+ (a desarrollar más adelante)
- **Mobile:** Android nativo + Jetpack Compose (a decidir)
- **Facturación ARCA/AFIP:** La interfaz y entidades se crean desde el inicio, pero la integración real con los WS de ARCA se implementa en una fase posterior
- **Tracking code:** Se genera automáticamente al crear una work order. Formato: `TS-XXXXX` (ej: `TS-A1B2C3`)
- **QR:** Lo genera el frontend a partir de la URL `https://dominio/portal/track/{code}`
- **Soft delete:** Todas las entidades heredan `deletedAt` de BaseEntity. El borrado lógico es el comportamiento por defecto. Solo admin puede borrar físicamente vía endpoint `DELETE /:id/hard`
- **Técnicos:** Relación ManyToMany con WorkOrder. Una orden puede tener múltiples técnicos asignados. Se asignan reemplazando el array completo vía `PUT /work-orders/:id/technicians`
- **warrantyStatus:** Se deriva de `warrantyUntil` comparando con la fecha actual (no se almacena en DB)
