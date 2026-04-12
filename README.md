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

## Screenshots

![screenshot](assets/image2.png)