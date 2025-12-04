import { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, Tag } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { cajasService, CajaBeneficioDTO } from '@/services/cajas.service';
import { cicloService } from '@/services/ciclo.service';
import { TipoBeneficioDTO } from '@/types';
import { toast } from 'sonner';

export function GestionCajasModule() {
    const [cajas, setCajas] = useState<CajaBeneficioDTO[]>([]);
    const [beneficios, setBeneficios] = useState<TipoBeneficioDTO[]>([]);
    const [loading, setLoading] = useState(true);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedCaja, setSelectedCaja] = useState<CajaBeneficioDTO | null>(null);
    const [selectedBeneficioId, setSelectedBeneficioId] = useState<number | null>(null);

    const [cajaForm, setCajaForm] = useState({
        beneficio: 0,
        nombre: '',
        descripcion: '',
        codigo_tipo: '',
        activo: true,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [cajasData, beneficiosData] = await Promise.all([
                cajasService.getCajasBeneficio(),
                cicloService.getAllTipos(),
            ]);
            setCajas(cajasData);
            setBeneficios(beneficiosData);
        } catch (error) {
            toast.error('Error al cargar datos');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCaja = async () => {
        if (!cajaForm.beneficio || !cajaForm.nombre || !cajaForm.codigo_tipo) {
            toast.error('Completa todos los campos requeridos');
            return;
        }
        try {
            await cajasService.createCajaBeneficio(cajaForm);
            toast.success('Caja creada exitosamente');
            setShowCreateModal(false);
            resetForm();
            loadData();
        } catch (error) {
            toast.error('Error al crear caja');
            console.error(error);
        }
    };

    const handleUpdateCaja = async () => {
        if (!selectedCaja || !cajaForm.nombre || !cajaForm.codigo_tipo) {
            toast.error('Completa los campos requeridos');
            return;
        }
        try {
            await cajasService.updateCajaBeneficio(selectedCaja.id, cajaForm);
            toast.success('Caja actualizada exitosamente');
            setShowEditModal(false);
            setSelectedCaja(null);
            resetForm();
            loadData();
        } catch (error) {
            toast.error('Error al actualizar caja');
            console.error(error);
        }
    };

    const handleDeleteCaja = async (cajaId: number) => {
        if (!confirm('¿Estás seguro de desactivar esta caja?')) return;
        try {
            await cajasService.deleteCajaBeneficio(cajaId);
            toast.success('Caja desactivada');
            loadData();
        } catch (error) {
            toast.error('Error al desactivar caja');
            console.error(error);
        }
    };

    const openEditModal = (caja: CajaBeneficioDTO) => {
        setSelectedCaja(caja);
        setCajaForm({
            beneficio: caja.beneficio,
            nombre: caja.nombre,
            descripcion: caja.descripcion,
            codigo_tipo: caja.codigo_tipo,
            activo: caja.activo,
        });
        setShowEditModal(true);
    };

    const resetForm = () => {
        setCajaForm({
            beneficio: 0,
            nombre: '',
            descripcion: '',
            codigo_tipo: '',
            activo: true,
        });
    };

    const cajasFiltradas = selectedBeneficioId
        ? cajas.filter(c => c.beneficio === selectedBeneficioId)
        : cajas;

    const getBeneficioNombre = (beneficioId: number) => {
        return beneficios.find(b => b.id === beneficioId)?.nombre || 'Desconocido';
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64">Cargando...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Package className="w-6 h-6" />
                        Gestión de Cajas por Beneficio
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Crea y administra variantes de cajas para cada tipo de beneficio
                    </p>
                </div>
                <Button
                    onClick={() => {
                        resetForm();
                        setShowCreateModal(true);
                    }}
                    className="bg-[#017E49] text-white hover:bg-[#016339]"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Caja
                </Button>
            </div>

            {/* Filtro por Beneficio */}
            <div className="bg-white p-4 rounded-lg border">
                <Label htmlFor="filtro-beneficio">Filtrar por Beneficio</Label>
                <Select
                    value={selectedBeneficioId?.toString() || 'todos'}
                    onValueChange={(value) => setSelectedBeneficioId(value === 'todos' ? null : parseInt(value))}
                >
                    <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Todos los beneficios" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todos">Todos los beneficios</SelectItem>
                        {beneficios.map((beneficio) => (
                            <SelectItem key={beneficio.id} value={beneficio.id.toString()}>
                                {beneficio.nombre}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Lista de Cajas */}
            <div className="space-y-3">
                {cajasFiltradas.length === 0 ? (
                    <div className="bg-gray-50 p-8 rounded-lg text-center">
                        <Package className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                        <p className="text-gray-600">No hay cajas creadas aún</p>
                        <p className="text-sm text-gray-500 mt-1">Crea tu primera caja para empezar</p>
                    </div>
                ) : (
                    cajasFiltradas.map((caja) => (
                        <div
                            key={caja.id}
                            className="bg-white p-4 rounded-lg border hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold text-gray-900">{caja.nombre}</h3>
                                        <Badge variant={caja.activo ? 'default' : 'secondary'}>
                                            {caja.activo ? 'Activa' : 'Inactiva'}
                                        </Badge>
                                        <Badge variant="outline" className="flex items-center gap-1">
                                            <Tag className="w-3 h-3" />
                                            {caja.codigo_tipo}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">{getBeneficioNombre(caja.beneficio)}</p>
                                    {caja.descripcion && (
                                        <p className="text-sm text-gray-500">{caja.descripcion}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openEditModal(caja)}
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteCaja(caja.id)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal Crear */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Crear Nueva Caja</DialogTitle>
                        <DialogDescription>
                            Define una variante de caja para un beneficio (ej: Premium, Estándar)
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="create-beneficio">Beneficio *</Label>
                            <Select
                                value={cajaForm.beneficio.toString()}
                                onValueChange={(value) => setCajaForm({ ...cajaForm, beneficio: parseInt(value) })}
                            >
                                <SelectTrigger className="mt-2">
                                    <SelectValue placeholder="Selecciona un beneficio" />
                                </SelectTrigger>
                                <SelectContent>
                                    {beneficios.map((beneficio) => (
                                        <SelectItem key={beneficio.id} value={beneficio.id.toString()}>
                                            {beneficio.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="create-nombre">Nombre de la Caja *</Label>
                            <Input
                                id="create-nombre"
                                placeholder="ej: Premium, Estándar, VIP"
                                value={cajaForm.nombre}
                                onChange={(e) => setCajaForm({ ...cajaForm, nombre: e.target.value })}
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <Label htmlFor="create-codigo">Código Tipo *</Label>
                            <Input
                                id="create-codigo"
                                placeholder="ej: NAV-PREM, NAV-STD"
                                value={cajaForm.codigo_tipo}
                                onChange={(e) => setCajaForm({ ...cajaForm, codigo_tipo: e.target.value.toUpperCase() })}
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <Label htmlFor="create-desc">Descripción</Label>
                            <Textarea
                                id="create-desc"
                                placeholder="Describe esta caja..."
                                value={cajaForm.descripcion}
                                onChange={(e) => setCajaForm({ ...cajaForm, descripcion: e.target.value })}
                                className="mt-2"
                                rows={3}
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
                            Cancelar
                        </Button>
                        <Button onClick={handleCreateCaja} className="flex-1 bg-[#017E49] text-white hover:bg-[#016339]">
                            Crear Caja
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal Editar */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Editar Caja</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="edit-beneficio">Beneficio *</Label>
                            <Select
                                value={cajaForm.beneficio.toString()}
                                onValueChange={(value) => setCajaForm({ ...cajaForm, beneficio: parseInt(value) })}
                            >
                                <SelectTrigger className="mt-2">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {beneficios.map((beneficio) => (
                                        <SelectItem key={beneficio.id} value={beneficio.id.toString()}>
                                            {beneficio.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="edit-nombre">Nombre de la Caja *</Label>
                            <Input
                                id="edit-nombre"
                                value={cajaForm.nombre}
                                onChange={(e) => setCajaForm({ ...cajaForm, nombre: e.target.value })}
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-codigo">Código Tipo *</Label>
                            <Input
                                id="edit-codigo"
                                value={cajaForm.codigo_tipo}
                                onChange={(e) => setCajaForm({ ...cajaForm, codigo_tipo: e.target.value.toUpperCase() })}
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-desc">Descripción</Label>
                            <Textarea
                                id="edit-desc"
                                value={cajaForm.descripcion}
                                onChange={(e) => setCajaForm({ ...cajaForm, descripcion: e.target.value })}
                                className="mt-2"
                                rows={3}
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowEditModal(false);
                                setSelectedCaja(null);
                            }}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button onClick={handleUpdateCaja} className="flex-1 bg-[#E12019] text-white hover:bg-[#B51810]">
                            Guardar Cambios
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
