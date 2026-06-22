# Arquitectura headless Odoo

## Objetivo

Construir una plataforma B2B/B2C con caja rapida, multiples sucursales y Odoo 19 como ERP central, sin conectar el frontend directamente al ERP.

## Capas

1. `apps/web`: Next.js, TypeScript y TailwindCSS.
2. `apps/api`: NestJS como API Gateway y backend principal.
3. PostgreSQL: base operacional propia para datos que no deben vivir en frontend.
4. Redis: cache, sesiones y aceleracion de consultas frecuentes.
5. Odoo 19: ERP privado para inventario, facturacion, clientes, pedidos y contabilidad.

## Flujo B2C

Cliente -> Next.js -> NestJS -> Redis -> Odoo cuando haga falta

## Flujo B2B

Cliente empresa -> JWT/RBAC -> NestJS -> reglas comerciales -> Odoo

Casos previstos:

- precios especiales
- credito
- cotizaciones
- facturas
- estado de cuenta
- pedidos empresariales

## Caja rapida

La caja rapida debe vivir como modulo separado, usando la misma API central:

- lectura de codigo de barras
- WebSockets para stock y tickets
- impresion termica
- modo Electron opcional para escritorio
- sincronizacion por sucursal

## Primeros endpoints incluidos

- `GET /api/health`
- `GET /api/catalog/products`
- `POST /api/auth/login`

## Integracion Odoo

`apps/api/src/odoo/odoo.service.ts` contiene el punto unico para hablar con Odoo. Por ahora devuelve datos demo cuando `ODOO_URL` esta vacio. Cuando exista el endpoint real de Odoo, basta configurar:

```env
ODOO_URL=https://odoo.tudominio.com
ODOO_API_TOKEN=token-privado
```

Despues se puede reemplazar el endpoint demo por JSON-RPC, XML-RPC o endpoints custom en Odoo.
