import { BarChart3, Package, TrendingUp, Clock, Users, CheckCircle2 } from 'lucide-react';
import { useMetricasGuardia } from '@/hooks/useMetricasGuardia';

export function GuardiaMetricsTab() {
    const { metricas, loading, error } = useMetricasGuardia(15000);

    if (loading && !metricas) {
        return (
            <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-12 text-center">
                <div className="w-12 h-12 border-4 border-[#E12019] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-[#6B6B6B]">Cargando métricas...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-[#FFE5E5] border-2 border-[#E12019] rounded-xl p-6 text-[#E12019]">
                Error cargando métricas: {error}
            </div>
        );
    }

    if (!metricas) {
        return (
            <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-12 text-center text-[#6B6B6B]">
                No hay métricas disponibles
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-4 md:p-6">
                <h2 className="text-xl md:text-2xl font-bold text-[#333333] mb-2">
                    Métricas y Gestión
                </h2>
                <p className="text-[#6B6B6B] text-sm md:text-base">
                    Monitoreo en tiempo real del sistema
                </p>
            </div>

            {/* Grid de métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Tickets Pendientes */}
                <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <Clock className="w-8 h-8 text-[#FF9F55]" />
                        <span className="text-3xl font-bold text-[#FF9F55]">
                            {metricas.tickets_pendientes || 0}
                        </span>
                    </div>
                    <p className="text-[#333333] font-semibold mb-1">Tickets Pendientes</p>
                    <p className="text-[#6B6B6B] text-xs">Esperando validación</p>
                </div>

                {/* Tickets Entregados Hoy */}
                <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <CheckCircle2 className="w-8 h-8 text-[#017E49]" />
                        <span className="text-3xl font-bold text-[#017E49]">
                            {metricas.entregas_hoy || 0}
                        </span>
                    </div>
                    <p className="text-[#333333] font-semibold mb-1">Entregados Hoy</p>
                    <p className="text-[#6B6B6B] text-xs">Beneficios completados</p>
                </div>

                {/* Stock Disponible */}
                <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <Package className="w-8 h-8 text-[#E12019]" />
                        <span className="text-3xl font-bold text-[#E12019]">
                            {metricas.stock_disponible || 0}
                        </span>
                    </div>
                    <p className="text-[#333333] font-semibold mb-1">Stock Disponible</p>
                    <p className="text-[#6B6B6B] text-xs">Cajas en inventario</p>
                </div>

                {/* Tasa de Eficiencia */}
                <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <TrendingUp className="w-8 h-8 text-[#017E49]" />
                        <span className="text-3xl font-bold text-[#017E49]">
                            {metricas.tasa_eficiencia ? `${Math.round(metricas.tasa_eficiencia)}%` : '—'}
                        </span>
                    </div>
                    <p className="text-[#333333] font-semibold mb-1">Eficiencia</p>
                    <p className="text-[#6B6B6B] text-xs">Tickets validados/generados</p>
                </div>
            </div>

            {/* Estadísticas detalladas */}
            <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
                <h3 className="text-lg font-bold text-[#333333] mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Estadísticas del Ciclo Actual
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <p className="text-[#6B6B6B] text-sm mb-2">Total Generados</p>
                        <p className="text-2xl font-bold text-[#333333]">
                            {metricas.tickets_generados || 0}
                        </p>
                    </div>
                    <div>
                        <p className="text-[#6B6B6B] text-sm mb-2">Total Entregados</p>
                        <p className="text-2xl font-bold text-[#017E49]">
                            {metricas.tickets_entregados || 0}
                        </p>
                    </div>
                    <div>
                        <p className="text-[#6B6B6B] text-sm mb-2">Tickets Expirados</p>
                        <p className="text-2xl font-bold text-[#E12019]">
                            {metricas.tickets_expirados || 0}
                        </p>
                    </div>
                </div>
            </div>

            {/* Información del ciclo */}
            {metricas.ciclo_actual && (
                <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
                    <h3 className="text-lg font-bold text-[#333333] mb-4">Ciclo Bimensual Activo</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-[#6B6B6B] text-sm">Fecha Inicio:</span>
                            <span className="text-[#333333] font-semibold">
                                {new Date(metricas.ciclo_actual.fecha_inicio).toLocaleDateString('es-CL')}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[#6B6B6B] text-sm">Fecha Fin:</span>
                            <span className="text-[#333333] font-semibold">
                                {new Date(metricas.ciclo_actual.fecha_fin).toLocaleDateString('es-CL')}
                            </span>
                        </div>
                        {metricas.ciclo_actual.dias_restantes !== undefined && (
                            <div className="flex justify-between items-center">
                                <span className="text-[#6B6B6B] text-sm">Días Restantes:</span>
                                <span className="text-[#E12019] font-bold">
                                    {metricas.ciclo_actual.dias_restantes}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Alertas y Avisos */}
            {metricas.stock_disponible !== undefined && metricas.stock_disponible < 10 && (
                <div className="bg-[#FFF4E6] border-2 border-[#FF9F55] rounded-xl p-4 flex items-start gap-3">
                    <Package className="w-6 h-6 text-[#FF9F55] flex-shrink-0 mt-1" />
                    <div>
                        <p className="text-[#333333] font-semibold mb-1">⚠️ Stock Bajo</p>
                        <p className="text-[#6B6B6B] text-sm">
                            Quedan solo {metricas.stock_disponible} cajas disponibles. Considera reabastecimiento.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
