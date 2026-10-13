#!/usr/bin/env bash
# ==============================================================================
# Script: deploy.sh
# Stack: SBI FPT Innovation Platform (sbifpt)
# Services:
#   - sbifpt-api: Node.js 22 Hono REST API (:4100)
#   - sbifpt-web: Vite React SPA on Nginx Alpine (:3100)
# Network: ops_bridge (Docker external bridge)
# ==============================================================================

set -euo pipefail

# ANSI color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/docker-compose.yml"
NETWORK_NAME="ops_bridge"
REMOTE_HOST="${REMOTE_HOST:-contabo}"
REMOTE_DIR="/opt/sbifpt"
API_PORT=4100
WEB_PORT=3100
HEALTH_TIMEOUT=30

log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" >&2
}

# ------------------------------------------------------------------------------
# 1. Validation Step
# ------------------------------------------------------------------------------
validate_compose() {
    log_info "Validating docker-compose.yml syntax..."
    if ! docker compose -f "${COMPOSE_FILE}" config > /dev/null; then
        log_error "docker compose configuration validation failed!"
        exit 1
    fi
    log_success "docker-compose.yml configuration is valid."
}

# ------------------------------------------------------------------------------
# 2. Local Deployment
# ------------------------------------------------------------------------------
deploy_local() {
    log_info "Starting local deployment for SBI FPT stack..."
    cd "${ROOT_DIR}"

    validate_compose

    # Ensure external bridge network exists
    if ! docker network inspect "${NETWORK_NAME}" >/dev/null 2>&1; then
        log_info "Creating external network '${NETWORK_NAME}'..."
        docker network create "${NETWORK_NAME}"
    else
        log_info "External network '${NETWORK_NAME}' is ready."
    fi

    log_info "Building and starting containers..."
    docker compose -f "${COMPOSE_FILE}" up -d --build --remove-orphans

    # Probe API health endpoint
    log_info "Probing http://localhost:${API_PORT}/health (timeout: ${HEALTH_TIMEOUT}s)..."
    local elapsed=0
    local healthy=false
    while [ "${elapsed}" -lt "${HEALTH_TIMEOUT}" ]; do
        if curl -s -f "http://localhost:${API_PORT}/health" >/dev/null 2>&1; then
            healthy=true
            break
        fi
        sleep 2
        elapsed=$((elapsed + 2))
        echo -n "."
    done
    echo ""

    if [ "${healthy}" = true ]; then
        local health_json
        health_json=$(curl -s "http://localhost:${API_PORT}/health")
        log_success "API Healthcheck passed: ${health_json}"
    else
        log_error "API failed to become healthy within ${HEALTH_TIMEOUT}s!"
        docker compose -f "${COMPOSE_FILE}" logs --tail 30 sbifpt-api
        exit 1
    fi

    # Probe Web static server
    log_info "Probing http://localhost:${WEB_PORT}/..."
    if curl -s -I "http://localhost:${WEB_PORT}/" | grep -qE "HTTP/[12].[0-9] 200"; then
        log_success "Web SPA frontend is serving HTTP 200 on port ${WEB_PORT}."
    else
        log_warn "Web SPA returned non-200 or is still warming up. Inspecting status..."
    fi

    log_info "Current running containers:"
    docker compose -f "${COMPOSE_FILE}" ps
    log_success "SBI FPT stack successfully deployed locally!"
}

# ------------------------------------------------------------------------------
# 3. Remote Deployment (VPS)
# ------------------------------------------------------------------------------
deploy_remote() {
    log_info "Starting remote deployment on host: ${REMOTE_HOST}..."

    # Check SSH connectivity and available RAM
    log_info "Checking VPS resources on ${REMOTE_HOST}..."
    ssh "${REMOTE_HOST}" "free -h"

    # Ensure remote directory exists
    log_info "Ensuring remote directory ${REMOTE_DIR} exists..."
    ssh "${REMOTE_HOST}" "mkdir -p ${REMOTE_DIR}"

    # Sync codebase excluding git and node_modules
    log_info "Syncing codebase to ${REMOTE_HOST}:${REMOTE_DIR}..."
    rsync -avz --delete \
        --exclude '.git' \
        --exclude 'node_modules' \
        --exclude '.pnpm-store' \
        --exclude 'dist' \
        --exclude 'build' \
        --exclude '.DS_Store' \
        "${ROOT_DIR}/" "${REMOTE_HOST}:${REMOTE_DIR}/"

    # Build and start on VPS
    log_info "Building and launching containers on ${REMOTE_HOST}..."
    ssh "${REMOTE_HOST}" "bash -c '
        set -euo pipefail
        cd ${REMOTE_DIR}
        docker compose config >/dev/null
        docker compose up -d --build --remove-orphans
    '"

    # Probe remote API health
    log_info "Verifying health on remote container..."
    ssh "${REMOTE_HOST}" "docker exec sbifpt-api curl -s -f http://localhost:${API_PORT}/health"

    # Reload Caddy reverse proxy on VPS
    log_info "Reloading Caddy reverse proxy on VPS..."
    ssh "${REMOTE_HOST}" "docker exec caddy caddy reload --config /etc/caddy/Caddyfile"

    # Probe public domain
    log_info "Probing public URL https://sbifpt.khanhdp.com/health..."
    local public_health
    public_health=$(curl -s "https://sbifpt.khanhdp.com/health" || true)
    log_success "Public endpoint response: ${public_health}"

    log_success "Remote deployment to ${REMOTE_HOST} completed successfully!"
}

# ------------------------------------------------------------------------------
# Entrypoint Router
# ------------------------------------------------------------------------------
MODE="${1:-local}"

case "${MODE}" in
    local)
        deploy_local
        ;;
    remote|--remote)
        deploy_remote
        ;;
    validate|--validate)
        validate_compose
        ;;
    *)
        echo "Usage: $0 [local|remote|validate]"
        echo "  local    : Validate, build, and run containers locally (default)"
        echo "  remote   : Sync and deploy stack to remote VPS (${REMOTE_HOST})"
        echo "  validate : Validate docker-compose.yml configuration only"
        exit 1
        ;;
esac
