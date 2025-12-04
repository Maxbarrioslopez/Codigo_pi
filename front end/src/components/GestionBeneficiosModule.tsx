import { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { cicloService } from '@/services/ciclo.service';
import { TipoBeneficioDTO } from '@/types';
import { toast } from 'sonner';

export function GestionBeneficiosModule() {
    const [beneficios, setBeneficios] = useState<TipoBeneficioDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedBeneficio, setSelectedBeneficio] = useState<TipoBeneficioDTO | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        activo: true
    });

    useEffect(() => {
        loadBeneficios();
    }, []);

    const loadBeneficios = async () => {
        try {
            setLoading(true);
            const data = await cicloService.getAllTipos();
            setBeneficios(data);
        } catch (error) {
            toast.error('Error al cargar tipos de beneficios');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            await cicloService.createTipo(formData);
            toast.success('Tipo de beneficio creado exitosamente');
            setShowCreateModal(false);
            resetForm();
            loadBeneficios();
        } catch (error) {
            toast.error('Error al crear tipo de beneficio');
            console.error(error);
        }
    };

    const handleUpdate = async () => {
        if (!selectedBeneficio) return;
        try {
            await cicloService.updateTipo(selectedBeneficio.id, formData);
            toast.success('Tipo de beneficio actualizado');
            setShowEditModal(false);
            resetForm();
            loadBeneficios();
        } catch (error) {
            toast.error('Error al actualizar tipo de beneficio');
            console.error(error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar este tipo de beneficio?')) return;
        try {
            await cicloService.deleteTipo(id);
            toast.success('Tipo de beneficio eliminado');
            loadBeneficios();
        } catch (error) {
            toast.error('Error al eliminar. Puede estar en uso en ciclos activos.');
            console.error(error);
        }
    };

    const handleToggleActivo = async (beneficio: TipoBeneficioDTO) => {
        try {
            await cicloService.updateTipo(beneficio.id, { activo: !beneficio.activo });
            toast.success(`Beneficio ${!beneficio.activo ? 'activado' : 'desactivado'}`);
            loadBeneficios();
        } catch (error) {
            toast.error('Error al cambiar estado');
            console.error(error);
        }
    };

    const resetForm = () => {
        setFormData({ nombre: '', descripcion: '', activo: true });
        setSelectedBeneficio(null);
    };

    const openEditModal = (beneficio: TipoBeneficioDTO) => {
        setSelectedBeneficio(beneficio);
        setFormData({
            nombre: beneficio.nombre,
            descripcion: beneficio.descripcion,
            activo: beneficio.activo
        });
        setShowEditModal(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-[#333333] mb-2">Gestión de Tipos de Beneficios</h2>
                        <p className="text-[#6B6B6B]">
                            Configure los beneficios que estarán disponibles en los ciclos
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-[#E12019] text-white hover:bg-[#B51810] h-11 px-6 rounded-xl"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Beneficio
                    </Button>
                </div>
            </div>

            {/* Lista de Beneficios */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-12 text-[#6B6B6B]">
                        Cargando beneficios...
                    </div>
                ) : beneficios.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                        <Package className="w-12 h-12 text-[#6B6B6B] mx-auto mb-4" />
                        <p className="text-[#6B6B6B] mb-4">No hay tipos de beneficios creados</p>
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-[#E12019] text-white hover:bg-[#B51810]"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Crear Primer Beneficio
                        </Button>
                    </div>
                ) : (
                    beneficios.map((beneficio) => (
                        <div
                            key={beneficio.id}
                            className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6 hover:border-[#E12019] transition-colors"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-[#E12019] to-[#B51810] rounded-xl flex items-center justify-center">
                                        <Package className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-[#333333] font-semibold">{beneficio.nombre}</h3>
                                        <Badge className={beneficio.activo ? 'bg-[#017E49] text-white' : 'bg-[#6B6B6B] text-white'}>
                                            {beneficio.activo ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <p className="text-[#6B6B6B] text-sm mb-4 min-h-[40px]">
                                {beneficio.descripcion || 'Sin descripción'}
                            </p>

                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={() => openEditModal(beneficio)}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                >
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Editar
                                </Button>
                                <Button
                                    onClick={() => handleToggleActivo(beneficio)}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                >
                                    {beneficio.activo ? <X className="w-4 h-4 mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                                    {beneficio.activo ? 'Desactivar' : 'Activar'}
                                </Button>
                                <Button
                                    onClick={() => handleDelete(beneficio.id)}
                                    variant="outline"
                                    size="sm"
                                    className="text-[#E12019] hover:bg-[#E12019] hover:text-white"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal Crear */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Crear Nuevo Tipo de Beneficio</DialogTitle>
                        <DialogDescription>
                            Define un nuevo tipo de beneficio que podrá ser asignado a los ciclos
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="nombre">Nombre del Beneficio *</Label>
                            <Input
                                id="nombre"
                                placeholder="ej: Caja de Navidad, Paseo Familiar, Bono Escolar"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <Label htmlFor="descripcion">Descripción</Label>
                            <Textarea
                                id="descripcion"
                                placeholder="Describe brevemente este beneficio..."
                                value={formData.descripcion}
                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                className="mt-2"
                                rows={3}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="activo">Activo</Label>
                            <Switch
                                id="activo"
                                checked={formData.activo}
                                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowCreateModal(false);
                                resetForm();
                            }}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={!formData.nombre.trim()}
                            className="flex-1 bg-[#E12019] text-white hover:bg-[#B51810]"
                        >
                            Crear Beneficio
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal Editar */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Editar Tipo de Beneficio</DialogTitle>
                        <DialogDescription>
                            Modifica la información del beneficio
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="edit-nombre">Nombre del Beneficio *</Label>
                            <Input
                                id="edit-nombre"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-descripcion">Descripción</Label>
                            <Textarea
                                id="edit-descripcion"
                                value={formData.descripcion}
                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                className="mt-2"
                                rows={3}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="edit-activo">Activo</Label>
                            <Switch
                                id="edit-activo"
                                checked={formData.activo}
                                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowEditModal(false);
                                resetForm();
                            }}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleUpdate}
                            disabled={!formData.nombre.trim()}
                            className="flex-1 bg-[#E12019] text-white hover:bg-[#B51810]"
                        >
                            Guardar Cambios
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
