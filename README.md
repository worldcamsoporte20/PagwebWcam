# Odoo Headless Commerce

Base inicial para una plataforma B2B/B2C con Next.js, NestJS, PostgreSQL, Redis y Odoo 19.

## Estructura

```text
apps/web   Next.js + TypeScript + TailwindCSS
apps/api   NestJS API Gateway + integracion Odoo
infra      notas de seguridad e infraestructura
docs       arquitectura y decisiones
```

## Requisitos

- Node.js 22+
- npm 10+
- Docker Desktop

## Arranque local

```bash
cp .env.example .env
npm install
docker compose up -d
npm run dev:api
npm run dev:web
```

URLs locales:

- Web: http://localhost:3000
- API: http://localhost:4000/api/health
- Catalogo: http://localhost:4000/api/catalog/products

En PowerShell de Windows, si aparece un bloqueo de `npm.ps1`, usa `npm.cmd`:

```powershell
npm.cmd install
npm.cmd run dev:api
npm.cmd run dev:web
```

## Arquitectura recomendada

```text
Next.js
  |
  v
NestJS API Gateway
  |
  +--> Redis
  +--> PostgreSQL
  |
  v
Odoo 19 privado
```

## Siguientes modulos

- RBAC real por usuario y rol.
- Modelo PostgreSQL para sesiones de caja y auditoria.
- WebSockets para sucursales y caja rapida.
- Integracion Odoo custom para productos, stock, precios y pedidos.
- Dockerfiles para desplegar web y API.
- Observabilidad con Prometheus y Grafana.
