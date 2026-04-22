# Loops

Loops is a self-hostable personal command center built around threads of intent. This stack is set up so you can run everything locally on macOS during the first week, then point it at a cloud-hosted Postgres database and deploy the app server wherever you want later.

## Stack

- Next.js App Router for the web app and API routes
- Prisma for database access and schema management
- PostgreSQL as the persistent database
- Cookie-backed session auth with email/password login

## Local setup

1. Copy `.env.example` to `.env`.
2. Start Postgres locally.
   - With Docker: `docker compose up -d`
   - Or point `DATABASE_URL` at your own Postgres server
3. Install dependencies: `npm install`
4. Generate Prisma client: `npm run db:generate`
5. Push the schema: `npm run db:push`
6. Optional demo data: `npm run db:seed`
7. Start the app: `npm run dev`

The seeded demo account is:

- Email: `demo@loops.local`
- Password: `demo1234`

## Remote device testing

For Android browser testing while the app runs on your Mac:

1. Start the app with `npm run dev`
2. Expose it with a tunnel like `ngrok http 3000`
3. Open the tunnel URL on your phone

If you later deploy on your own server, keep the app and database on that machine or point the app server at a managed/self-hosted Postgres instance by changing `DATABASE_URL`.

## Production deploy on your own server

This repo now includes a simple production stack for a single server:

- `Dockerfile` for the Next.js app
- `docker-compose.prod.yml` for the app and Postgres
- `deploy.env.example` for the server-side environment variables

### 1. Install Docker on the server

You need Docker Engine and the Docker Compose plugin available over SSH.

### 2. Copy the project and configure env

On the server:

1. Clone or copy this repo
2. Copy `deploy.env.example` to `deploy.env`
3. Set `POSTGRES_PASSWORD` to a strong random password

The bundled Postgres container uses the values from `deploy.env`:

- Username: `POSTGRES_USER` (defaults to `postgres`)
- Database: `POSTGRES_DB` (defaults to `loops`)
- Password: `POSTGRES_PASSWORD`

### 3. Start the stack

Run:

```bash
docker compose --env-file deploy.env -f docker-compose.prod.yml up -d --build
```

This starts PostgreSQL first, waits for it to become healthy, then starts the app. The app container runs `prisma db push` before startup so the schema is created automatically.

This step creates the database schema, but it does not create an application login. For a fresh production database, register your first account through the app UI.

Production now uses its own Docker volume, `loops-prod-postgres`, so it does not share database state with the local dev stack on the same machine.

If you ever change `POSTGRES_PASSWORD` after Postgres has already initialized its data directory, the old database volume keeps the original password. Update the password only before first boot, or reset the volume.

If your current `loops-app` container is crash-looping with a Prisma `P1000` authentication error, reset the old shared volume once:

```bash
docker compose --env-file deploy.env -f docker-compose.prod.yml down
docker volume rm loops_loops-postgres
docker compose --env-file deploy.env -f docker-compose.prod.yml up -d --build
```

The removed volume name above is the old shared default created before dev and prod volumes were separated.

### 4. Updates

When you pull new code on the server, redeploy with:

```bash
docker compose --env-file deploy.env -f docker-compose.prod.yml up -d --build
```

### Notes

- The app is published directly on port `3000`.
- Local dev now uses `loops-dev-postgres` and production uses `loops-prod-postgres`, so they can safely coexist on the same machine.
- If you want to put DuckDNS, Caddy, Nginx, or another proxy in front later, you can do that outside this compose file.
- If you want to use an external Postgres server later, replace the `DATABASE_URL` logic in `docker-compose.prod.yml` and remove the bundled `db` service.

## Deploy on Render

If you deploy this repo to Render using the Docker runtime:

1. Set `DATABASE_URL` to your Render Postgres internal URL
2. Make sure the database schema is created before sign-in traffic hits the app

For this project, the simplest schema step is:

```bash
npx prisma db push
```

You can run that either:

- as a pre-deploy command in Render
- or in the service's Docker command before startup

Example Docker command in Render:

```bash
sh -c "npx prisma db push && npm run start"
```

### Notes

- Render can detect port `3000` automatically for this Docker service, so no custom `PORT` handling is required here.
- The Dockerfile installs `openssl`, which Prisma may require on slim Debian-based images.
- This project currently uses Prisma `db push` for production schema setup, not versioned Prisma migrations. If you want safer deploy history later, switch to Prisma migrations and use `npx prisma migrate deploy` instead.

## Screenshots

![screenshot](assets/image2.png)
