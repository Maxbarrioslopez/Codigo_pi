#!/bin/bash

###############################################################################
# SCRIPT DE AUTO-ACTUALIZACIÓN - TÓTEM DIGITAL (CODIGO_PI)
###############################################################################
# Uso:
#   ./updates.sh --full      → Backup + Git + Backend + Frontend + Nginx + Health
#   ./updates.sh --backend   → Solo backend
#   ./updates.sh --frontend  → Solo frontend
#   ./updates.sh --nginx     → Solo Nginx
#   ./updates.sh --migrate   → Solo migraciones Django
#   ./updates.sh --backup    → Solo backups
#   ./updates.sh --dry-run   → Ver cambios pendientes en Git
#   ./updates.sh --health    → Ver estado de servicios
###############################################################################

set -e  # Salir ante el primer error

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

SERVIDOR_IP="217.160.136.84"
DOMINIO="mbarrios.tech"

REPO_DIR="/var/www/Codigo_pi"
BACKEND_DIR="$REPO_DIR/backend"
FRONTEND_DIR="$REPO_DIR/frontend"
VENV_DIR="$BACKEND_DIR/venv"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_DIR="/var/log/totem"
LOG_FILE="$LOG_DIR/updates_${TIMESTAMP}.log"
BACKUP_DIR="/var/backups/totem"

BACKEND_SERVICE="codigo-pi-backend"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================================
# UTILIDADES
# ============================================================================

print_header() {
    echo -e "\n${BLUE}========================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================================${NC}\n"
}

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error()   { echo -e "${RED}✗ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_info()    { echo -e "${BLUE}ℹ $1${NC}"; }

log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "Este script debe ejecutarse como root (usa sudo)"
        exit 1
    fi
}

check_directories() {
    if [ ! -d "$REPO_DIR" ]; then
        print_error "Directorio del repositorio no encontrado: $REPO_DIR"
        exit 1
    fi
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"
}

# ============================================================================
# BACKUP
# ============================================================================

backup_database() {
    print_header "BACKUP DE BASE DE DATOS"

    if ! command -v pg_dump >/dev/null 2>&1; then
        print_warning "pg_dump no encontrado, parece que no usas PostgreSQL todavía. Saltando backup de DB."
        return 0
    fi

    local backup_file="$BACKUP_DIR/postgres_backup_${TIMESTAMP}.sql.gz"
    print_info "Intentando backup de base totem_production (si existe)..."

    set +e
    pg_dump -U postgres totem_production 2>/dev/null | gzip > "$backup_file"
    local exit_code=$?
    set -e

    if [ $exit_code -eq 0 ]; then
        print_success "Backup de DB creado: $backup_file"
        log_message "Backup DB: $backup_file"
    else
        print_warning "No se pudo hacer backup de DB (quizás no existe totem_production). Continuando..."
    fi
}

backup_code() {
    print_header "BACKUP DE CÓDIGO"

    local backup_file="$BACKUP_DIR/codigo_backup_${TIMESTAMP}.tar.gz"
    print_info "Comprimiendo proyecto desde $REPO_DIR ..."

    tar -czf "$backup_file" -C "$(dirname "$REPO_DIR")" "$(basename "$REPO_DIR")" \
        --exclude='.git' --exclude='__pycache__' --exclude='node_modules' --exclude='.env' 2>/dev/null

    print_success "Backup de código creado: $backup_file"
    log_message "Backup CODE: $backup_file"
}

# ============================================================================
# GIT
# ============================================================================

update_git() {
    print_header "ACTUALIZANDO REPOSITORIO GIT"

    cd "$REPO_DIR"
    print_info "Obteniendo cambios de origin/main..."
    git fetch origin main

    local local_hash
    local local_remote
    local_hash=$(git rev-parse HEAD)
    local_remote=$(git rev-parse origin/main)

    if [ "$local_hash" = "$local_remote" ]; then
        print_success "El código ya está actualizado (sin cambios remotos)"
        return 0
    fi

    print_info "Reseteando a origin/main..."
    git reset --hard origin/main
    print_success "Repositorio sincronizado con origin/main"
    log_message "Git reset --hard origin/main"
}

# ============================================================================
# BACKEND
# ============================================================================

update_backend() {
    print_header "ACTUALIZANDO BACKEND"

    cd "$BACKEND_DIR"

    if [ ! -d "$VENV_DIR" ]; then
        print_warning "venv no existe, creando..."
        python3 -m venv "$VENV_DIR"
    fi

    print_info "Activando venv..."
    # shellcheck disable=SC1090
    . "$VENV_DIR/bin/activate"

    if [ -f "requirements.txt" ]; then
        print_info "Instalando dependencias Python..."
        pip install -q --upgrade pip
        pip install -q -r requirements.txt
        print_success "Dependencias Python listas"
    else
        print_warning "requirements.txt no encontrado"
    fi

    if [ -f "validar_credenciales.py" ]; then
        print_info "Ejecutando validar_credenciales.py..."
        set +e
        python validar_credenciales.py
        local exit_val
        exit_val=$?
        set -e
        if [ $exit_val -ne 0 ]; then
            print_warning "validar_credenciales.py reportó problemas. Revisa configuración, pero se continúa."
        else
            print_success "validar_credenciales.py OK"
        fi
    fi

    print_info "Ejecutando migraciones Django..."
    python manage.py migrate --noinput
    print_success "Migraciones aplicadas"

    print_info "Ejecutando collectstatic..."
    python manage.py collectstatic --noinput
    print_success "Staticfiles actualizados"

    deactivate
}

restart_backend_service() {
    print_header "REINICIANDO SERVICIO BACKEND ($BACKEND_SERVICE)"

    if systemctl restart "$BACKEND_SERVICE"; then
        print_success "Servicio $BACKEND_SERVICE reiniciado"
        log_message "Backend service restarted: $BACKEND_SERVICE"
    else
        print_error "No se pudo reiniciar $BACKEND_SERVICE"
        return 1
    fi

    sleep 2

    if systemctl is-active --quiet "$BACKEND_SERVICE"; then
        print_success "Backend está corriendo"
    else
        print_error "Backend NO está corriendo después de reiniciar"
        return 1
    fi
}

# ============================================================================
# FRONTEND
# ============================================================================

update_frontend() {
    print_header "ACTUALIZANDO FRONTEND"

    cd "$FRONTEND_DIR"

    if ! command -v npm >/dev/null 2>&1; then
        print_error "npm no encontrado. Instala Node.js para poder compilar el frontend."
        return 1
    fi

    print_info "Instalando dependencias Node (npm install)..."
    npm install --silent
    print_success "Dependencias Node listas"

    print_info "Construyendo frontend (npm run build)..."
    npm run build
    print_success "Build frontend generado (carpeta ./build)"
}

# ============================================================================
# NGINX
# ============================================================================

update_nginx() {
    print_header "NGINX - VALIDACIÓN Y RELOAD"

    if ! command -v nginx >/dev/null 2>&1; then
        print_error "Nginx no está instalado. Instalando..."
        apt-get update -qq
        apt-get install -y nginx >/dev/null
    fi

    print_info "Probando configuración nginx (nginx -t)..."
    if nginx -t >/dev/null 2>&1; then
        print_success "Configuración de Nginx válida"
    else
        print_error "Configuración de Nginx inválida, revisa nginx -t"
        nginx -t
        return 1
    fi

    print_info "Recargando Nginx..."
    systemctl reload nginx
    print_success "Nginx recargado"

    if systemctl is-active --quiet nginx; then
        print_success "Nginx está corriendo"
    else
        print_error "Nginx NO está corriendo"
        return 1
    fi
}

# ============================================================================
# HEALTH CHECK
# ============================================================================

health_check() {
    print_header "HEALTH CHECK"

    print_info "Backend ($BACKEND_SERVICE)..."
    if systemctl is-active --quiet "$BACKEND_SERVICE"; then
        print_success "Backend ACTIVO"
    else
        print_error "Backend INACTIVO"
    fi

    print_info "Nginx..."
    if systemctl is-active --quiet nginx; then
        print_success "Nginx ACTIVO"
    else
        print_error "Nginx INACTIVO"
    fi

    print_info "HTTP en localhost..."
    set +e
    curl -sf http://localhost >/dev/null 2>&1
    local http_exit=$?
    set -e
    if [ $http_exit -eq 0 ]; then
        print_success "HTTP responde en localhost"
    else
        print_warning "HTTP no respondió en localhost"
    fi

    print_info "HTTPS en dominio ($DOMINIO)..."
    set +e
    curl -sf "https://$DOMINIO" >/dev/null 2>&1
    local https_exit=$?
    set -e
    if [ $https_exit -eq 0 ]; then
        print_success "HTTPS responde en https://$DOMINIO"
    else
        print_warning "HTTPS no respondió en https://$DOMINIO"
    fi
}

# ============================================================================
# DRY RUN
# ============================================================================

dry_run_mode() {
    print_header "DRY-RUN: CAMBIOS PENDIENTES EN GIT"

    cd "$REPO_DIR"
    git fetch origin main

    print_info "Commits pendientes:"
    git log --oneline HEAD..origin/main || print_info "Sin commits pendientes."

    print_info "Archivos que cambiarían:"
    git diff --name-only HEAD origin/main || print_info "Sin diffs."
}

# ============================================================================
# MAIN
# ============================================================================

main() {
    check_root
    check_directories
    log_message "===== INICIO ACTUALIZACIÓN ====="

    MODE="$1"
    if [ -z "$MODE" ]; then
        MODE="--full"
    fi

    case "$MODE" in
        --full)
            print_header "MODO: ACTUALIZACIÓN COMPLETA (SIN BACKUP)"
            update_git
            update_backend
            update_frontend
            restart_backend_service
            update_nginx
            health_check
            ;;


        --backend)
            print_header "MODO: SOLO BACKEND"
            update_git
            update_backend
            restart_backend_service
            health_check
            ;;

        --frontend)
            print_header "MODO: SOLO FRONTEND"
            update_git
            update_frontend
            update_nginx
            health_check
            ;;

        --nginx)
            print_header "MODO: SOLO NGINX"
            update_nginx
            ;;

        --migrate)
            print_header "MODO: SOLO MIGRACIONES DJANGO"
            cd "$BACKEND_DIR"
            . "$VENV_DIR/bin/activate"
            python manage.py migrate --noinput
            deactivate
            restart_backend_service
            ;;

        --backup)
            print_header "MODO: SOLO BACKUP"
            backup_database
            backup_code
            ;;

        --dry-run)
            dry_run_mode
            ;;

        --health)
            health_check
            ;;

        *)
            echo "Uso:"
            echo "  $0 --full"
            echo "  $0 --backend"
            echo "  $0 --frontend"
            echo "  $0 --nginx"
            echo "  $0 --migrate"
            echo "  $0 --backup"
            echo "  $0 --dry-run"
            echo "  $0 --health"
            exit 1
            ;;
    esac

    log_message "===== FIN ACTUALIZACIÓN ====="
}

main "$@"
