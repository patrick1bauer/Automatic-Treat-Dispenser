# Automatic-Treat-Dispenser

This repository contains a simple treat dispenser project with a Flask backend and a Next.js frontend. Below are concise instructions to build the frontend and backend locally, create Docker images (using the included Dockerfiles), and launch the services with Docker Compose.

## Prerequisites

- Docker and Docker Compose (or the `docker compose` plugin)
- Node.js (v20.9+ recommended; Node 26 is fine for Docker) and `npm` for local frontend builds
- Python 3.11+ and `pip` for local backend builds

## Build frontend locally

1. Change to the frontend folder:

```
cd frontend
```

2. Install dependencies and build the production bundle:

```
npm install
npm run build
```

## Containerize & launch with Docker Compose

From the repository root run:

```
docker compose up -d --build
```

This uses `docker-compose.yml` and will create two services:
- `treat-backend` (backend)
- `treat-frontend` (frontend)

## Accessing the services

- Frontend: http://localhost:3000
- Backend API: http://localhost:61002 (if using host networking)
