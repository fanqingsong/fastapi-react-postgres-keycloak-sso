#!/bin/bash
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 切换到项目根目录
cd "$(dirname "$0")/.."

log_info "Starting FastAPI React PostgreSQL Keycloak SSO project with dual systems..."

log_info "Building images..."
docker compose build
# docker compose build --no-cache

# 停止并清理现有容器
log_info "Stopping existing containers..."
docker compose down

# 启动数据库服务
log_info "Starting database services..."
docker compose up -d postgres keycloak_postgres

# 等待数据库启动
log_info "Waiting for databases to be ready..."
sleep 10

# 启动Keycloak
log_info "Starting Keycloak..."
docker compose up -d keycloak

# 等待Keycloak完全启动
log_info "Waiting for Keycloak to be fully ready..."
wait_for_keycloak() {
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:8080/health > /dev/null 2>&1; then
            log_success "Keycloak is ready!"
            return 0
        fi
        
        log_info "Waiting for Keycloak... (attempt $attempt/$max_attempts)"
        sleep 10
        attempt=$((attempt + 1))
    done
    
    log_error "Keycloak failed to start within expected time"
    return 1
}

if ! wait_for_keycloak; then
    log_error "Failed to start Keycloak. Check logs with: docker logs fastapi_sso_keycloak"
    exit 1
fi

# 启动后端服务
log_info "Starting backend services..."
docker compose up -d backend backend2

# 等待后端启动
log_info "Waiting for backend services to be ready..."
wait_for_backend() {
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:8888/api > /dev/null 2>&1 && curl -s http://localhost:8889/api2 > /dev/null 2>&1; then
            log_success "Both backend services are ready!"
            return 0
        fi
        
        log_info "Waiting for backend services... (attempt $attempt/$max_attempts)"
        sleep 5
        attempt=$((attempt + 1))
    done
    
    log_error "Backend services failed to start within expected time"
    return 1
}

if ! wait_for_backend; then
    log_error "Failed to start backend services. Check logs with: docker logs fastapi_sso_backend && docker logs fastapi_sso_backend2"
    exit 1
fi

# 启动前端服务
log_info "Starting frontend services..."
docker compose up -d frontend frontend2

# 启动nginx
log_info "Starting nginx..."
docker compose up -d nginx

# 等待nginx启动
sleep 5

# 最终健康检查
log_info "Performing final health check..."
if curl -s http://localhost > /dev/null 2>&1 && curl -s http://localhost/system2 > /dev/null 2>&1; then
    log_success "All services are running successfully!"
    log_info "Application URLs:"
    log_info "  - System 1 (Main): http://localhost"
    log_info "  - System 2 (Test): http://localhost/system2"
    log_info "  - Backend API 1: http://localhost:8888"
    log_info "  - Backend API 2: http://localhost:8889"
    log_info "  - Keycloak: http://localhost:8081"
    log_info "  - API Docs 1: http://localhost/api/docs"
    log_info "  - API Docs 2: http://localhost/api2/docs"
    log_info ""
    log_info "🧪 SSO Testing:"
    log_info "  1. Login to System 1, then visit System 2 to test SSO"
    log_info "  2. Logout from either system to test Single Logout"
else
    log_warning "Health check failed, but services may still be starting up"
fi

log_info "Startup complete! Use './bin/stop.sh' to stop all services."