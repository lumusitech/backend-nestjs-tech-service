# TODO — Backend NestJS Tech Service

## Estado actual

- NestJS 11, TypeORM, PostgreSQL 16, TypeScript 6
- 18 módulos implementados con tests
- 315 tests unitarios, 252 e2e (16 suites), 2 acceptance
- JWT auth global (JwtAuthGuard) con roles (admin, technician)
- WebSocket (Socket.IO) para notificaciones in-app
- EventEmitter2 para desacoplamiento de eventos
- pnpm como gestor de paquetes
- db:reset para resetear la DB al estado seed
- Búsqueda sin tildes (unaccent) en clients, work-orders y billing

## PRs Abiertos (pendientes de merge)

Ninguno — todos los PRs mergeados.

## Módulos completados

1. ✅ common — BaseEntity, DTOs, filtros globales
2. ✅ auth + users — JWT, roles, guards, login
3. ✅ clients — CRUD + búsqueda con unaccent
4. ✅ suppliers — CRUD
5. ✅ service-types — catálogo
6. ✅ work-orders — core (trackingCode, notes, materials, tasks, payments, technicians) + búsqueda con unaccent
7. ✅ tasks — subtareas
8. ✅ payments — MercadoPago + tarjetas (strategy pattern)
9. ✅ finances — gastos operativos
10. ✅ notifications — notificaciones in-app (WebSocket + EventEmitter)
11. ✅ billing — facturación ARCA/AFIP (stub + PDFs + búsqueda con unaccent)
12. ✅ reports — reportes financieros (BFF + PDFs)
13. ✅ portal — portal público (sin auth)
14. ✅ database — seeds + migraciones + db:reset
15. ✅ testing — tests unitarios, e2e, acceptance
16. ✅ swagger — documentación OpenAPI
17. ✅ pending-items — CRUD + cron job + notificaciones
18. ✅ inquiries — CRUD + workflow de estados + convert a Work Order

## Documentación actualizada

- [x] README.md — scripts, testing, db:reset, TypeScript 6
- [x] ROADMAP.md — módulos completados, secciones pending-items e inquiries
- [x] AGENTS.md — módulos completados, pnpm
- [x] TODO.md — este archivo

## Próximos pasos (backend)

- Completar integración MercadoPago (SDK parcialmente implementado)
- Conectar ARCA/AFIP real (stub actual)

## Mejoras a futuro

### Seguridad
- [ ] CORS abierto (*) en WebSocket gateway
- [ ] Sin rate limiting (@nestjs/throttler)
- [ ] Sin Helmet para headers de seguridad
- [ ] Sin refresh tokens

### Arquitectura
- [ ] Sin validación de config en ConfigModule (fallas silenciosas en runtime)
- [ ] sortBy en paginación sin whitelist de columnas permitidas
- [ ] no-explicit-any: off en ESLint contradice la convención del proyecto
- [ ] Listener de notificaciones de 379 líneas, podría dividirse por dominio

### Testing
- [ ] Sin threshold mínimo de cobertura
- [ ] Controllers, guards, interceptors y filters sin unit tests

### Operaciones
- [ ] Sin health check endpoint (/health)
- [ ] Sin graceful shutdown (SIGTERM/SIGINT)
- [ ] Sin logging estructurado con requestId/userId
