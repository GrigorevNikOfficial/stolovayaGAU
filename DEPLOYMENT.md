# Deployment Guide

This repository now ships with Docker images for the backend (Node.js + Express + MongoDB) and the frontend (React + Vite + Nginx), plus a GitHub Actions workflow that builds images and rolls them out to a VPS.

## 1. Local Docker workflow

1. Copy `.env.example` to `.env` at the repo root and update the secrets (JWT, S3, Mongo, etc.).
2. (Optional) Adjust `frontend/.env.example` or `backend/.env.example` if you need different defaults when running outside of Docker.
3. Build and start every container:

   ```bash
   docker compose up --build
   ```

4. The services are available at (override via `.env` if needed):
   - Backend API: http://localhost:5000
   - Frontend SPA: http://localhost:4173
   - MongoDB: localhost:27017

5. Stop everything with `docker compose down` (add `-v` to drop Mongo data volume).

## 2. Production stack on the VPS

1. Copy the files under `deploy/` to a directory on the VPS (for example `/opt/stolovaya`). You should end up with:
   - `docker-compose.server.yml`
   - `.env` (create from `deploy/server/.env.example`)
2. Update the `.env` on the server with real credentials (Mongo URI, JWT secret, S3 keys, etc.).
3. Make sure Docker and Docker Compose Plugin are installed on the VPS.
4. The GitHub Action will SSH into the VPS, log into GHCR, pull the latest images and recreate the stack:

   ```bash
   STACK_VERSION=$(git rev-parse HEAD)
   docker compose -f docker-compose.server.yml pull
   docker compose -f docker-compose.server.yml up -d --remove-orphans
   ```

   You can run the same commands manually when debugging. Logs remain accessible with `docker compose logs -f backend` (or `frontend`).

## 3. GitHub Actions CI/CD

Workflow file: `.github/workflows/deploy.yml`.

### Build job
- Triggers on pushes to `main` and `deploy`, plus manual runs (`workflow_dispatch`).
- Builds the backend and frontend Docker images using Buildx.
- Pushes both `latest` and `${{ github.sha }}` tags to GHCR (`ghcr.io/<owner>/stolovaya-backend` and `/stolovaya-frontend`).
- Frontend build uses the `FRONTEND_API_BASE_URL` secret (falls back to `http://localhost:5000/api`).

### Deploy job
- Runs only after the build job succeeds on the same branches.
- Uses `appleboy/ssh-action` to execute `docker compose pull && docker compose up -d --remove-orphans` on the VPS, pointing at `deploy/docker-compose.server.yml`.
- The `STACK_VERSION` env forces the server compose stack to use the commit-specific image tags.

### Required repository secrets
| Secret | Purpose |
| --- | --- |
| `FRONTEND_API_BASE_URL` | (Optional) Public API endpoint baked into the frontend build, e.g. `https://api.example.com/api`. |
| `VPS_HOST` | VPS IP / hostname for SSH. |
| `VPS_USER` | SSH user. |
| `VPS_SSH_KEY` | Base64-encoded private key or raw PEM with proper newlines (GitHub secret field preserves newlines). |
| `VPS_PORT` | (Optional) SSH port, defaults to `22`. |
| `VPS_APP_PATH` | Absolute path on the VPS that contains `docker-compose.server.yml` and the `.env`. |
| `GHCR_TOKEN` | PAT with `read:packages` scope so the VPS can `docker login ghcr.io`. |
| `GHCR_USERNAME` | (Optional) User for GHCR login. Defaults to the repo owner if omitted. |

> Keep the server `.env` outside of version control and make sure the VPS directory is writable by the SSH user.

## 4. Image naming conventions
- Backend: `ghcr.io/<org-or-user>/stolovaya-backend`
- Frontend: `ghcr.io/<org-or-user>/stolovaya-frontend`
- Tags: `latest` and the short SHA (GitHub already provides `${{ github.sha }}` in full length; Compose uses the full SHA stored in `STACK_VERSION`).

## 5. Troubleshooting
- **Mongo data reset**: run `docker compose down -v` locally to drop the named volume. On the VPS, prune the `mongo-data` volume manually if you need a clean slate.
- **Frontend calling the API**: set `FRONTEND_API_BASE_URL` to the externally reachable backend URL before triggering the workflow so the built bundle points to the correct domain/subdomain.
- **GHCR auth errors**: ensure the PAT (`GHCR_TOKEN`) belongs to an account with access to the repository’s packages.
- **Failing workflow step**: rerun with `workflow_dispatch` after fixing secrets or server state.
