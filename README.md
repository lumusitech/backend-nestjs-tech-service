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

### 4. Instalar extensión unaccent (OBLIGATORIO para búsqueda)

**Problema:** los filtros de búsqueda por texto usan `unaccent()` de PostgreSQL para buscar
ignorando tildes y caracteres especiales (acentos, `ñ`, diéresis). Si la extensión no está
habilitada en la base, **cualquier búsqueda en un filtro de texto devuelve error 500**
(`function unaccent(character varying) does not exist`).

**Solución:** habilitar la extensión una vez por base de datos:

```bash
docker exec -i techservice-postgres psql -U admin -d techservice \
  -c "CREATE EXTENSION IF NOT EXISTS unaccent;"
```

> 💡 Docker Compose ya monta `scripts/init-unaccent.sh` en `docker-entrypoint-initdb.d`, así
> que en una base **recién creada** la extensión se habilita sola. El comando de arriba es la
> vía manual, útil cuando el volumen de Postgres ya existía o la DB se recreó sin el init.

### 5. Instalar dependencias

```bash
pnpm install
```

### ⚠️ Si `pnpm install` falla con errores de lockfile

Si ves errores como:
- `Broken lockfile: no entry for ...`
- `ERR_PNPM_LOCKFILE_MISSING_DEPENDENCY`
- `Lockfile failed supply-chain policy check`

**Solución:**

```bash
pnpm clean --lockfile   # Elimina lockfile y node_modules
pnpm install            # Regenera desde cero
```

**¿Por qué pasa?** El lockfile queda desincronizado cuando dependencias se actualizan parcialmente (merges, dependabot, installs interrumpidos). No es un error del código — es un problema de resolución de paquetes.

**Prevención:** No editar `pnpm-lock.yaml` manualmente. Siempre hacer `pnpm install` completo después de pull.

### ⚠️ Si `pnpm` no arranca: `Failed to parse pnpm-workspace.yaml`

**Problema:** pnpm 11+ reemplazó `onlyBuiltDependencies` (una lista) por `allowBuilds` (un mapa
`paquete: true|false`). Si el archivo conserva el bloque legacy en formato de mapa, pnpm no puede
parsear la configuración y **falla cualquier comando, incluso `pnpm -v`**.

**Solución:** dejar solo el formato actual:

```yaml
allowBuilds:
  '@scarf/scarf': false
  bcrypt: true
  unrs-resolver: true
minimumReleaseAgeExclude:
  - '@types/node@26.1.0'
```

En pnpm 11+ las claves `onlyBuiltDependencies`, `onlyBuiltDependenciesFile`,
`neverBuiltDependencies` e `ignoredBuiltDependencies` dejaron de usarse: migrá esas decisiones de
build a `allowBuilds`.

### ⚠️ Si `pnpm install` falla con `ERR_PNPM_EXECUTOR_LIFECYCLE_SCRIPT_FAILED` (`cross-env: not found`)

**Problema:** el `preinstall` del proyecto invoca `cross-env` (una `devDependency`) **antes** de
que se instalen las dependencias. En una copia limpia (sin `node_modules`) el binario todavía no
existe y el install aborta con exit status 127.

**Solución:** bootstrapear sin scripts y luego correr el install normal (que ya resuelve
`cross-env` y ejecuta los build scripts permitidos, p. ej. `bcrypt`):

```bash
pnpm install --ignore-scripts
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
docker exec -i techservice-postgres psql -U admin -d techservice \
  -c "CREATE EXTENSION IF NOT EXISTS unaccent;"
pnpm migration:run
pnpm db:reset       # Seeds datos iniciales (admin, técnicos, etc.)
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
pnpm test:unit          # Unit tests (sin DB)
pnpm test:e2e           # E2E tests (requiere PostgreSQL)
pnpm test:acceptance    # Acceptance tests
pnpm test:all           # Todos
pnpm test:unit:cov      # Coverage
```

### 🧹 Lint

```bash
pnpm lint
```

### 🗑️ Reset de base de datos

```bash
pnpm db:reset           # Truncatea todo y re-seedea
```

### 🌱 Seed manual

```bash
pnpm seed               # Ejecuta seeds (idempotente)
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
