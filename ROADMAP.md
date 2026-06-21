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
├── billing/         🟢 Implementado — Facturación ARCA/AFIP (stub, PDFs)
├── reports/         🟢 Implementado — Reportes financieros y estadísticas
├── portal/          🟢 Implementado — Portal público para clientes (sin login)
├── database/        🟢 Implementado — Seeds y migraciones
└── testing/         🟢 Implementado — Tests unitarios, e2e y aceptación
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

### 12. `billing/` — Facturación ARCA/AFIP

- [x] Invoice entity:
  - invoiceNumber (auto-generado: 0001-00000001), invoiceType (A | B | C)
  - pointOfSale, cae, caeExpiry
  - clientName, clientCuit, clientAddress, clientIvaCondition
  - subtotal, ivaAmount, total
  - workOrderId, paymentId (opcional), status (`draft | issued | cancelled | rejected`)
  - issuedAt, cancelledAt, metadata (jsonb)
- [x] BillingProvider interface (strategy pattern)
- [x] ArcaProvider stub (retorna CAE mock, loggea warning)
- [x] Enums: InvoiceType (A/B/C), InvoiceConcept, InvoiceStatus, IvaCondition
- [x] `POST /billing/invoices` — crear factura borrador
- [x] `GET /billing/invoices` — listar con filtros (status, type, fecha, clientName)
- [x] `GET /billing/invoices/:id` — obtener una con relaciones
- [x] `POST /billing/invoices/:id/issue` — emitir (draft → issued, llama ARCA stub)
- [x] `POST /billing/invoices/:id/cancel` — anular
- [x] `GET /billing/invoices/:id/pdf` — descargar factura PDF (pdfkit, formato argentino)
- [x] Invoice PDF: tipo, número, punto de venta, CAE, emisor CUIT, cliente CUIT/IVA, subtotal, IVA, total
- [x] Client entity actualizada: cuit + ivaCondition opcionales

> Facturación electrónica vía ARCA/AFIP. Interface + entities + flujo admin completo. Stub de ARCA listo para conectar WSFEv1 en fase posterior.

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
11. ✅ `billing` — facturación ARCA/AFIP (stub + PDFs)
12. ✅ `reports` — reportes financieros y operativos (BFF + PDFs)
13. ✅ `portal` — portal público del cliente
14. ✅ `database` — seeds y migraciones
15. ✅ `testing` — tests unitarios, e2e y aceptación (por módulo)
16. ✅ `swagger` — documentación OpenAPI + CORS + prefijo /api/

---

### 16. `testing/` — Testing completo

> **Objetivo:** Cubrir todos los módulos con tests antes del deploy. Se hace módulo por módulo, verificando que cada uno pase los 3 niveles antes de pasar al siguiente.

#### Stack de testing

- **Unit tests:** Jest (ya incluido en NestJS)
- **E2E tests:** Jest + Supertest (HTTP contra app levantada)
- **Acceptance tests:** Jest + Supertest (flujos completos de negocio)

#### Infraestructura de testing

- [x] `.env.test` — variables de entorno para test (DB separada: `techservice_test`)
- [x] `test/helpers/app.helper.ts` — `createTestApp()` bootstrap de NestJS para e2e
- [x] `test/helpers/auth.helper.ts` — `loginAsAdmin()`, `loginAsTechnician()`, `authHeader()`
- [x] `test/helpers/seed.helper.ts` — `seedTestData()` con migraciones + datos base
- [x] `src/common/testing/mock-query-builder.helper.ts` — `createMockRepository()`, `createMockQueryBuilder()` reutilizables
- [x] `eslint.config.mjs` — overrides para archivos de test (relaxed rules)
- [x] `package.json` — scripts: `test:unit`, `test:e2e`, `test:acceptance`, `test:all`

#### Unit tests (270 tests, 13 suites) ✅

- [x] `auth/` — validateUser, login, register (11 tests)
- [x] `users/` — CRUD, findByEmail (15 tests)
- [x] `clients/` — CRUD, filters (15 tests)
- [x] `suppliers/` — CRUD, filters (18 tests)
- [x] `service-types/` — CRUD, duplicate name (18 tests)
- [x] `work-orders/` — CRUD, status transitions, technicians, notes, materials (40 tests)
- [x] `tasks/` — CRUD, events, completion (16 tests)
- [x] `payments/` — CRUD, providers, webhook, events (37 tests)
- [x] `finances/` — CRUD, filters (21 tests)
- [x] `billing/` — CRUD, issue, cancel, invoice number gen (33 tests)
- [x] `reports/` — all report methods (27 tests)
- [x] `portal/` — trackByCode, paymentSummary (18 tests)

#### E2E tests (11 spec files) ✅

- [x] `auth.e2e-spec.ts` — login, register, credentials
- [x] `clients.e2e-spec.ts` — full CRUD, auth/roles
- [x] `suppliers.e2e-spec.ts` — full CRUD, auth
- [x] `service-types.e2e-spec.ts` — full CRUD, duplicate name
- [x] `work-orders.e2e-spec.ts` — CRUD, status changes, technicians
- [x] `tasks.e2e-spec.ts` — CRUD, completion
- [x] `payments.e2e-spec.ts` — CRUD, providers, webhook
- [x] `finances.e2e-spec.ts` — CRUD, filters
- [x] `billing.e2e-spec.ts` — create, issue, cancel, PDF
- [x] `reports.e2e-spec.ts` — all endpoints, PDFs
- [x] `portal.e2e-spec.ts` — public tracking

#### Acceptance tests (2 spec files) ✅

- [x] `work-order-flow.e2e-spec.ts` — full lifecycle: client → WO → tasks → payment → portal → reports
- [x] `billing-flow.e2e-spec.ts` — full lifecycle: client → WO → payment → invoice → issue → PDF → cancel

#### Comandos

```bash
# Unit tests (sin DB, rápido)
pnpm test:unit

# E2E tests (requiere PostgreSQL con techservice_test)
pnpm test:e2e

# Acceptance tests (requiere PostgreSQL con techservice_test)
pnpm test:acceptance

# Todos
pnpm test:all

# Coverage
pnpm test:unit:cov
```

---

## Notas

- **Frontend:** Angular 21+ (a desarrollar más adelante, repo separado)
- **Mobile:** Android nativo + Jetpack Compose (a decidir)
- **API prefix:** Todas las rutas están bajo `/api/` (ej: `/api/clients`, `/api/work-orders`)
- **CORS:** Habilitado para `http://localhost:4200` (Angular dev server)
- **Swagger:** Documentación interactiva en `http://localhost:3000/api/docs`
- **Swagger JSON:** Spec OpenAPI en `http://localhost:3000/api/docs-json` (para codegen en frontend)
- **Tracking code:** Se genera automáticamente al crear una work order. Formato: `TS-XXXXX` (ej: `TS-A1B2C3`)
- **QR:** Lo genera el frontend a partir de la URL `https://dominio/portal/track/{code}`
- **Soft delete:** Todas las entidades heredan `deletedAt` de BaseEntity. El borrado lógico es el comportamiento por defecto. Solo admin puede borrar físicamente vía endpoint `DELETE /:id/hard`
- **Técnicos:** Relación ManyToMany con WorkOrder. Una orden puede tener múltiples técnicos asignados. Se asignan reemplazando el array completo vía `PUT /work-orders/:id/technicians`
- **warrantyStatus:** Se deriva de `warrantyUntil` comparando con la fecha actual (no se almacena en DB)
- **Frontend repos:** Backend y frontend en repos separados. El API es el contrato. Swagger codegen mantiene tipos sincronizados.

---

## Integraciones pendientes — Detalle de implementación

### ARCA/AFIP — Facturación Electrónica (WSFEv1)

El módulo `billing/` tiene la interfaz, entidades, flujo admin y PDFs listos. El `ArcaProvider` actual es un **stub**. Para conectar con ARCA real se necesita:

#### Requisitos previos (AFIP)

1. **CUIT del negocio** — habilitado en AFIP con actividad "Servicios de reparación"
2. **Certificado digital (.crt)** — se obtiene desde AFIP → Administrador de Relaciones → Certificados
3. **Clave privada (.key)** — generada junto al certificado
4. **Punto de venta** — número autorizado por AFIP (ej: 0001). Cada punto de venta tiene su propia numeración
5. **WSAA habilitado** — autorización para usar WSFEv1 (Facturación Electrónica). Se habilita en AFIP → Administrador de Relaciones de Clave Fiscal

#### Dependencias a instalar

```bash
pnpm add soap node-forge
pnpm add -D @types/soap
```

- `soap` — cliente SOAP para consumir los Web Services de AFIP
- `node-forge` — para manejar certificados PKCS12/PFX y firmar el TRA (Ticket de Request de Acceso)

#### Flujo de autenticación WSAA

1. Generar un **TRA** (Ticket de Request de Acceso) con XML que especifique el servicio `wsfe` y la validez (24h)
2. Firmar el TRA con el **certificado .crt** y la **clave privada .key** usando PKCS7
3. Enviar el TRA firmado al WSAA (`https://wsaahomo.afip.gov.ar/ws/services/LoginCms` en homologación)
4. Recibir un **TA** (Ticket de Acceso) con token + sign (válido ~24h)
5. Usar token + sign en cada llamada al WSFEv1

#### Flujo de emisión de factura (WSFEv1)

1. Consultar `FECompUltimoAutorizado` para obtener el último número autorizado del punto de venta
2. Incrementar el número en 1
3. Armar el XML con los datos: tipo comprobante, punto venta, número, fecha, concepto, tipo doc receptor, nro doc receptor, importe total, importe neto, importe IVA, etc.
4. Llamar `FECAESolicitar` con el XML
5. ARCA devuelve: CAE (14 dígitos) + fecha vencimiento CAE
6. Guardar CAE + vencimiento en la entidad Invoice

#### Datos de env vars necesarios

```
ARCA_CUIT=20-12345678-9
ARCA_POINT_OF_SALE=1
ARCA_CERT_PATH=./certs/afip.crt
ARCA_KEY_PATH=./certs/afip.key
ARCA_ENVIRONMENT=homologacion|produccion
```

#### Archivos a modificar en `src/billing/providers/arca.provider.ts`

- Inyectar `soap` client para WSAA y WSFEv1
- Implementar `getToken()` — genera TRA, firma, obtiene TA
- Implementar `issueInvoice()` — llama FECompUltimoAutorizado + FECAESolicitar
- Implementar `getLastInvoiceNumber()` — consulta último comprobante autorizado
- Manejar errores de AFIP (errores array en la respuesta SOAP)
- Cachear el TA (token+sign) hasta que expire para no autenticar en cada request

#### Testing

- **Unit test:** Mock del SOAP client, testear parsing de respuestas
- **E2E:** Testear contra el WS de **homologación** con certificados de prueba
- **Producción:** Requiere certificados de producción y punto de venta autorizado

---

### MercadoPago — Integración completa

El módulo `payments/` tiene la interfaz y providers listos. El `MercadoPagoProvider` actual tiene la estructura pero la integración puede mejorarse. Para completar:

#### Requisitos previos (MercadoPago)

1. **Cuenta de MercadoPago** — business account
2. **Access Token** — se obtiene desde MercadoPago Developers → Your Integrations → Credentials
3. **Public Key** — para el frontend (checkout)
4. **Webhook URL** — endpoint público HTTPS donde MercadoPago envía notificaciones

#### Dependencias

```bash
pnpm add mercadopago
```

#### Funcionalidades a implementar/completar

1. **Creación de preferencia de pago:**
   - `POST /v1/checkout/preferences` con items, payer, back_urls, notification_url
   - Devolver `checkoutUrl` al frontend para redirigir al usuario
   - Guardar `preferenceId` en metadata del Payment

2. **Webhook handler (ya existe la ruta):**
   - Recibir notificaciones de tipo `payment`
   - Consultar `GET /v1/payments/{id}` para obtener estado real
   - Actualizar Payment.status según respuesta
   - Manejar estados: approved → APPROVED, rejected → REJECTED, refunded → REFUNDED, cancelled → CANCELLED
   - Verificar firma del webhook (opcional pero recomendado)

3. **Consulta de estado:**
   - `GET /v1/payments/{id}` — para verificar estado de un pago puntual
   - Usado por `getPaymentStatus()` en la interfaz

4. **Reembolsos (opcional):**
   - `POST /v1/payments/{id}/refunds` — para reembolsos parciales o totales
   - Crear endpoint `POST /payments/:id/refund`

#### Env vars

```
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxx
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxx
MERCADOPAGO_WEBHOOK_SECRET=xxxx (opcional, para verificar firma)
```

#### Archivos a modificar

- `src/payments/providers/mercadopago.provider.ts` — completar implementación real con SDK
- `src/payments/payments.service.ts` — agregar flujo de preferencia de checkout
- `src/payments/payments.controller.ts` — agregar endpoint de webhook (ya existe como `PaymentsWebhookController`)

#### Testing

- **Unit test:** Mock del SDK de MercadoPago, testear parsing de webhooks
- **E2E:** Testear contra sandbox de MercadoPago con credenciales de prueba
- **Producción:** Requiere credenciales de producción y webhook URL con HTTPS
