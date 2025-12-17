import { useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Search, Filter } from 'lucide-react';
import { formatRutOnType } from '@/utils/rut';
import { useGuardiaIncidents } from '@/hooks/useGuardiaIncidents';

type IncidentFormData = {
    trabajador_rut: string;
    tipo: string;
    descripcion: string;
};

export function GuardiaIncidentsTab() {
    const {
        incidents,
        loading,
        error,
        filter,
        applyFilter,
        createIncident,
        resolveIncident,
        changeState,
        refresh,
    } = useGuardiaIncidents(true, 30000);

    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<IncidentFormData>({
        trabajador_rut: '',
        tipo: 'tecnica',
        descripcion: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await createIncident({
                ...formData,
                trabajador_rut: formData.trabajador_rut || undefined,
                origen: 'guardia',
            });
            setFormData({ trabajador_rut: '', tipo: 'tecnica', descripcion: '' });
            setShowForm(false);
        } catch (err) {
            console.error('Error creando incidencia:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleResolve = async (codigo: string) => {
        try {
            await resolveIncident(codigo, 'Resuelto desde guardia');
        } catch (err) {
            console.error('Error resolviendo incidencia:', err);
        }
    };

    const handleChangeState = async (codigo: string, newState: any) => {
        try {
            await changeState(codigo, newState);
        } catch (err) {
            console.error('Error cambiando estado:', err);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header con acciones */}
            <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-[#333333] mb-2">
                            Gestión de Incidencias
                        </h2>
                        <p className="text-[#6B6B6B] text-sm md:text-base">
                            Reporta y gestiona incidencias operacionales
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="px-4 py-2 bg-white border-2 border-[#E0E0E0] text-[#333333] rounded-lg hover:bg-[#F8F8F8] transition-colors flex items-center gap-2"
                        >
                            <Filter className="w-4 h-4" />
                            Filtros
                        </button>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="px-4 py-2 bg-[#E12019] text-white rounded-lg hover:bg-[#B51810] transition-colors font-semibold"
                        >
                            Nueva Incidencia
                        </button>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            {showFilters && (
                <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-base font-semibold text-[#333333] mb-2">
                                Estado
                            </label>
                            <select
                                value={filter.estado || ''}
                                onChange={(e) => applyFilter({ ...filter, estado: e.target.value as any || undefined })}
                                className="w-full px-3 py-2 border-2 border-[#E0E0E0] rounded-lg focus:border-[#E12019] focus:outline-none"
                            >
                                <option value="">Todos</option>
                                <option value="pendiente">Pendiente</option>
                                <option value="en_proceso">En Proceso</option>
                                <option value="resuelta">Resuelta</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#333333] mb-2">
                                Tipo
                            </label>
                            <select
                                value={filter.tipo || ''}
                                onChange={(e) => applyFilter({ ...filter, tipo: e.target.value as any || undefined })}
                                className="w-full px-3 py-2 border-2 border-[#E0E0E0] rounded-lg focus:border-[#E12019] focus:outline-none"
                            >
                                <option value="">Todos</option>
                                <option value="tecnica">Técnica</option>
                                <option value="operacional">Operacional</option>
                                <option value="usuario">Usuario</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-base font-semibold text-[#333333] mb-2">
                                RUT Trabajador
                            </label>
                            <input
                                type="text"
                                value={filter.trabajador_rut || ''}
                                onChange={(e) => applyFilter({ ...filter, trabajador_rut: formatRutOnType(e.target.value) || undefined })}
                                placeholder="12345678-9"
                                className="w-full px-3 py-2 border-2 border-[#E0E0E0] rounded-lg focus:border-[#E12019] focus:outline-none"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Formulario de nueva incidencia */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
                    <h3 className="text-lg font-bold text-[#333333] mb-4">Nueva Incidencia</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[#333333] mb-2">
                                RUT Trabajador (opcional)
                            </label>
                            <input
                                type="text"
                                value={formData.trabajador_rut}
                                onChange={(e) => setFormData({ ...formData, trabajador_rut: formatRutOnType(e.target.value) })}
                                placeholder="12345678-9"
                                className="w-full px-3 py-2 border-2 border-[#E0E0E0] rounded-lg focus:border-[#E12019] focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#333333] mb-2">
                                Tipo
                            </label>
                            <select
                                value={formData.tipo}
                                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                className="w-full px-3 py-2 border-2 border-[#E0E0E0] rounded-lg focus:border-[#E12019] focus:outline-none"
                            >
                                <option value="tecnica">Técnica</option>
                                <option value="operacional">Operacional</option>
                                <option value="usuario">Usuario</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-base font-semibold text-[#333333] mb-2">
                                Descripción
                            </label>
                            <textarea
                                value={formData.descripcion}
                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                placeholder="Describe el problema..."
                                rows={4}
                                className="w-full px-3 py-2 border-2 border-[#E0E0E0] rounded-lg focus:border-[#E12019] focus:outline-none resize-none"
                                required
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 px-6 py-3 bg-[#E12019] text-white rounded-lg hover:bg-[#B51810] transition-colors font-semibold disabled:opacity-50"
                        >
                            {submitting ? 'Creando...' : 'Crear Incidencia'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="px-6 py-3 bg-white border-2 border-[#E0E0E0] text-[#333333] rounded-lg hover:bg-[#F8F8F8] transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {/* Lista de incidencias */}
            <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-[#333333]">
                        Incidencias ({incidents.length})
                    </h3>
                    <button
                        onClick={() => refresh()}
                        disabled={loading}
                        className="px-3 py-1 text-sm text-[#E12019] hover:bg-[#FFE5E5] rounded-lg transition-colors"
                    >
                        {loading ? 'Actualizando...' : 'Actualizar'}
                    </button>
                </div>

                {loading && incidents.length === 0 && (
                    <div className="text-center py-12 text-[#6B6B6B]">
                        Cargando incidencias...
                    </div>
                )}

                {error && (
                    <div className="bg-[#FFE5E5] border-2 border-[#E12019] rounded-lg p-4 text-[#E12019] text-sm">
                        {error}
                    </div>
                )}

                {!loading && incidents.length === 0 && !error && (
                    <div className="text-center py-12 text-[#6B6B6B]">
                        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        No hay incidencias registradas
                    </div>
                )}

                <div className="space-y-3">
                    {incidents.map((inc) => (
                        <div
                            key={inc.codigo}
                            className="border-2 border-[#E0E0E0] rounded-lg p-4 hover:border-[#E12019] transition-colors"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-sm font-mono text-[#E12019]">{inc.codigo}</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getEstadoBadge(inc.estado)}`}>
                                            {inc.estado?.toUpperCase()}
                                        </span>
                                        <span className="text-xs text-[#6B6B6B]">{inc.tipo}</span>
                                    </div>
                                    <p className="text-[#333333] text-sm mb-2">{inc.descripcion}</p>
                                    {inc.trabajador && typeof inc.trabajador === 'object' && (
                                        <p className="text-xs text-[#6B6B6B]">
                                            Trabajador: {(inc.trabajador as any).nombre} ({(inc.trabajador as any).rut})
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    {inc.estado === 'pendiente' && (
                                        <button
                                            onClick={() => handleChangeState(inc.codigo!, 'en_proceso')}
                                            className="px-3 py-1 text-xs bg-[#FF9F55] text-white rounded hover:bg-[#E68843] transition-colors"
                                        >
                                            En Proceso
                                        </button>
                                    )}
                                    {inc.estado === 'en_proceso' && (
                                        <button
                                            onClick={() => handleResolve(inc.codigo!)}
                                            className="px-3 py-1 text-xs bg-[#017E49] text-white rounded hover:bg-[#015A34] transition-colors"
                                        >
                                            Resolver
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function getEstadoBadge(estado: string): string {
    switch (estado) {
        case 'pendiente':
            return 'bg-[#FF9F55] text-white';
        case 'en_proceso':
            return 'bg-[#FFE5E5] text-[#E12019]';
        case 'resuelta':
            return 'bg-[#017E49] text-white';
        default:
            return 'bg-[#E0E0E0] text-[#6B6B6B]';
    }
}
