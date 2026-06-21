# TODO — Backend NestJS Tech Service

## Estado actual

- NestJS 11, TypeORM, PostgreSQL 16
- 16 módulos implementados con tests
- 270+ tests unitarios, 11 e2e, 2 acceptance
- JWT auth con roles (admin, technician)
- WebSocket (Socket.IO) para notificaciones in-app
- EventEmitter2 para desacoplamiento de eventos

## PRs Abiertos (pendientes de merge)

| #   | Título                      | Branch                          | Estado |
| --- | --------------------------- | ------------------------------- | ------ |
| 41  | workOrder relation en pagos | fix/payments-workorder-relation | Open   |

## Próxima Feature: Pending Items + Inquiries

### Módulo: pending-items

- [ ] Instalar @nestjs/schedule
- [ ] Crear módulo pending-items:
  - [ ] Entity PendingItem (title, description, dueDate, type, priority, status, referenceType, referenceId, assignedToId, createdById, completedAt)
  - [ ] Enums: PendingItemType, PendingItemPriority, PendingItemStatus
  - [ ] DTOs: CreatePendingItemDto, UpdatePendingItemDto, FilterPendingItemDto
  - [ ] Service: CRUD + validación por rol (technician solo referenceType=work_order y asignado)
  - [ ] Controller: endpoints REST con guards
  - [ ] Cron job diario (8:00 AM): buscar pendientes con dueDate <= mañana, crear notificaciones
- [ ] Nuevos tipos de notificación: pending_item.created, pending_item.due_today, pending_item.overdue
- [ ] Tests unitarios

### Módulo: inquiries

- [ ] Crear módulo inquiries:
  - [ ] Entity Inquiry (clientName, clientPhone, clientEmail, clientAddress, description, source, status, priority, assignedToId, createdById, technicianNotes, estimatedCost, estimatedDuration, materialsNeeded, recommendation, adminDecision, adminNotes, workOrderId, contactedAt, reviewedAt)
  - [ ] Enums: InquirySource, InquiryStatus, InquiryRecommendation, InquiryDecision
  - [ ] DTOs: CreateInquiryDto, UpdateInquiryDto, FilterInquiryDto, ContactInquiryDto
  - [ ] Service: CRUD + workflow de estados + lógica de convert (crear Work Order con datos de la inquiry)
  - [ ] Controller: endpoints REST con guards
- [ ] Nuevos tipos de notificación: inquiry.created, inquiry.assigned, inquiry.contacted, inquiry.reviewed
- [ ] Tests unitarios

## Documentación por actualizar

- [ ] README.md:
  - [ ] TypeScript version "5" → "6"
  - [ ] Fix testing section (agregar test:unit, test:e2e, test:acceptance, test:all, test:unit:cov)
  - [ ] Agregar env vars section completa
  - [ ] Documentar pnpm seed
  - [ ] Documentar test DB setup (.env.test, techservice_test)
- [ ] ROADMAP.md:
  - [ ] Angular version "21+" → "22"
  - [ ] Agregar FilterUserDto a users section
  - [ ] Agregar DELETE /users/:id/hard
  - [ ] Agregar GET /payments global
  - [ ] Documentar login response (incluye user data)
  - [ ] Actualizar seeds section
  - [ ] Fix entities diagram (Alert → Notification, Invoice + paymentId)
  - [ ] Facturación: "planificado" → "implementado (stub + PDFs)"
  - [ ] Clarificar MercadoPago (SDK ya instalado, funcional)
  - [ ] Agregar secciones pending-items e inquiries
- [ ] AGENTS.md:
  - [ ] Angular version "21+" → "22"
  - [ ] Checkmarks a módulos 1-8
  - [ ] Agregar FilterUserDto
  - [ ] Agregar global payments
  - [ ] Fix MercadoPago SDK name (@mercadopago/sdk-node → mercadopago)
  - [ ] Documentar login response y seeds
