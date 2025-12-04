import { useState } from 'react';
import { Scan, QrCode, Package, AlertCircle, CheckCircle, Camera, Keyboard, FileText, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

type ScreenType = 'scan-ticket' | 'validate-box' | 'result-success' | 'result-error';

export function GuardiaFlowScreens() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('scan-ticket');
  const [isScanning, setIsScanning] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);

  // Simulación de escaneo
  const handleScan = (nextScreen: ScreenType) => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setCurrentScreen(nextScreen);
    }, 2000);
  };

  // Pantalla 1: Escanear Ticket
  if (currentScreen === 'scan-ticket') {
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Header Card */}
          <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-8 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#E12019] to-[#B51810] rounded-xl flex items-center justify-center">
                <Scan className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-[#333333]">Validación de Beneficio</h1>
                <p className="text-[#6B6B6B]">Paso 1 de 2</p>
              </div>
            </div>
          </div>

          {/* Scanner Card */}
          <div className="bg-white border-2 border-[#E0E0E0] rounded-xl overflow-hidden shadow-lg">
            <div className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-[#333333] mb-2">Escanee el ticket del trabajador</h2>
                <p className="text-[#6B6B6B]">
                  Coloque el código QR frente al escáner
                </p>
              </div>

              {/* QR Scanner Frame */}
              <div className="relative mx-auto" style={{ maxWidth: '400px' }}>
                <div className="aspect-square bg-[#333333] rounded-2xl relative overflow-hidden">
                  {/* Scanner Animation */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {isScanning ? (
                      <div className="space-y-4">
                        <div className="w-24 h-24 border-4 border-[#FF9F55] border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-white text-center">Validando...</p>
                      </div>
                    ) : (
                      <div className="w-48 h-48 border-4 border-white rounded-2xl flex items-center justify-center">
                        <QrCode className="w-20 h-20 text-white opacity-50" />
                      </div>
                    )}
                  </div>

                  {/* Corner Brackets */}
                  <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-[#017E49] rounded-tl-lg" />
                  <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-[#017E49] rounded-tr-lg" />
                  <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-[#017E49] rounded-bl-lg" />
                  <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-[#017E49] rounded-br-lg" />

                  {/* Scanning Line */}
                  {!isScanning && (
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-[#017E49] animate-pulse" />
                  )}
                </div>

                {/* Status Indicator */}
                {isScanning && (
                  <div className="mt-6 bg-[#FFF4E6] border-2 border-[#FF9F55] rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 border-3 border-[#FF9F55] border-t-transparent rounded-full animate-spin" />
                      <p className="text-[#333333]">Validando ticket...</p>
                    </div>
                  </div>
                )}

                {!isScanning && (
                  <div className="mt-6 bg-[#F8F8F8] border-2 border-[#E0E0E0] rounded-xl p-4 text-center">
                    <p className="text-[#6B6B6B]">
                      <Camera className="w-5 h-5 inline-block mr-2" />
                      Esperando escaneo...
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-[#F8F8F8] border-t-2 border-[#E0E0E0] p-6 space-y-3">
              <Button
                onClick={() => handleScan('validate-box')}
                disabled={isScanning}
                className="w-full bg-[#017E49] text-white hover:bg-[#016339] h-14 rounded-xl"
              >
                <Scan className="w-5 h-5 mr-2" />
                Simular Escaneo Exitoso
              </Button>
              <Button
                variant="outline"
                disabled={isScanning}
                className="w-full border-2 border-[#E0E0E0] h-12 rounded-xl"
              >
                <Keyboard className="w-5 h-5 mr-2" />
                Ingresar código manual
              </Button>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-6 bg-white border-2 border-[#E0E0E0] rounded-xl p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-[#FF9F55] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[#333333] mb-1">Consejos para escanear</p>
                <ul className="text-[#6B6B6B] space-y-1" style={{ fontSize: '14px' }}>
                  <li>• Asegúrese de que el código QR esté limpio y completo</li>
                  <li>• Mantenga el código dentro del marco de escaneo</li>
                  <li>• Evite reflejos de luz directa sobre el código</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla 2: Validar Caja Física
  if (currentScreen === 'validate-box') {
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Header Card */}
          <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-8 mb-6">
            <button
              onClick={() => setCurrentScreen('scan-ticket')}
              className="text-[#E12019] mb-4 inline-flex items-center gap-2 hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#E12019] to-[#B51810] rounded-xl flex items-center justify-center">
                <Package className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-[#333333]">Validación de Caja Física</h1>
                <p className="text-[#6B6B6B]">Paso 2 de 2</p>
              </div>
            </div>
          </div>

          {/* Worker Info */}
          <div className="bg-white border-2 border-[#017E49] rounded-xl p-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>Trabajador</p>
                <h3 className="text-[#333333] mb-3">María González Pérez</h3>
                <div className="flex gap-4">
                  <div>
                    <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>RUT</p>
                    <p className="text-[#333333]" style={{ fontSize: '14px' }}>12.345.678-9</p>
                  </div>
                  <div>
                    <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>Beneficio</p>
                    <p className="text-[#017E49]" style={{ fontSize: '14px' }}>Premium</p>
                  </div>
                  <div>
                    <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>Caja Asignada</p>
                    <p className="text-[#333333]" style={{ fontSize: '14px', fontWeight: 700 }}>BOX-PRM-4567</p>
                  </div>
                </div>
              </div>
              <CheckCircle className="w-8 h-8 text-[#017E49]" />
            </div>
          </div>

          {/* Scanner Card */}
          <div className="bg-white border-2 border-[#E0E0E0] rounded-xl overflow-hidden shadow-lg">
            <div className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-[#333333] mb-2">Escanee el código de la caja</h2>
                <p className="text-[#6B6B6B]">
                  Coloque el código de barras o QR de la caja física
                </p>
              </div>

              {/* Barcode Scanner Frame */}
              <div className="relative mx-auto" style={{ maxWidth: '500px' }}>
                <div className="bg-[#333333] rounded-2xl relative overflow-hidden" style={{ height: '300px' }}>
                  {/* Scanner Animation */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {isScanning ? (
                      <div className="space-y-4">
                        <div className="w-24 h-24 border-4 border-[#FF9F55] border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-white text-center">Validando código...</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-64 h-32 border-4 border-white rounded-xl flex items-center justify-center">
                          <div className="space-y-2">
                            <div className="flex gap-1 justify-center">
                              {[...Array(12)].map((_, i) => (
                                <div
                                  key={i}
                                  className="w-2 bg-white opacity-50"
                                  style={{ height: `${Math.random() * 40 + 20}px` }}
                                />
                              ))}
                            </div>
                            <p className="text-white text-center text-xs opacity-50">BOX-PRM-XXXX</p>
                          </div>
                        </div>
                        <p className="text-white text-center" style={{ fontSize: '14px' }}>
                          Código de barras o QR
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Corner Brackets */}
                  <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-[#FF9F55] rounded-tl-lg" />
                  <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-[#FF9F55] rounded-tr-lg" />
                  <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-[#FF9F55] rounded-bl-lg" />
                  <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-[#FF9F55] rounded-br-lg" />

                  {/* Scanning Line */}
                  {!isScanning && (
                    <div className="absolute inset-x-0 top-1/2 h-1 bg-[#FF9F55] animate-pulse" />
                  )}
                </div>

                {/* Status Indicator */}
                {!isScanning && (
                  <div className="mt-6 bg-[#F8F8F8] border-2 border-[#E0E0E0] rounded-xl p-4 text-center">
                    <p className="text-[#6B6B6B]">
                      <Camera className="w-5 h-5 inline-block mr-2" />
                      Esperando escaneo de caja...
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-[#F8F8F8] border-t-2 border-[#E0E0E0] p-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleScan('result-success')}
                  disabled={isScanning}
                  className="bg-[#017E49] text-white hover:bg-[#016339] h-14 rounded-xl"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Caja Correcta
                </Button>
                <Button
                  onClick={() => handleScan('result-error')}
                  disabled={isScanning}
                  className="bg-[#E12019] text-white hover:bg-[#B51810] h-14 rounded-xl"
                >
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Caja Incorrecta
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowManualInput(true)}
                disabled={isScanning}
                className="w-full border-2 border-[#E0E0E0] h-12 rounded-xl"
              >
                <Keyboard className="w-5 h-5 mr-2" />
                Ingresar código manual
              </Button>
            </div>
          </div>

          {/* Alert - Mismatched Box Warning */}
          <div className="mt-6 bg-[#FFF4E6] border-2 border-[#FF9F55] rounded-xl p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-[#FF9F55] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[#333333] mb-1">Importante</p>
                <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>
                  Si la caja escaneada no coincide con la asignada (BOX-PRM-4567), el sistema mostrará una alerta y deberá reportar la incidencia.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Manual Input Modal */}
        <Dialog open={showManualInput} onOpenChange={setShowManualInput}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[#333333]">Ingresar Código Manual</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-[#333333] mb-2 block">Código de la Caja</label>
                <Input
                  placeholder="BOX-PRM-4567"
                  className="h-14 border-2 border-[#E0E0E0] rounded-xl text-center uppercase"
                  style={{ fontSize: '18px', letterSpacing: '2px' }}
                />
              </div>
              <div className="bg-[#F8F8F8] rounded-xl p-4">
                <p className="text-[#6B6B6B] text-center" style={{ fontSize: '14px' }}>
                  El código debe coincidir con: <br />
                  <span className="text-[#333333]">BOX-PRM-4567</span>
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowManualInput(false)}
                  className="flex-1 h-12 rounded-xl border-2 border-[#E0E0E0]"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    setShowManualInput(false);
                    handleScan('result-success');
                  }}
                  className="flex-1 bg-[#017E49] text-white hover:bg-[#016339] h-12 rounded-xl"
                >
                  Validar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Pantalla 3A: Resultado - Éxito
  if (currentScreen === 'result-success') {
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Success Header */}
          <div className="bg-gradient-to-br from-[#017E49] to-[#016339] rounded-xl p-8 mb-6 text-center shadow-lg">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-[#017E49]" />
            </div>
            <h1 className="text-white mb-2" style={{ fontSize: '28px' }}>
              Caja Validada
            </h1>
            <p className="text-white text-opacity-90" style={{ fontSize: '18px' }}>
              Entregar beneficio al trabajador
            </p>
          </div>

          {/* Delivery Details */}
          <div className="bg-white border-2 border-[#017E49] rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#333333]">Detalles de la Entrega</h3>
              <div className="w-12 h-12 bg-[#017E49] bg-opacity-10 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-[#017E49]" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>Trabajador</p>
                <p className="text-[#333333]">María González Pérez</p>
                <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>12.345.678-9</p>
              </div>
              <div>
                <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>Beneficio</p>
                <p className="text-[#017E49]">Premium</p>
              </div>
              <div>
                <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>Código Caja</p>
                <p className="text-[#333333]">BOX-PRM-4567</p>
              </div>
              <div>
                <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>Ticket</p>
                <p className="text-[#333333]">QR-2025-001234</p>
              </div>
              <div>
                <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>Fecha</p>
                <p className="text-[#333333]">16-Ene-2025</p>
              </div>
              <div>
                <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>Hora</p>
                <p className="text-[#333333]">14:23</p>
              </div>
            </div>
          </div>

          {/* Success Checklist */}
          <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6 mb-6">
            <h3 className="text-[#333333] mb-4">Verificación Completada</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-[#E6F7F0] rounded-xl">
                <CheckCircle className="w-5 h-5 text-[#017E49] flex-shrink-0" />
                <p className="text-[#333333]">Ticket QR validado correctamente</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#E6F7F0] rounded-xl">
                <CheckCircle className="w-5 h-5 text-[#017E49] flex-shrink-0" />
                <p className="text-[#333333]">Caja física coincide con asignación</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#E6F7F0] rounded-xl">
                <CheckCircle className="w-5 h-5 text-[#017E49] flex-shrink-0" />
                <p className="text-[#333333]">Trabajador elegible para retiro</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={() => setCurrentScreen('scan-ticket')}
              className="w-full bg-[#E12019] text-white hover:bg-[#B51810] h-14 rounded-xl"
            >
              <Scan className="w-5 h-5 mr-2" />
              Confirmar Entrega y Escanear Nuevo Ticket
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="border-2 border-[#E0E0E0] h-12 rounded-xl"
              >
                <FileText className="w-5 h-5 mr-2" />
                Imprimir Comprobante
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentScreen('scan-ticket')}
                className="border-2 border-[#E0E0E0] h-12 rounded-xl"
              >
                Finalizar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla 3B: Resultado - Error
  if (currentScreen === 'result-error') {
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Error Header */}
          <div className="bg-gradient-to-br from-[#E12019] to-[#B51810] rounded-xl p-8 mb-6 text-center shadow-lg">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-12 h-12 text-[#E12019]" />
            </div>
            <h1 className="text-white mb-2" style={{ fontSize: '28px' }}>
              Caja Incorrecta
            </h1>
            <p className="text-white text-opacity-90" style={{ fontSize: '18px' }}>
              La caja escaneada no coincide con la asignada
            </p>
          </div>

          {/* Error Details */}
          <div className="bg-white border-2 border-[#E12019] rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#333333]">Error de Validación</h3>
              <div className="w-12 h-12 bg-[#E12019] bg-opacity-10 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-[#E12019]" />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#FFE6E6] border-2 border-[#E12019] rounded-xl p-4">
                  <p className="text-[#6B6B6B] mb-2" style={{ fontSize: '14px' }}>Caja Escaneada</p>
                  <p className="text-[#E12019]" style={{ fontSize: '18px', fontWeight: 700 }}>
                    BOX-STD-3421
                  </p>
                  <p className="text-[#E12019] mt-2" style={{ fontSize: '14px' }}>
                    ✗ No coincide
                  </p>
                </div>
                <div className="bg-[#E6F7F0] border-2 border-[#017E49] rounded-xl p-4">
                  <p className="text-[#6B6B6B] mb-2" style={{ fontSize: '14px' }}>Caja Asignada</p>
                  <p className="text-[#017E49]" style={{ fontSize: '18px', fontWeight: 700 }}>
                    BOX-PRM-4567
                  </p>
                  <p className="text-[#017E49] mt-2" style={{ fontSize: '14px' }}>
                    ✓ Correcta
                  </p>
                </div>
              </div>

              <div className="bg-[#F8F8F8] rounded-xl p-4">
                <p className="text-[#6B6B6B] mb-2" style={{ fontSize: '14px' }}>Trabajador</p>
                <p className="text-[#333333]">María González Pérez</p>
                <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>12.345.678-9</p>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          <div className="bg-[#FFE6E6] border-2 border-[#E12019] rounded-xl p-6 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="w-6 h-6 text-[#E12019] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[#333333] mb-2">Posibles Causas</p>
                <ul className="text-[#6B6B6B] space-y-2" style={{ fontSize: '14px' }}>
                  <li>• La caja escaneada corresponde a otro tipo de beneficio (Estándar vs Premium)</li>
                  <li>• Error en la asignación de la caja al ticket</li>
                  <li>• Caja tomada por error del stock incorrecto</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={() => setCurrentScreen('validate-box')}
              className="w-full bg-[#FF9F55] text-white hover:bg-[#E68A3F] h-14 rounded-xl"
            >
              <Scan className="w-5 h-5 mr-2" />
              Escanear Otra Caja
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="border-2 border-[#017E49] text-[#017E49] hover:bg-[#E6F7F0] h-12 rounded-xl"
              >
                <Package className="w-5 h-5 mr-2" />
                Ver Caja Asignada
              </Button>
              <Button
                variant="outline"
                className="border-2 border-[#E12019] text-[#E12019] hover:bg-[#FFE6E6] h-12 rounded-xl"
              >
                <FileText className="w-5 h-5 mr-2" />
                Reportar Incidencia
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => setCurrentScreen('scan-ticket')}
              className="w-full border-2 border-[#E0E0E0] h-12 rounded-xl"
            >
              Cancelar y Volver al Inicio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
