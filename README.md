# Roof — Project Setup

This repository contains a static frontend, a Node/Express backend, and an admin panel.

## Running the backend
Run the development server from the `server` directory. Everything is served by the single Express server:

```bash
cd server
npm install
npm run db:push
npm run dev
```

This serves the client pages at `http://localhost:4000/`, the admin panel at `http://admin.localhost:4000/` when `ADMIN_HOST=admin.localhost` is set, and the API at `http://localhost:4000/api`.

> Note: when `ADMIN_HOST` is enabled, the admin UI is only available through that hostname, not via `/admin`.


To create the initial admin account, run:

```bash
npm run db:seed
```

## Environment variables
See [server/.env.example](server/.env.example) for sample environment variables. Create a local copy for development:

```bash
# on MacOS
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


