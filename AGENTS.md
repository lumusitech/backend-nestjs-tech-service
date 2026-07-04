# AGENTS.md — Tech Service API

## Proyecto

Backend API para la gestión de servicios tecnológicos (reparaciones, instalación de cámaras, electricidad, etc.).

- **Stack principal:** NestJS 11, TypeORM, PostgreSQL, TypeScript 6
- **Runtime:** Node.js >= 18
- **Gestor de paquetes:** pnpm (exclusivamente)
- **Frontend asociado:** `frontend-angular-tech-service` (Angular 21+) y futura app nativa Android (Jetpack Compose). Este repositorio es estrictamente el backend.

---

## Comportamiento del Agente

- **Claridad ante todo:** Si una petición no está clara o falta información, hacer preguntas concretas antes de ejecutar. No asumir requisitos implícitos.
- **Acción directa:** Las tareas simples y bien definidas se ejecutan directamente.
- **Validación de cambios complejos:** Refactors, nuevas features o decisiones de arquitectura requieren confirmar entendimiento antes de actuar.
- **Documentación continua:** Si se introduce una nueva restricción ("nunca X", "siempre Y"), documentarla en este archivo.

---

## Referencia principal

Leer `ROADMAP.md` para la estructura completa, checklist detallada, entidades, relaciones y orden de implementación.

---

## Arquitectura

Arquitectura modular estándar de NestJS. Cada módulo encapsula su propio controller, service, entity y DTOs. **No usar arquitectura hexagonal.**

---

## Principios de Código

- **DRY** — No repetirse. Si algo se repite 2+ veces, extraer a función, servicio o helper.
- **KISS** — Soluciones simples primero. Sin over-engineering.
- **SoC (Separation of Concerns)** — Cada módulo hace una cosa. Controllers manejan HTTP, services manejan lógica, entities manejan datos.
- **Clean Code** — Nombres descriptivos, funciones pequeñas, una sola responsabilidad por función.
- **Entity pattern** — Todas las entities heredan de `BaseEntity` (id, createdAt, updatedAt, deletedAt) para soporte de soft delete.
- **DTO pattern** — DTOs separados para create, update, filter y response.
- **Strategy pattern** — Para pagos (PaymentProvider) y facturación (BillingProvider), permitiendo agregar más implementaciones sin tocar el core de negocio.

---

## Reglas de TypeScript

- **Inferencia:** Preferir la inferencia de tipos siempre que sea posible.
- **Tipado estricto:** Prohibido el uso de `any` o `unknown` salvo justificación extrema. Usar interfaces y DTOs para contratos.
- **Validación:** Uso estricto de `class-validator` y `class-transformer` para todos los inputs (ValidationPipe global con `whitelist: true` y `forbidNonWhitelisted: true`).
- **Claridad:** Si los tipos no están claros, parar y aclarar antes de continuar.

---

## Convenciones NestJS

| Tipo | Convención |
|---|---|
| Modules | `nombre.module.ts` |
| Controllers | `nombre.controller.ts` |
| Services | `nombre.service.ts` |
| Entities | `entities/nombre.entity.ts` |
| DTOs | `dto/create-nombre.dto.ts`, `dto/update-nombre.dto.ts`, `dto/filter-nombre.dto.ts` |
| Enums | `enums/nombre.enum.ts` |
| Guards | `guards/nombre.guard.ts` |
| Decorators | `decorators/nombre.decorator.ts` |
| Strategies | `strategies/nombre.strategy.ts` |

---

## Stack y Dependencias

### Core
- **ORM:** TypeORM con PostgreSQL (`synchronize: false` en producción, `autoLoadEntities: true`)
- **Auth:** JWT + passport (`passport-jwt`)
- **Hashing:** bcrypt
- **Validación:** `class-validator` + `class-transformer`
- **Config:** `@nestjs/config` + Joi (`envValidationSchema` en `src/common/config/env.validation.ts`)

### Infraestructura
- **Rate limiting:** `@nestjs/throttler` — 3 tiers (short: 10req/1s, medium: 50req/10s, long: 200req/60s). Aplicado globalmente como `APP_GUARD`.
- **Cron jobs:** `@nestjs/schedule` — usado en `pending-items` para notificar pendientes a las 8 AM.
- **Health checks:** `@nestjs/terminus` — endpoint `GET /api/health`.
- **Seguridad HTTP:** `helmet` (headers de seguridad).
- **WebSockets:** `@nestjs/websockets` + `@nestjs/platform-socket.io` + `socket.io` — notificaciones real-time push al frontend.
- **Eventos internos:** `@nestjs/event-emitter` (EventEmitter2) — desacoplamiento entre servicios y listeners de notificaciones.
- **Push browser:** `web-push` — notificaciones push al navegador (VAPID keys en `.env`).

### Negocio
- **Pagos:** `mercadopago` SDK
- **PDFs:** `pdfkit` — generación de presupuestos, comprobantes y facturas desde el backend.
- **Swagger:** `@nestjs/swagger` — documentación OpenAPI en `/api/docs`, spec JSON en `/api/docs-json`.

---

## Módulos

### Orden de implementación (completado)

1. ✅ `common` — BaseEntity, DTOs de paginación, filtros globales, interceptors, enums, testing helpers
2. ✅ `auth` + `users` — JWT, roles (admin, technician), guards, decorators (@Roles, @CurrentUser, @Public)
3. ✅ `clients` — CRUD de clientes (con internetProvider, internetPlan, cuit, ivaCondition)
4. ✅ `suppliers` — CRUD de proveedores de repuestos/materiales
5. ✅ `service-types` — Catálogo de servicios (reparación, instalación, etc.)
6. ✅ `work-orders` — CORE del sistema (trackingCode, notes, materials, tasks, payments, invoices)
7. ✅ `tasks` — Subtareas dentro de una work order
8. ✅ `payments` — Pagos (MercadoPago, efectivo, transferencia — strategy pattern)
9. ✅ `finances` — Gastos operativos generales
10. ✅ `notifications` — Notificaciones in-app (WebSocket + EventEmitter2)
11. ✅ `billing` — Facturación ARCA/AFIP (stub + PDFs, interfaz lista para WSFEv1)
12. ✅ `reports` — Reportes financieros y estadísticas (BFF + PDFs con pdfkit)
13. ✅ `portal` — Portal público sin auth, tracking por código/QR
14. ✅ `database` — Seeds, migraciones TypeORM, `db:reset`
15. ✅ `testing` — Unit tests (315+), e2e (252+), acceptance tests
16. ✅ `swagger` — Documentación OpenAPI + CORS + prefijo `/api/`
17. ✅ `pending-items` — CRUD + cron job diario + notificaciones
18. ✅ `inquiries` — CRUD + workflow de estados + convert a Work Order

### Módulos adicionales completados

| Módulo | Descripción |
|---|---|
| `user-preferences` | Preferencias de usuario (theme, language, dashboardLayout) |
| `business-settings` | Configuración del negocio (name, address, phone, email — para PDFs) |
| `skills` | Catálogo de habilidades/competencias de técnicos |
| `push-notifications` | Notificaciones push al navegador (web-push + VAPID + gestión de suscripciones) |
| `health` | Health check endpoint (`@nestjs/terminus`) |

---

## Roles

- **admin** — Acceso total, crea usuarios (technicians y otros admins).
- **technician** — Solo sus órdenes asignadas y tareas propias.
- **client** — Portal público sin login, acceso por tracking code / QR.

---

## Decisiones Clave del Dominio

| Decisión | Elección | Razón |
|---|---|---|
| QR | Frontend genera el QR | Backend solo provee la URL de tracking |
| Calendario | Fechas en work orders | No se necesita módulo aparte |
| Contactos | clients + suppliers + users | Ya están cubiertos, no duplicar |
| Alertas | Solo in-app | Sin email/SMS por ahora |
| Notificaciones | Socket.IO push real-time + EventEmitter2 | Desacoplamiento interno, push instantáneo al frontend |
| Pagos | Strategy pattern (MercadoPago, efectivo, transferencia) | Extensible a más providers sin tocar el core |
| Billing ARCA | Interfaz + entidades + flujo admin + PDFs + stub | Stub listo para conectar WSFEv1 real |
| Tracking code | Formato `TS-XXXXX` (ej: `TS-A1B2C3`) | Autogenerado al crear la work order |
| Reportes | BFF pattern (backend computa todo) | Integridad de datos, frontend solo renderiza |
| PDFs | pdfkit desde el backend | Evita manipulación de datos sensibles, listo para envío por email |
| Técnicos | ManyToMany con WorkOrder | Múltiples técnicos pueden trabajar en una misma orden |
| Soft delete | Global (BaseEntity + DeleteDateColumn) | Nada se borra físicamente por defecto |
| warrantyStatus | Derivado de `warrantyUntil` vs fecha actual | No se almacena en DB, se calcula al vuelo |
| API prefix | `/api/` en todas las rutas | Ej: `/api/clients`, `/api/work-orders` |
| CORS | `CORS_ORIGINS` env var (comma-separated) | Por defecto `http://localhost:4200` (Angular dev server) |

---

## Infraestructura Transversal

### Rate Limiting
`@nestjs/throttler` aplicado globalmente como `APP_GUARD` con 3 tiers configurables. Protege contra abuso de endpoints públicos y autenticados.

### Cron Jobs
`@nestjs/schedule` ejecuta tareas programadas. Actualmente usado para:
- Notificar `pending-items` con dueDate <= mañana (diario a las 8:00 AM)

### Health Check
`@nestjs/terminus` expone `GET /api/health` para monitoreo de infraestructura (Kubernetes, balanceadores, etc.).

### Seguridad
- `helmet` aplica headers de seguridad HTTP estándar.
- `ValidationPipe` global con `whitelist: true` + `forbidNonWhitelisted: true` rechaza propiedades no declaradas en DTOs.
- `JwtAuthGuard` global (con `@Public()` para rutas sin auth).

### Base de Datos
- `synchronize: false` en producción — solo migraciones.
- Conexión con reintentos: 10 intentos, 3s de delay entre cada uno.
- `autoLoadEntities: true` evita registro manual de entities.

### Graceful Shutdown
`app.enableShutdownHooks()` para cierre ordenado de conexiones (DB, WebSocket, etc.).

### Dependabot
`.github/dependabot.yml` configurado para actualización automática de dependencias.

### Scripts auxiliares
- `scripts/git-setup.sh` — configuración inicial de git hooks.
- `scripts/init-unaccent.sh` — habilita extensión `unaccent` en PostgreSQL (búsqueda accent-insensitive).

---

## Integraciones Pendientes

### ARCA/AFIP (facturación electrónica — WSFEv1)

El módulo `billing/` tiene la interfaz, entidades, flujo admin y PDFs listos. `ArcaProvider` actual es un **stub**.

**Requisitos previos (AFIP):**
1. CUIT del negocio habilitado con actividad "Servicios de reparación"
2. Certificado digital (.crt) desde AFIP → Administrador de Relaciones → Certificados
3. Clave privada (.key) generada junto al certificado
4. Punto de venta autorizado (ej: 0001)
5. WSAA habilitado para WSFEv1 en Administrador de Relaciones de Clave Fiscal

**Dependencias a instalar:**
```bash
pnpm add soap node-forge
pnpm add -D @types/soap
```

**Flujo WSAA (autenticación):**
1. Generar TRA (Ticket de Request de Acceso) especificando servicio `wsfe` y validez 24h
2. Firmar TRA con certificado .crt + clave privada .key (PKCS7)
3. Enviar a WSAA → recibir TA (Ticket de Acceso) con token + sign (~24h de validez)
4. Cachear TA hasta su expiración

**Flujo WSFEv1 (emisión):**
1. `FECompUltimoAutorizado` → obtener último número autorizado del punto de venta
2. Incrementar número, armar XML con datos del comprobante
3. `FECAESolicitar` → ARCA devuelve CAE (14 dígitos) + fecha de vencimiento
4. Guardar CAE + vencimiento en entidad `Invoice`

**Env vars requeridas:**
```
ARCA_CERT_PATH=./certs/afip.crt
ARCA_KEY_PATH=./certs/afip.key
ARCA_ENVIRONMENT=homologacion|produccion
```

**Archivo a modificar:** `src/billing/providers/arca.provider.ts`

---

### MercadoPago (pagos — completar SDK)

El módulo `payments/` tiene la interfaz y estructura de providers. El SDK ya está instalado.

**Requisitos previos (MercadoPago):**
1. Cuenta business en MercadoPago
2. Access Token desde MercadoPago Developers → Credentials
3. Public Key para el frontend (checkout)
4. Webhook URL pública con HTTPS

**Funcionalidades a completar:**
1. Crear preferencia de checkout (`POST /v1/checkout/preferences`)
2. Manejar webhook con verificación de firma (`MERCADOPAGO_WEBHOOK_SECRET`)
3. Consultar estado de pago (`GET /v1/payments/{id}`)
4. Reembolsos parciales/totales (opcional)

**Env vars requeridas:**
```
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxx
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxx
MERCADOPAGO_WEBHOOK_SECRET=xxxx
```

**Archivos a modificar:**
- `src/payments/providers/mercadopago.provider.ts`
- `src/payments/payments.service.ts`
- `src/payments/payments.controller.ts`

---

## Lo que NO hacer

- No crear módulos innecesarios (contactos, calendario, alertas) — ya están cubiertos en sus respectivos flujos.
- No exponer datos sensibles en el portal público (costos, notas internas, proveedores, datos PII del cliente).
- No exponer datos de técnicos asignados ni suppliers en respuestas del portal.
- No usar `any` o `unknown` sin justificación explícita.
- No hardcodear secrets — todo por `ConfigModule` (`.env`).
- No hacer `synchronize: true` en producción — solo migraciones.
- No commitear secrets ni archivos `.env`.
- No añadir dependencias de infraestructura innecesarias — depender de abstracciones, no de herramientas concretas.

---

## Commits y Pull Requests

**REGLA OBLIGATORIA: Nunca commitear a `main`. Todo cambio pasa por PR.**

### Proceso
1. Crear un branch descriptivo desde `main`: `feat/nombre-feature`, `fix/nombre-fix`, `docs/que-se-actualizo`
2. Commits con mensajes descriptivos y atómicos
3. Push al branch
4. Crear PR con `gh pr create` — título claro y descripción de qué cambió, por qué y cómo se verificó
5. PRs pequeños y enfocados. Si el branch ya tiene PR abierta, los nuevos commits se agregan automáticamente

### Aprobación y merge
- El merge lo hace el owner del repo desde GitHub Web usando **Squash and Merge** — no mergear localmente.
- Nunca hacer merge ni push directo a `main`. Solo PRs aprobadas via GitHub Web.

### Checklist pre-PR
Ejecutar siempre antes de abrir un PR:
```bash
pnpm lint
pnpm test:unit
```

---

## Testing

### Comandos

```bash
pnpm test              # Unit tests (sin DB, rápido)
pnpm test:unit         # Unit tests (mismo que pnpm test)
pnpm test:unit:cov     # Unit tests con coverage
pnpm test:e2e          # E2E tests (requiere PostgreSQL con techservice_test)
pnpm test:acceptance   # Acceptance tests (flujos completos de negocio)
pnpm test:all          # Unit + E2E
pnpm test -- -t "nombre"  # Ejecutar un test específico
```

### Stack de testing
- **Framework:** Jest (incluido en NestJS)
- **E2E:** Jest + Supertest (HTTP contra app levantada)
- **Coverage:** Jest coverage reports en `coverage/`
- **DB de test:** Base de datos separada `techservice_test` (definida en `.env.test`)

### Infraestructura de testing
- `test/helpers/app.helper.ts` — `createTestApp()` bootstrap de NestJS para e2e
- `test/helpers/auth.helper.ts` — `loginAsAdmin()`, `loginAsTechnician()`, `authHeader()`
- `test/helpers/seed.helper.ts` — `seedTestData()` con migraciones + datos base
- `src/common/testing/mock-query-builder.helper.ts` — `createMockRepository()`, `createMockQueryBuilder()` reutilizables para unit tests

### Reglas de testing
- No se acepta código con errores de tipos, lint o tests fallidos.
- Añadir o actualizar tests al cambiar comportamiento, aunque no se pida explícitamente.
- Cobertura no es un fin en sí mismo, pero los tests deben cubrir los casos de uso principales y edge cases.

---

## Solución a Problemas de Lockfile (pnpm)

Cuando `pnpm i` falla con errores como:
- `Broken lockfile: no entry for ...`
- `Lockfile failed supply-chain policy check`
- `ERR_PNPM_LOCKFILE_MISSING_DEPENDENCY`
- `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`

**Solución:**
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm i
```

**Causa:** El lockfile queda desincronizado cuando dependencias se actualizan parcialmente (dependabot, merge manual de `package.json` sin lockfile, o installs parciales).

**Prevención:** Siempre hacer `pnpm i` completo después de pull. **Nunca editar `pnpm-lock.yaml` manualmente.**

---

## Endpoints Notables

| Endpoint | Auth | Descripción |
|---|---|---|
| `GET /api/health` | No | Health check (@nestjs/terminus) |
| `GET /api/docs` | No | Swagger UI interactiva |
| `GET /api/docs-json` | No | Spec OpenAPI JSON (para codegen frontend) |
| `POST /api/auth/login` | No | Login — devuelve JWT |
| `GET /api/portal/track/:code` | No | Portal público — tracking por código |
| `POST /api/payments/mercadopago/webhook` | No | Webhook de MercadoPago |
| Resto de endpoints | Sí (JWT) | Roles: admin (total), technician (solo sus órdenes) |
