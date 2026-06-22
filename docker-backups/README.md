# Docker database backups

Estos respaldos permiten reconstruir las bases PostgreSQL usadas por `docker-compose.yml`.

## Archivos

- `worldcam_app.dump`: base `worldcam_app` del servicio `app-postgres`.
- `commerce.dump`: base `commerce` del servicio `postgres`.
- `redis-dump.rdb`: snapshot Redis del servicio `redis`.

## Restaurar en otra computadora

1. Levanta Docker:

```powershell
docker compose up -d
```

2. Copia los dumps a los contenedores:

```powershell
docker cp docker-backups/worldcam_app.dump worldcam-app-postgres:/tmp/worldcam_app.dump
docker cp docker-backups/commerce.dump commerce-postgres:/tmp/commerce.dump
docker cp docker-backups/redis-dump.rdb commerce-redis:/data/dump.rdb
```

3. Restaura las bases:

```powershell
docker exec worldcam-app-postgres pg_restore -U worldcam_app -d worldcam_app --clean --if-exists /tmp/worldcam_app.dump
docker exec commerce-postgres pg_restore -U commerce -d commerce --clean --if-exists /tmp/commerce.dump
```

Para Redis, reinicia el servicio para que lea el snapshot copiado:

```powershell
docker compose restart redis
```

4. Verifica que los servicios sigan sanos:

```powershell
docker compose ps
```

Luego instala dependencias y corre la app:

```powershell
npm install
npm run dev:api
npm run dev:web
```

La API debe responder en `http://localhost:4000/api/health` y la web en `http://localhost:3000`.
