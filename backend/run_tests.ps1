# Script para ejecutar tests exhaustivos del backend
# Uso: .\run_tests.ps1

Write-Host "🧪 EJECUTANDO SUITE DE TESTS - BACKEND TÓTEM DIGITAL" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# Activar entorno virtual si existe
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "⚡ Activando entorno virtual..." -ForegroundColor Yellow
    & venv\Scripts\Activate.ps1
}

# Opción 1: Tests funcionales (recomendado)
Write-Host "📊 Ejecutando tests funcionales validados..." -ForegroundColor Green
python -m pytest totem/tests/test_functional.py -v --tb=short

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "✅ TESTS COMPLETADOS" -ForegroundColor Green
Write-Host ""
Write-Host "📄 Para ver reporte detallado: cat totem\tests\REPORTE_TESTS.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 Para ejecutar TODOS los tests:" -ForegroundColor Yellow
Write-Host "   python -m pytest totem/tests/ -v" -ForegroundColor White
Write-Host ""
Write-Host "📊 Para generar reporte de cobertura HTML:" -ForegroundColor Yellow
Write-Host "   python -m pytest totem/tests/test_functional.py --cov=totem --cov-report=html" -ForegroundColor White
Write-Host "   start htmlcov\index.html" -ForegroundColor White
Write-Host ""
