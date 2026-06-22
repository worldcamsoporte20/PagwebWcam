# Seguridad base

## Regla principal

Odoo no debe exponerse publicamente. La ruta correcta es:

Internet -> Next.js -> NestJS -> red privada/VPN -> Odoo 19

## Controles iniciales

- Cloudflare con SSL/TLS, WAF y proteccion anti-bots.
- JWT de corta duracion y refresh tokens rotables.
- Argon2 para passwords propios si se agregan usuarios fuera de Odoo.
- Rate limiting en NestJS con `@nestjs/throttler`.
- Redis para sesiones, catalogo, stock y precios.
- Tokens separados para comunicacion NestJS -> Odoo.
- Variables sensibles solo en `.env`, secretos del VPS o gestor de secretos.

## Siguiente endurecimiento recomendado

- RBAC por rol: `b2c_customer`, `b2b_customer`, `seller`, `cashier`, `admin`.
- Auditoria de pedidos, cotizaciones, cambios de precio y sesiones de caja.
- Webhooks firmados para eventos de Odoo.
- Allowlist de IP o VPN entre NestJS y Odoo.
- Logs estructurados y metricas para Grafana/Prometheus.
