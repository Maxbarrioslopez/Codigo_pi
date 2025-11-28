import { useState } from 'react';
import { Upload, FileText, Download, History, AlertCircle, CheckCircle, XCircle, ArrowUp, ArrowDown, UserPlus, UserMinus, Edit } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const payrollHistory = [
  {
    id: 1,
    uploadDate: '2025-01-01 10:00',
    cycle: 'CYCLE-2025-01',
    fileName: 'nomina_enero_2025.xlsx',
    totalRecords: 245,
    added: 12,
    removed: 5,
    updated: 8,
    status: 'Procesado',
    uploadedBy: 'Laura Méndez',
  },
  {
    id: 2,
    uploadDate: '2024-11-01 09:30',
    cycle: 'CYCLE-2024-06',
    fileName: 'nomina_noviembre_2024.xlsx',
    totalRecords: 238,
    added: 10,
    removed: 3,
    updated: 5,
    status: 'Procesado',
    uploadedBy: 'Carlos Ruiz',
  },
  {
    id: 3,
    uploadDate: '2024-09-01 11:15',
    cycle: 'CYCLE-2024-05',
    fileName: 'nomina_septiembre_2024.xlsx',
    totalRecords: 230,
    added: 8,
    removed: 2,
    updated: 12,
    status: 'Procesado',
    uploadedBy: 'Laura Méndez',
  },
];

const mockComparison = {
  added: [
    { rut: '12.345.678-9', name: 'María González Pérez', section: 'Producción', contract: 'Indefinido', benefit: 'Premium' },
    { rut: '23.456.789-0', name: 'Carlos Rodríguez Silva', section: 'Logística', contract: 'Plazo fijo', benefit: 'Estándar' },
  ],
  removed: [
    { rut: '34.567.890-1', name: 'Pedro Martínez López', section: 'Administración', contract: 'Indefinido', benefit: 'Premium', reason: 'Término de contrato' },
  ],
  updated: [
    { 
      rut: '45.678.901-2', 
      name: 'Ana Torres Silva', 
      section: 'Producción', 
      changes: [
        { field: 'Contrato', old: 'Plazo fijo', new: 'Indefinido' },
        { field: 'Beneficio', old: 'Estándar', new: 'Premium' },
      ]
    },
  ],
};

export function NominaModule() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [uploadStep, setUploadStep] = useState<'upload' | 'preview' | 'processing' | 'complete'>('upload');
  const [uploadProgress, setUploadProgress] = useState(0);

  const getStatusBadge = (status: string) => {
    const styles = {
      'Procesado': 'bg-[#017E49] text-white',
      'Procesando': 'bg-[#FF9F55] text-white',
      'Error': 'bg-[#E12019] text-white',
    };
    return styles[status as keyof typeof styles] || 'bg-[#6B6B6B] text-white';
  };

  const handleUpload = () => {
    setUploadStep('processing');
    setUploadProgress(0);
    
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploadStep('complete');
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[#333333] mb-2">Gestión de Nómina Cíclica</h2>
            <p className="text-[#6B6B6B]">
              Carga de nómina con asignación automática de beneficios por ciclo
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowComparisonModal(true)}
              variant="outline"
              className="border-2 border-[#E0E0E0] h-11 px-6 rounded-xl"
            >
              <FileText className="w-4 h-4 mr-2" />
              Ver Comparación
            </Button>
            <Button
              onClick={() => setShowUploadModal(true)}
              className="bg-[#E12019] text-white hover:bg-[#B51810] h-11 px-6 rounded-xl"
            >
              <Upload className="w-4 h-4 mr-2" />
              Cargar Nómina
            </Button>
          </div>
        </div>
      </div>

      {/* Current Payroll Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Total Trabajadores</p>
            <FileText className="w-5 h-5 text-[#6B6B6B]" />
          </div>
          <p className="text-[#333333]" style={{ fontSize: '24px', fontWeight: 500 }}>245</p>
          <p className="text-[#017E49]" style={{ fontSize: '12px' }}>
            +12 desde última carga
          </p>
        </div>
        <div className="bg-white border-2 border-[#017E49] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Con Beneficio</p>
            <CheckCircle className="w-5 h-5 text-[#017E49]" />
          </div>
          <p className="text-[#017E49]" style={{ fontSize: '24px', fontWeight: 500 }}>231</p>
          <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>
            94.3% del total
          </p>
        </div>
        <div className="bg-white border-2 border-[#FF9F55] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Sin Beneficio</p>
            <XCircle className="w-5 h-5 text-[#FF9F55]" />
          </div>
          <p className="text-[#FF9F55]" style={{ fontSize: '24px', fontWeight: 500 }}>14</p>
          <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>
            5.7% del total
          </p>
        </div>
        <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Última Carga</p>
            <History className="w-5 h-5 text-[#6B6B6B]" />
          </div>
          <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>01-Ene-2025</p>
          <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>
            CYCLE-2025-01
          </p>
        </div>
      </div>

      {/* Payroll History */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <History className="w-6 h-6 text-[#E12019]" />
          <h3 className="text-[#333333]">Historial de Cargas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F8F8F8] border-b-2 border-[#E0E0E0]">
                <th className="text-left p-4 text-[#333333]">Fecha de Carga</th>
                <th className="text-left p-4 text-[#333333]">Ciclo</th>
                <th className="text-left p-4 text-[#333333]">Archivo</th>
                <th className="text-left p-4 text-[#333333]">Total Registros</th>
                <th className="text-left p-4 text-[#333333]">Agregados</th>
                <th className="text-left p-4 text-[#333333]">Removidos</th>
                <th className="text-left p-4 text-[#333333]">Actualizados</th>
                <th className="text-left p-4 text-[#333333]">Cargado por</th>
                <th className="text-left p-4 text-[#333333]">Estado</th>
                <th className="text-left p-4 text-[#333333]">Acción</th>
              </tr>
            </thead>
            <tbody>
              {payrollHistory.map((record) => (
                <tr key={record.id} className="border-b border-[#E0E0E0] hover:bg-[#F8F8F8]">
                  <td className="p-4 text-[#333333]">{record.uploadDate}</td>
                  <td className="p-4 text-[#6B6B6B]">{record.cycle}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#6B6B6B]" />
                      <span className="text-[#333333]">{record.fileName}</span>
                    </div>
                  </td>
                  <td className="p-4 text-[#333333]">{record.totalRecords}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <ArrowUp className="w-3 h-3 text-[#017E49]" />
                      <span className="text-[#017E49]">{record.added}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <ArrowDown className="w-3 h-3 text-[#E12019]" />
                      <span className="text-[#E12019]">{record.removed}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <Edit className="w-3 h-3 text-[#FF9F55]" />
                      <span className="text-[#FF9F55]">{record.updated}</span>
                    </div>
                  </td>
                  <td className="p-4 text-[#6B6B6B]">{record.uploadedBy}</td>
                  <td className="p-4">
                    <Badge className={getStatusBadge(record.status)}>
                      {record.status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 px-3 rounded-lg border-2 border-[#E0E0E0]"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#333333]">Cargar Nueva Nómina</DialogTitle>
          </DialogHeader>

          {uploadStep === 'upload' && (
            <div className="space-y-4">
              <div className="bg-[#F8F8F8] border-2 border-dashed border-[#E0E0E0] rounded-xl p-8 text-center">
                <Upload className="w-12 h-12 text-[#6B6B6B] mx-auto mb-4" />
                <p className="text-[#333333] mb-2">Arrastra el archivo Excel o CSV aquí</p>
                <p className="text-[#6B6B6B] mb-4" style={{ fontSize: '14px' }}>
                  o haz clic para seleccionar
                </p>
                <Button
                  className="bg-[#E12019] text-white hover:bg-[#B51810] h-11 px-6 rounded-xl"
                  onClick={() => setUploadStep('preview')}
                >
                  Seleccionar Archivo
                </Button>
              </div>

              <div className="bg-[#FFF4E6] border-2 border-[#FF9F55] rounded-xl p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-[#FF9F55] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[#333333] mb-1">Formato requerido</p>
                    <ul className="text-[#6B6B6B] space-y-1" style={{ fontSize: '14px' }}>
                      <li>• Columnas: RUT, Nombre, Sección, Tipo Contrato, Sucursal</li>
                      <li>• Formatos: .xlsx, .xls, .csv</li>
                      <li>• Tamaño máximo: 10MB</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full h-11 border-2 border-[#E0E0E0] rounded-xl"
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar Plantilla Excel
              </Button>
            </div>
          )}

          {uploadStep === 'preview' && (
            <div className="space-y-4">
              <div className="bg-[#F8F8F8] rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-[#E12019]" />
                    <div>
                      <p className="text-[#333333]">nomina_enero_2025.xlsx</p>
                      <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>2.4 MB • 245 registros</p>
                    </div>
                  </div>
                  <CheckCircle className="w-6 h-6 text-[#017E49]" />
                </div>
              </div>

              <div className="border-2 border-[#E0E0E0] rounded-xl p-4">
                <h4 className="text-[#333333] mb-3">Vista Previa (primeros 5 registros)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#F8F8F8]">
                        <th className="text-left p-2 text-[#333333]">RUT</th>
                        <th className="text-left p-2 text-[#333333]">Nombre</th>
                        <th className="text-left p-2 text-[#333333]">Sección</th>
                        <th className="text-left p-2 text-[#333333]">Contrato</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-[#E0E0E0]">
                        <td className="p-2 text-[#6B6B6B]">12.345.678-9</td>
                        <td className="p-2 text-[#6B6B6B]">María González</td>
                        <td className="p-2 text-[#6B6B6B]">Producción</td>
                        <td className="p-2 text-[#6B6B6B]">Indefinido</td>
                      </tr>
                      <tr className="border-b border-[#E0E0E0]">
                        <td className="p-2 text-[#6B6B6B]">23.456.789-0</td>
                        <td className="p-2 text-[#6B6B6B]">Carlos Rodríguez</td>
                        <td className="p-2 text-[#6B6B6B]">Logística</td>
                        <td className="p-2 text-[#6B6B6B]">Plazo fijo</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setUploadStep('upload')}
                  className="h-11 px-6 rounded-xl border-2 border-[#E0E0E0]"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpload}
                  className="bg-[#E12019] text-white hover:bg-[#B51810] h-11 px-6 rounded-xl"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Procesar Nómina
                </Button>
              </div>
            </div>
          )}

          {uploadStep === 'processing' && (
            <div className="space-y-4 py-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#E12019] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-[#333333] mb-2">Procesando Nómina</h3>
                <p className="text-[#6B6B6B]">Validando registros y asignando beneficios...</p>
              </div>
              <Progress value={uploadProgress} className="h-3" />
              <p className="text-center text-[#333333]">{uploadProgress}%</p>
            </div>
          )}

          {uploadStep === 'complete' && (
            <div className="space-y-4 py-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#017E49] rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-[#333333] mb-2">Nómina Procesada Exitosamente</h3>
                <p className="text-[#6B6B6B]">245 registros procesados correctamente</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#F8F8F8] rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <UserPlus className="w-4 h-4 text-[#017E49]" />
                    <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Agregados</p>
                  </div>
                  <p className="text-[#017E49]" style={{ fontSize: '24px', fontWeight: 500 }}>12</p>
                </div>
                <div className="bg-[#F8F8F8] rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <UserMinus className="w-4 h-4 text-[#E12019]" />
                    <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Removidos</p>
                  </div>
                  <p className="text-[#E12019]" style={{ fontSize: '24px', fontWeight: 500 }}>5</p>
                </div>
                <div className="bg-[#F8F8F8] rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Edit className="w-4 h-4 text-[#FF9F55]" />
                    <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Actualizados</p>
                  </div>
                  <p className="text-[#FF9F55]" style={{ fontSize: '24px', fontWeight: 500 }}>8</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowComparisonModal(true)}
                  className="h-11 px-6 rounded-xl border-2 border-[#E0E0E0]"
                >
                  Ver Comparación
                </Button>
                <Button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadStep('upload');
                    setUploadProgress(0);
                  }}
                  className="bg-[#017E49] text-white hover:bg-[#016339] h-11 px-6 rounded-xl"
                >
                  Finalizar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Comparison Modal */}
      <Dialog open={showComparisonModal} onOpenChange={setShowComparisonModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#333333]">Comparación de Nómina</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="added" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="added">
                Agregados ({mockComparison.added.length})
              </TabsTrigger>
              <TabsTrigger value="removed">
                Removidos ({mockComparison.removed.length})
              </TabsTrigger>
              <TabsTrigger value="updated">
                Actualizados ({mockComparison.updated.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="added" className="space-y-3">
              {mockComparison.added.map((worker, index) => (
                <div key={index} className="bg-[#E6F7F0] border-2 border-[#017E49] rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <UserPlus className="w-5 h-5 text-[#017E49] flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-[#333333]">{worker.name}</p>
                          <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>{worker.rut}</p>
                        </div>
                        <Badge className="bg-[#017E49] text-white">NUEVO</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-3">
                        <div>
                          <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>Sección</p>
                          <p className="text-[#333333]" style={{ fontSize: '14px' }}>{worker.section}</p>
                        </div>
                        <div>
                          <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>Contrato</p>
                          <p className="text-[#333333]" style={{ fontSize: '14px' }}>{worker.contract}</p>
                        </div>
                        <div>
                          <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>Beneficio</p>
                          <p className="text-[#017E49]" style={{ fontSize: '14px' }}>{worker.benefit}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="removed" className="space-y-3">
              {mockComparison.removed.map((worker, index) => (
                <div key={index} className="bg-[#FFE6E6] border-2 border-[#E12019] rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <UserMinus className="w-5 h-5 text-[#E12019] flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-[#333333]">{worker.name}</p>
                          <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>{worker.rut}</p>
                        </div>
                        <Badge className="bg-[#E12019] text-white">REMOVIDO</Badge>
                      </div>
                      <p className="text-[#6B6B6B] mt-2" style={{ fontSize: '14px' }}>
                        Motivo: {worker.reason}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="updated" className="space-y-3">
              {mockComparison.updated.map((worker, index) => (
                <div key={index} className="bg-[#FFF4E6] border-2 border-[#FF9F55] rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Edit className="w-5 h-5 text-[#FF9F55] flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-[#333333]">{worker.name}</p>
                          <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>{worker.rut}</p>
                        </div>
                        <Badge className="bg-[#FF9F55] text-white">ACTUALIZADO</Badge>
                      </div>
                      <div className="space-y-2">
                        {worker.changes.map((change, idx) => (
                          <div key={idx} className="flex items-center gap-3 text-sm">
                            <span className="text-[#6B6B6B]">{change.field}:</span>
                            <span className="text-[#E12019] line-through">{change.old}</span>
                            <span className="text-[#6B6B6B]">→</span>
                            <span className="text-[#017E49]">{change.new}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end pt-4">
            <Button
              onClick={() => setShowComparisonModal(false)}
              className="bg-[#E12019] text-white hover:bg-[#B51810] h-11 px-6 rounded-xl"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
