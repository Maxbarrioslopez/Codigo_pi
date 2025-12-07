import apiClient from './apiClient';

export interface CajaBeneficioDTO {
    id: number;
    beneficio: number;
    nombre: string;
    descripcion: string;
    codigo_tipo: string;
    activo: boolean;
    created_at: string;
}

export interface BeneficioTrabajadorDTO {
    id: number;
    trabajador: {
        id: number;
        rut: string;
        nombre: string;
    };
    ciclo: number;
    tipo_beneficio: number;
    caja_beneficio: number;
    codigo_verificacion: string;
    estado: 'pendiente' | 'validado' | 'retirado' | 'cancelado';
    bloqueado: boolean;
    motivo_bloqueo: string | null;
    qr_data: string;
    created_at: string;
    updated_at: string;
}

export interface ValidacionCajaDTO {
    id: number;
    beneficio_trabajador: number;
    guardia: string;
    codigo_escaneado: string;
    resultado: 'exitoso' | 'rechazado' | 'error';
    caja_validada: string;
    caja_coincide: boolean;
    notas: string;
    fecha_validacion: string;
}

class CajasService {
    // ==================== CAJAS BENEFICIO ====================

    async getCajasBeneficio(): Promise<CajaBeneficioDTO[]> {
        const response = await apiClient.get('/cajas-beneficio/');
        return response.data;
    }

    async getCajaBeneficio(id: number): Promise<CajaBeneficioDTO> {
        const response = await apiClient.get(`/cajas-beneficio/${id}/`);
        return response.data;
    }

    async createCajaBeneficio(data: Partial<CajaBeneficioDTO>): Promise<CajaBeneficioDTO> {
        const response = await apiClient.post('/cajas-beneficio/', data);
        return response.data;
    }

    async updateCajaBeneficio(id: number, data: Partial<CajaBeneficioDTO>): Promise<CajaBeneficioDTO> {
        const response = await apiClient.put(`/cajas-beneficio/${id}/`, data);
        return response.data;
    }

    async deleteCajaBeneficio(id: number): Promise<void> {
        await apiClient.delete(`/cajas-beneficio/${id}/`);
    }

    async obtenerCajasPorBeneficio(tipoBeneficioId: number, incluirInactivas: boolean = false): Promise<CajaBeneficioDTO[]> {
        const params = new URLSearchParams();
        if (incluirInactivas) {
            params.append('incluir_inactivas', 'true');
        }
        const response = await apiClient.get(`/cajas-beneficio/por-tipo/${tipoBeneficioId}/?${params.toString()}`);
        return response.data;
    }

    async crearCajaBeneficio(tipoBeneficioId: number, data: {
        nombre: string;
        descripcion?: string;
        codigo_tipo: string;
        activo?: boolean;
    }): Promise<CajaBeneficioDTO> {
        const response = await apiClient.post(`/cajas-beneficio/por-tipo/${tipoBeneficioId}/`, data);
        return response.data;
    }

    async toggleCajaActivo(cajaId: number, activo?: boolean): Promise<CajaBeneficioDTO> {
        const body = activo !== undefined ? { activo } : {};
        const response = await apiClient.patch(`/cajas-beneficio/${cajaId}/toggle-activo/`, body);
        return response.data;
    }

    async getBeneficiosConCajas(soloActivos: boolean = false): Promise<any[]> {
        const params = new URLSearchParams();
        if (soloActivos) {
            params.append('solo_activos', 'true');
        }
        const response = await apiClient.get(`/beneficios-con-cajas/?${params.toString()}`);
        return response.data;
    }

    async getSoloCajas(soloActivas: boolean = false, tipoBeneficioId?: number): Promise<CajaBeneficioDTO[]> {
        const params = new URLSearchParams();
        if (soloActivas) {
            params.append('solo_activas', 'true');
        }
        if (tipoBeneficioId) {
            params.append('tipo_beneficio_id', tipoBeneficioId.toString());
        }
        const response = await apiClient.get(`/solo-cajas/?${params.toString()}`);
        return response.data;
    }

    // ==================== BENEFICIOS TRABAJADORES ====================

    async getBeneficiosTrabajadores(params?: {
        ciclo_id?: number;
        trabajador_rut?: string;
        tipo_beneficio_id?: number;
        estado?: string;
    }): Promise<BeneficioTrabajadorDTO[]> {
        const response = await apiClient.get('/beneficios-trabajadores/', { params });
        return response.data;
    }

    async getBeneficioTrabajadorPorCodigo(codigo: string): Promise<BeneficioTrabajadorDTO> {
        const response = await apiClient.get(`/beneficios-trabajadores/por-codigo/${codigo}/`);
        return response.data;
    }

    async createBeneficiosTrabajadores(data: any[]): Promise<any> {
        const response = await apiClient.post('/beneficios-trabajadores/', data);
        return response.data;
    } async updateBeneficioTrabajador(id: number, data: Partial<BeneficioTrabajadorDTO>): Promise<BeneficioTrabajadorDTO> {
        const response = await apiClient.put(`/beneficios-trabajadores/${id}/`, data);
        return response.data;
    }

    async deleteBeneficioTrabajador(id: number): Promise<void> {
        await apiClient.delete(`/beneficios-trabajadores/${id}/`);
    }

    async bloquearBeneficioTrabajador(id: number, motivo: string): Promise<BeneficioTrabajadorDTO> {
        const response = await apiClient.post(`/beneficios-trabajadores/${id}/bloquear/`, { motivo });
        return response.data;
    }

    // ==================== VALIDACIONES ====================

    async createValidacionCaja(data: {
        beneficio_trabajador_id: number;
        codigo_escaneado: string;
        resultado: 'exitoso' | 'rechazado' | 'error';
        caja_validada: string;
        notas?: string;
    }): Promise<ValidacionCajaDTO> {
        const response = await apiClient.post('/validaciones-caja/', data);
        return response.data;
    }

    async getValidacionesCaja(params?: {
        ciclo_id?: number;
        resultado?: string;
        fecha_desde?: string;
        fecha_hasta?: string;
    }): Promise<ValidacionCajaDTO[]> {
        const response = await apiClient.get('/validaciones-caja/listar/', { params });
        return response.data;
    }

    async getEstadisticasValidaciones(ciclo_id?: number): Promise<{
        total: number;
        exitosos: number;
        rechazados: number;
        errores: number;
        cajas_coinciden: number;
    }> {
        const params = ciclo_id ? { ciclo_id } : {};
        const response = await apiClient.get('/validaciones-caja/estadisticas/', { params });
        return response.data;
    }
}

export const cajasService = new CajasService();
