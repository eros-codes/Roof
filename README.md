# Roof — Project Setup

This repository contains a static frontend, a Node/Express backend, and an admin panel.

## Running the backend
Run the development server from the `server` directory:

```bash
cd server
npm install
npm run db:push
npm run dev
```

## Running the frontend (client)
Serve the static site from the `public` directory:

```bash
npx http-server . -p 3000
```

Note: Use `localhost` (not `127.0.0.1`) for local development.

## Admin panel
Run the admin panel from the `server` directory:

```bash
cd server
npm run admin:dev
```

To create the initial admin account, run:

```bash
npm run db:seed
```

## Environment variables
See [server/.env.example](server/.env.example) for sample environment variables. Create a local copy for development:

```bash
cp server/.env.example server/.env
# on Windows
copy server\.env.example server\.env
```

Then edit `server/.env` with your values.

## Install dependencies (server)
If you haven't installed server dependencies yet:

```bash
cd server
npm install
```


