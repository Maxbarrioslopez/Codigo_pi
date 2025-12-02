import { useState, useEffect } from 'react';
import { Package, Plus, Download, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { stockService } from '../services/stock.service';
import { showSuccess, showError } from '../utils/toast';

export function StockModule() {
    const [resumen, setResumen] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showMovimiento, setShowMovimiento] = useState(false);
    const [tipoMovimiento, setTipoMovimiento] = useState('entrada');
    const [cantidad, setCantidad] = useState('');
    const [tipo, setTipo] = useState('');

    useEffect(() => {
        loadResumen();
    }, []);

    const loadResumen = async () => {
        try {
            setLoading(true);
            const data = await stockService.getResumen();
            setResumen(data);
        } catch (error) {
            showError('Error', 'No se pudo cargar el resumen de stock');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRegistrarMovimiento = async () => {
        if (!tipo || !cantidad) {
            showError('Validación', 'Todos los campos son requeridos');
            return;
        }

        try {
            await stockService.registrarMovimiento({
                tipo: tipoMovimiento,
                cantidad: parseInt(cantidad),
                tipo_beneficio: tipo,
            });
            showSuccess('Éxito', 'Movimiento registrado correctamente');
            setShowMovimiento(false);
            setCantidad('');
            setTipo('');
            await loadResumen();
        } catch (error) {
            showError('Error', 'No se pudo registrar el movimiento');
            console.error(error);
        }
    };

    if (loading) {
        return <div className="text-center py-12">Cargando stock...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-[#333333] mb-2">Gestión de Stock</h2>
                        <p className="text-[#6B6B6B]">Control de inventario de beneficios</p>
                    </div>
                    <Button
                        onClick={() => setShowMovimiento(true)}
                        className="bg-[#E12019] text-white hover:bg-[#B51810] h-11 px-6 rounded-xl"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Registrar Movimiento
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#F8F8F8] rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Total Cajas</p>
                            <Package className="w-5 h-5 text-[#017E49]" />
                        </div>
                        <p className="text-[#333333]" style={{ fontSize: '24px', fontWeight: 500 }}>
                            {resumen?.total_cajas || 0}
                        </p>
                    </div>
                    <div className="bg-[#FFF4E6] rounded-xl p-4 border-2 border-[#FF9F55]">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Stock Bajo</p>
                            <AlertTriangle className="w-5 h-5 text-[#FF9F55]" />
                        </div>
                        <p className="text-[#FF9F55]" style={{ fontSize: '24px', fontWeight: 500 }}>
                            {resumen?.stock_bajo || 0}
                        </p>
                    </div>
                    <div className="bg-[#E7F8F3] rounded-xl p-4 border-2 border-[#017E49]">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Tipos Disponibles</p>
                            <CheckCircle className="w-5 h-5 text-[#017E49]" />
                        </div>
                        <p className="text-[#017E49]" style={{ fontSize: '24px', fontWeight: 500 }}>
                            {resumen?.por_tipo?.length || 0}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stock por Tipo */}
            <div className="bg-white border-2 border-[#E0E0E0] rounded-xl overflow-hidden">
                <div className="p-6 border-b-2 border-[#E0E0E0]">
                    <h3 className="text-[#333333]">Stock por Tipo de Beneficio</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[#F8F8F8] border-b-2 border-[#E0E0E0]">
                                <th className="text-left p-4 text-[#333333]">Tipo</th>
                                <th className="text-left p-4 text-[#333333]">Cantidad</th>
                                <th className="text-left p-4 text-[#333333]">Mínimo Alerta</th>
                                <th className="text-left p-4 text-[#333333]">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {resumen?.por_tipo?.map((item: any, idx: number) => (
                                <tr key={idx} className="border-b border-[#E0E0E0] hover:bg-[#F8F8F8]">
                                    <td className="p-4 text-[#333333]">{item.tipo}</td>
                                    <td className="p-4 text-[#6B6B6B]">{item.cantidad} unidades</td>
                                    <td className="p-4 text-[#6B6B6B]">{item.minimo_alerta}</td>
                                    <td className="p-4">
                                        <Badge className={
                                            item.cantidad <= item.minimo_alerta
                                                ? 'bg-[#E12019] text-white'
                                                : 'bg-[#017E49] text-white'
                                        }>
                                            {item.cantidad <= item.minimo_alerta ? 'Bajo' : 'Normal'}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Registrar Movimiento */}
            <Dialog open={showMovimiento} onOpenChange={setShowMovimiento}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-[#333333]">Registrar Movimiento de Stock</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label className="text-[#333333]">Tipo de Movimiento</Label>
                            <Select value={tipoMovimiento} onValueChange={setTipoMovimiento}>
                                <SelectTrigger className="h-11 border-2 border-[#E0E0E0] rounded-xl mt-2">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="entrada">Entrada (Compra)</SelectItem>
                                    <SelectItem value="salida">Salida (Retiro)</SelectItem>
                                    <SelectItem value="ajuste">Ajuste</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-[#333333]">Tipo de Beneficio</Label>
                            <Select value={tipo} onValueChange={setTipo}>
                                <SelectTrigger className="h-11 border-2 border-[#E0E0E0] rounded-xl mt-2">
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Premium">Premium</SelectItem>
                                    <SelectItem value="Estandar">Estándar</SelectItem>
                                    <SelectItem value="Basico">Básico</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="cantidad" className="text-[#333333]">Cantidad</Label>
                            <Input
                                id="cantidad"
                                type="number"
                                min="1"
                                value={cantidad}
                                onChange={(e) => setCantidad(e.target.value)}
                                className="h-11 border-2 border-[#E0E0E0] rounded-xl mt-2"
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setShowMovimiento(false)}
                                className="h-11 px-6 rounded-xl border-2 border-[#E0E0E0]"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleRegistrarMovimiento}
                                className="bg-[#E12019] text-white hover:bg-[#B51810] h-11 px-6 rounded-xl"
                            >
                                Registrar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
