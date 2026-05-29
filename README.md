# Tech Service API

Backend API para la administración de servicios tecnológicos — reparación de PC,
notebooks, TVs, instalación de cámaras de seguridad, servicios de electricidad, y más.

## Stack

- **Runtime:** Node.js 18+
- **Framework:** NestJS 11
- **Lenguaje:** TypeScript 5

## Requisitos

- Node.js >= 18
- npm

## Instalación

```bash
npm install
npm run setup:git
Scripts
Comando
npm run build
npm run start
npm run start:dev
npm run lint
npm run test
npm run test:e2e
Flujo de trabajo
GitHub flow con protección de rama main:
git feature mi-cambio     # crear rama
# codificar y commitear
git pr                    # push + crear PR
# mergear desde GitHub
git sync                  # actualizar main + limpiar ramas
Ver scripts/git-setup.sh para más aliases.
Estructura
src/
├── main.ts               # Entry point
├── app.module.ts         # Módulo raíz
├── app.controller.ts     # Controlador principal
└── app.service.ts        # Servicio principal
Licencia
MIT
```
