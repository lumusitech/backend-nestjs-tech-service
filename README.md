# Tech Service API

Backend API para la administración de servicios tecnológicos — reparación de PC,
notebooks, TVs, instalación de cámaras de seguridad, servicios de electricidad, y más.

---

## 🚀 Stack

- **Runtime:** Node.js 18+
- **Framework:** NestJS 11
- **Lenguaje:** TypeScript 5
- **Base de datos:** PostgreSQL 16 (Docker)
- **ORM:** TypeORM
- **Infra:** Docker Compose

---

## 📋 Requisitos

- Node.js >= 18
- pnpm
- Docker + Docker Compose

---

## 🧭 Arquitectura del proyecto

El proyecto sigue una arquitectura modular basada en NestJS.

### Estructura objetivo

Ver [ROADMAP.md](ROADMAP.md) para la estructura completa planificada.

### Estado actual

La implementación es incremental por módulos según el roadmap.

---

## ⚙️ Configuración inicial

### 1. Clonar repositorio

```bash
git clone <repo-url>
cd tech-service-api
```

### 2. Crear archivo de entorno

```bash
cp .env.template .env
```

Editar .env:

```text
NODE_ENV=development
DB_LOGGING=false

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=admin
DB_PASSWORD=postgres
DB_NAME=techservice

PGADMIN_EMAIL=admin@techservice.dev
PGADMIN_PASSWORD=admin123
PGADMIN_PORT=8080
```

### 3. Levantar infraestructura (PostgreSQL + pgAdmin)

```bash
docker compose up -d
```

Verificar estado:

```bash
docker compose ps
```

📌 Accesos:

- PostgreSQL: localhost:5432
- pgAdmin: [http://localhost:8080](http://localhost:8080)

### 4. Instalar dependencias

```bash
pnpm install
```

---

## 🧠 Base de datos y migraciones (MUY IMPORTANTE)

Este proyecto NO usa synchronize en producción, en su lugar usa migraciones versionadas.

🔹 ¿Por qué?

- Evita pérdida de datos
- Permite trabajo en equipo
- Versiona cambios en la DB
- Compatible con CI/CD

---

## 📦 Comandos de base de datos

### Generar migración

```bash
pnpm migration:generate
```

👉 Se usa cuando

- Creás/modificás entities
- Querés persistir cambios en el schema

### Ejecutar migraciones

```bash
pnpm migration:run
```

👉 Se usa cuando:

- Clonás el proyecto
- Cambias de rama
- Hay nuevas migraciones

### Revertir migración

```bash
pnpm migration:revert
```

👉 Útil para:

- Debug
- Testeo
- Rollbacks

---

## ✅ Flujo correcto de trabajo con DB

### Caso 1 — Primera vez

```bash
docker compose up -d
pnpm install
pnpm migration:run
pnpm start:dev
```

### Caso 2 — Desarrollo normal

1. Editás entities
2. Generás migración:

```bash
pnpm migration:generate
```

1. Aplicás cambios:

```bash
pnpm migration:run
```

### ⚠️ Importante

- ❌ NO modificar la DB manualmente
- ❌ NO usar synchronize en equipo
- ✅ TODO cambio debe ir en migraciones

---

### ▶️ Ejecutar la app

```bash
pnpm start:dev
```

### 🧪 Testing

```bash
pnpm lint
```

### 🧹 Lint

```bash
pnpm lint
```

---

## 🧭 Flujo de trabajo (Git) - Opcional, se puede usar git nativo sin scripts

```bash

git feature mi-cambio
# desarrollar
git pr
git sync
```

Ver scripts/git-setup.sh para aliases.

---

## 📌 Notas importantes

- Docker levanta PostgreSQL con volumen persistente
- pgAdmin se usa para inspección de datos
- El backend corre fuera de Docker (por ahora)
- En el futuro se integrará:
  - Redis
  - MinIO
  - NestJS en contenedor

---

## 📄 Licencia

MIT
