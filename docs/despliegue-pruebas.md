# Despliegue de pruebas

Este proyecto ya queda preparado para subir web, API, PostgreSQL y Redis con Docker.

## Opcion gratis temporal con ngrok

Para una prueba rapida sin pagar servidor, deja corriendo la app local y publica el puerto web:

```powershell
$env:NEXT_PUBLIC_API_URL=""
$env:API_INTERNAL_URL="http://localhost:4000"
npm run build -w apps/web
npm run start -w apps/web
ngrok http 3000
```

La app usa `/api` en el mismo dominio publico, asi que solo necesitas exponer el puerto `3000`; Next reenvia internamente las llamadas al API local en `4000`.

Si la pagina abre sin estilos, con imagenes rotas y errores 404 de `.css`, `.js`, `logo.png` o imagenes publicas, significa que el servidor standalone arranco sin sus assets. Vuelve a ejecutar:

```powershell
npm run build -w apps/web
npm run start -w apps/web
```

El script `start` copia automaticamente `public` y `.next/static` dentro de `.next/standalone/apps/web`, que es donde `server.js` los busca.

Mientras el proceso de ngrok y la computadora esten encendidos, el enlace publico funciona para pruebas externas.

## Variables necesarias

Crea un `.env` en el servidor con:

```env
WEB_PORT=3000
API_PORT=4000
WEB_ORIGIN=http://TU_SERVIDOR:3000
NEXT_PUBLIC_API_URL=http://TU_SERVIDOR:4000
JWT_SECRET=CAMBIA_ESTO_POR_UN_SECRETO_LARGO
POSTGRES_DB=worldcam_app
POSTGRES_USER=worldcam_app
POSTGRES_PASSWORD=CAMBIA_ESTA_CONTRASENA
ODOO_URL=https://tu-odoo.odoo.com
ODOO_DB=tu_base_odoo
ODOO_USERNAME=usuario@dominio.com
ODOO_API_KEY=tu_api_key
ODOO_API_TOKEN=
```

## Arranque

```bash
docker compose -f docker-compose.test.yml up -d --build
```

## URLs

- Web: `http://TU_SERVIDOR:3000`
- API: `http://TU_SERVIDOR:4000/api/health`

## Nota

Para publicar con dominio y HTTPS se recomienda poner Nginx o Caddy delante de `web` y `api`.
