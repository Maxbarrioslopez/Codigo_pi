Param(
    [string]$BaseUrl = "http://127.0.0.1:8000",
    [string]$Username = "admin",
    [string]$Password = "admin123"
)

$ErrorActionPreference = "Continue"
$pass = 0
$fail = 0

function Test-Endpoint($method, $url, $body, $desc) {
    try {
        $headers = @{ Authorization = "Bearer $($global:token)" }
        if ($method -eq 'GET') {
            $resp = Invoke-WebRequest -Uri $url -Headers $headers -UseBasicParsing -ErrorAction Stop
        } elseif ($method -eq 'POST') {
            $headers["Content-Type"] = "application/json"
            $resp = Invoke-WebRequest -Uri $url -Headers $headers -Method POST -Body $body -UseBasicParsing -ErrorAction Stop
        } elseif ($method -eq 'PUT') {
            $headers["Content-Type"] = "application/json"
            $resp = Invoke-WebRequest -Uri $url -Headers $headers -Method PUT -Body $body -UseBasicParsing -ErrorAction Stop
        } elseif ($method -eq 'DELETE') {
            $resp = Invoke-WebRequest -Uri $url -Headers $headers -Method DELETE -UseBasicParsing -ErrorAction Stop
        } else {
            throw "Unsupported method $method"
        }
        Write-Host "[PASS] $desc - $method $url ($($resp.StatusCode))" -ForegroundColor Green
        $global:pass++
        return $resp
    } catch {
        Write-Host "[FAIL] $desc - $method $url : $($_.Exception.Message)" -ForegroundColor Red
        $global:fail++
        return $null
    }
}

Write-Host "=== Exhaustive Backend Tests ===" -ForegroundColor Cyan
Write-Host "Authenticating..."
try {
    $login = Invoke-WebRequest -Uri "$BaseUrl/api/auth/login/" -Method POST -ContentType "application/json" -Body (ConvertTo-Json @{ username=$Username; password=$Password }) -UseBasicParsing -ErrorAction Stop
    $global:token = (ConvertFrom-Json $login.Content).access
    Write-Host "[OK] JWT acquired" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Authentication failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n--- Trabajadores Module ---"
Test-Endpoint 'GET' "$BaseUrl/api/trabajadores" $null "List workers"
$createWorker = Test-Endpoint 'POST' "$BaseUrl/api/trabajadores" '{"rut":"22222222-2","nombre":"Test Worker","seccion":"B","contrato":"Plazo Fijo","sucursal":"Central"}' "Create worker"
if ($createWorker) {
    $wdetail = Test-Endpoint 'GET' "$BaseUrl/api/trabajadores/22222222-2" $null "Get worker detail"
    Test-Endpoint 'PUT' "$BaseUrl/api/trabajadores/22222222-2" '{"nombre":"Test Worker Updated"}' "Update worker"
    Test-Endpoint 'POST' "$BaseUrl/api/trabajadores/22222222-2/bloquear" '{"motivo":"Test block"}' "Block worker"
    Test-Endpoint 'POST' "$BaseUrl/api/trabajadores/22222222-2/desbloquear" '{}' "Unblock worker"
    Test-Endpoint 'GET' "$BaseUrl/api/trabajadores/22222222-2/timeline" $null "Worker timeline"
    Test-Endpoint 'DELETE' "$BaseUrl/api/trabajadores/22222222-2" '{"motivo":"Test cleanup"}' "Soft delete worker"
}

Write-Host "`n--- Ciclos Module ---"
Test-Endpoint 'GET' "$BaseUrl/api/ciclos" $null "List cycles"
$createCycle = Test-Endpoint 'POST' "$BaseUrl/api/ciclos" '{"fecha_inicio":"2025-12-01","fecha_fin":"2026-01-31"}' "Create cycle"
if ($createCycle) {
    $cycleId = (ConvertFrom-Json $createCycle.Content).id
    Test-Endpoint 'GET' "$BaseUrl/api/ciclos/$cycleId" $null "Get cycle detail"
    Test-Endpoint 'PUT' "$BaseUrl/api/ciclos/$cycleId" '{"activo":true}' "Update cycle"
    Test-Endpoint 'GET' "$BaseUrl/api/ciclos/$cycleId/estadisticas" $null "Cycle stats"
    Test-Endpoint 'POST' "$BaseUrl/api/ciclos/$cycleId/cerrar" '{}' "Close cycle"
}

Write-Host "`n--- Stock Module ---"
Test-Endpoint 'GET' "$BaseUrl/api/stock/resumen" $null "Stock summary"
Test-Endpoint 'GET' "$BaseUrl/api/stock/movimientos" $null "Stock movements"
Test-Endpoint 'POST' "$BaseUrl/api/stock/movimiento" '{"accion":"entrada","tipo_caja":"Estándar","cantidad":50,"motivo":"Test ingress","sucursal_codigo":"CENT"}' "Register stock movement"

Write-Host "`n--- Nómina Module ---"
Test-Endpoint 'GET' "$BaseUrl/api/nomina/historial" $null "Nomina history"
# Preview/Confirmar require multipart file upload; skipped in this script

Write-Host "`n--- Tickets Module ---"
Test-Endpoint 'POST' "$BaseUrl/api/tickets" '{"rut":"22222222-2","beneficio":"Caja"}' "Create ticket"
# If ticket created, test state/annul/reprint (requires UUID from response)

Write-Host "`n--- Incidencias Module ---"
Test-Endpoint 'POST' "$BaseUrl/api/incidencias" '{"tipo":"Falla","descripcion":"Test incident","trabajador_rut":"22222222-2"}' "Create incidencia"
Test-Endpoint 'GET' "$BaseUrl/api/incidencias/listar" $null "List incidencias"

Write-Host "`n--- Agendamientos Module ---"
Test-Endpoint 'POST' "$BaseUrl/api/agendamientos" '{"rut":"22222222-2","fecha_retiro":"2026-01-15"}' "Create agendamiento"
Test-Endpoint 'GET' "$BaseUrl/api/agendamientos/22222222-2" $null "List agendamientos for worker"

Write-Host "`n--- Ciclo/Params Module ---"
Test-Endpoint 'GET' "$BaseUrl/api/ciclo/activo" $null "Active cycle"
Test-Endpoint 'GET' "$BaseUrl/api/parametros" $null "Operational params"

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "PASSED: $pass" -ForegroundColor Green
Write-Host "FAILED: $fail" -ForegroundColor Red
if ($fail -eq 0) {
    Write-Host "All tests passed!" -ForegroundColor Green
} else {
    Write-Host "Some tests failed. Review above." -ForegroundColor Yellow
}
