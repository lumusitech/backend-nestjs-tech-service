# AGENTS.md — Tech Service

## Proyecto

Backend API para gestión de servicios tecnológicos (reparaciones, instalación de cámaras, electricidad, etc.).
**Stack:** NestJS 11, TypeORM, PostgreSQL, TypeScript
**Frontend (futuro):** Angular 21+ / Android nativo + Jetpack Compose

## Referencia principal

Lee `ROADMAP.md` para la estructura completa, checklist, entidades, relaciones y orden de implementación.

## Arquitectura

Arquitectura modular estándar de NestJS. Cada módulo encapsula su propio controller, service, entity y DTOs. No usar arquitectura hexagonal.

## Principios de código

- **DRY** — No te repitas. Si se repite 2+ veces, extraer a función, servicio o helper.
- **KISS** — Soluciones simples primero. No over-engineering.
- **SoC (Separation of Concerns)** — Cada módulo hace una cosa. Controllers manejan HTTP, services manejan lógica, entities manejan datos.
- **Clean Code** — Nombres descriptivos, funciones pequeñas, una sola responsabilidad por función.
- **Tipado estricto** — Todo tipado. No `any` salvo que sea imposible de evitar. Usar interfaces y DTOs para contracts.
- **Validación** — Todos los inputs se validan con `class-validator` y `class-transformer`.
- **Entity pattern** — Todas las entities heredan de `BaseEntity` (id, createdAt, updatedAt).
- **DTO pattern** — DTOs separados para create, update, filter y response.
- **Strategy pattern** — Para pagos (PaymentProvider) y facturación (BillingProvider), permitir agregar más implementaciones sin tocar el core.

## Convenciones NestJS

- Modules: `nombre.module.ts`
- Controllers: `nombre.controller.ts`
- Services: `nombre.service.ts`
- Entities: `entities/nombre.entity.ts`
- DTOs: `dto/create-nombre.dto.ts`, `dto/update-nombre.dto.ts`, `dto/filter-nombre.dto.ts`
- Enums: `enums/nombre.enum.ts`
- Guards: `guards/nombre.guard.ts`
- Decorators: `decorators/nombre.decorator.ts`
- Strategies: `strategies/nombre.strategy.ts`

## Stack y dependencias

- **Runtime:** Node.js >= 18
- **ORM:** TypeORM (ya configurado con PostgreSQL)
- **Auth:** JWT + passport
- **Validación:** class-validator + class-transformer
- **Pagos:** MercadoPago SDK
- **Hashing:** bcrypt

## Módulos (orden de implementación)

1. common — BaseEntity, DTOs, filtros globales
2. auth + users — JWT, roles (admin, technician), guards
3. clients — CRUD (con internetProvider, internetPlan)
4. suppliers — CRUD proveedores
5. service-types — catálogo de servicios
6. work-orders — CORE (trackingCode, notes, materials, tasks, payments, invoices)
7. tasks — subtareas de work orders
8. payments — MercadoPago (strategy pattern)
9. ✅ finances — gastos operativos
10. ✅ notifications — notificaciones in-app (WebSocket + EventEmitter)
11. ✅ billing — ARCA/AFIP (stub + PDFs, interfaz lista para WSFEv1)
12. ✅ reports — ingresos/gastos/ganancias por período (BFF + PDFs con pdfkit)
13. ✅ portal — público sin auth, tracking por código/QR
14. ✅ database — seeds y migraciones
15. ✅ testing — unit tests (270), e2e, acceptance tests
16. ✅ swagger — documentación OpenAPI + CORS + prefijo /api/

## Roles

- **admin** — acceso total, crea usuarios (technicians, otros admins)
- **technician** — solo sus órdenes asignadas
- **client** — portal público sin login (tracking code / QR)

## Decisiones clave

- QR lo genera el frontend, no el backend
- Calendario = fechas en work orders, no módulo aparte
- Contactos = clients + suppliers + users, no módulo aparte
- Alertas = solo in-app (sin email/SMS)
- Notificaciones = WebSocket (Socket.IO) push real-time + EventEmitter2 para desacoplamiento
- Pagos = strategy pattern para agregar más providers
- Billing ARCA = interfaz + entidades + flujo admin + PDFs listos. Stub listo para conectar WSFEv1
- MercadoPago = interfaz + providers listos. SDK parcialmente implementado
- Tracking code formato: `TS-XXXXX` (ej: `TS-A1B2C3`)
- Reportes = BFF pattern, el backend computa todo, frontend solo renderiza
- PDFs = generados con pdfkit desde el backend para evitar manipulación de datos

## Integraciones pendientes — Qué falta para completar

### ARCA/AFIP (facturación electrónica)
- Obtener CUIT + certificado digital (.crt) + clave privada (.key) desde AFIP
- Habilitar WSFEv1 en AFIP → Administrador de Relaciones
- Instalar: `npm install soap node-forge` + `@types/soap`
- Implementar en `arca.provider.ts`: autenticación WSAA (TRA → TA), llamadas SOAP a WSFEv1
- Env vars: `ARCA_CERT_PATH`, `ARCA_KEY_PATH`, `ARCA_ENVIRONMENT` (homologacion|produccion)
- Flujo: FECompUltimoAutorizado → FECAESolicitar → guardar CAE + vencimiento

### MercadoPago (pagos)
- Obtener Access Token + Public Key desde MercadoPago Developers
- Instalar: `npm install @mercadopago/sdk-node`
- Completar `mercadopago.provider.ts`: crear preferencia de checkout, consultar estado, manejar webhooks
- Agregar endpoint de webhook con verificación de firma
- Env vars: `MERCADOPAGO_PUBLIC_KEY`, `MERCADOPAGO_WEBHOOK_SECRET`
- Flujo: crear preferencia → redirect a checkout → webhook → actualizar estado del pago

## Lo que NO hacer

- No crear módulos innecesarios (contactos, calendario) — ya están cubiertos
- No exponer datos sensibles en el portal público (costos, notas internas, proveedores)
- No usar `any` sin justificación
- No hardcodear secrets — todo por ConfigModule (.env)
- No hacer sync de base de datos en producción
- No commitear secrets ni archivos .env
