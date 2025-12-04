/**
 * Datos mock para desarrollo independiente del backend
 */

import type {
    TicketDTO,
    CicloDTO,
    AgendamientoDTO,
    IncidenciaDTO,
    ParametroOperativoDTO,
    MetricasGuardiaDTO,
    StockResumenDTO,
    StockMovimientoDTO,
    TrabajadorDTO,
    BeneficioResponse,
    RetirosDiaDTO
} from './api';

// Estado mock en memoria
let mockIncidencias: IncidenciaDTO[] = [
    {
        id: 1,
        codigo: 'INC-001',
        trabajador: 1,
        tipo: 'ticket_error',
        descripcion: 'Error al generar QR',
        estado: 'pendiente',
        creada_por: 'Sistema',
        created_at: new Date().toISOString(),
        resolved_at: null,
        metadata: {}
    },
    {
        id: 2,
        codigo: 'INC-002',
        trabajador: 2,
        tipo: 'sistema',
        descripcion: 'Problema de conexión',
        estado: 'en_proceso',
        creada_por: 'admin',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        resolved_at: null,
        metadata: {}
    },
    {
        id: 3,
        codigo: 'INC-003',
        trabajador: null,
        tipo: 'otro',
        descripcion: 'Consulta general',
        estado: 'resuelta',
        creada_por: 'guardia',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        resolved_at: new Date(Date.now() - 86400000).toISOString(),
        metadata: {}
    }
];

let mockTickets: TicketDTO[] = [
    {
        id: 1,
        uuid: '123e4567-e89b-12d3-a456-426614174000',
        trabajador: { id: 1, rut: '12345678-9', nombre: 'Juan Pérez', beneficio_disponible: { tipo: 'Caja Estándar' } },
        qr_image: null,
        data: {},
        created_at: new Date().toISOString(),
        estado: 'generado',
        ttl_expira_at: new Date(Date.now() + 1800000).toISOString(),
        ciclo: 1,
        sucursal: 1,
        eventos: []
    }
];

let mockAgendamientos: AgendamientoDTO[] = [
    {
        id: 1,
        trabajador: 1,
        ciclo: 1,
        fecha_retiro: new Date(Date.now() + 86400000).toISOString(),
        estado: 'pendiente',
        created_at: new Date().toISOString()
    }
];

let mockParametros: ParametroOperativoDTO[] = [
    { id: 1, clave: 'qr_ttl_min', valor: '30', descripcion: 'Tiempo de vida del QR en minutos', updated_at: new Date().toISOString() },
    { id: 2, clave: 'max_agendamientos_dia', valor: '50', descripcion: 'Máximo de agendamientos por día', updated_at: new Date().toISOString() },
    { id: 3, clave: 'stock_umbral_bajo', valor: '10', descripcion: 'Umbral de stock bajo', updated_at: new Date().toISOString() }
];

export const mockData = {
    // Beneficios
    getBeneficio: (rut: string): BeneficioResponse => ({
        beneficio: {
            id: 1,
            rut,
            nombre: 'Trabajador Mock',
            beneficio_disponible: { tipo: 'Caja Estándar', disponible: true }
        }
    }),

    // Tickets
    crearTicket: (trabajador_rut: string): TicketDTO => {
        const newTicket: TicketDTO = {
            id: mockTickets.length + 1,
            uuid: crypto.randomUUID(),
            trabajador: { id: mockTickets.length + 1, rut: trabajador_rut, nombre: 'Trabajador Mock', beneficio_disponible: {} },
            qr_image: null,
            data: {},
            created_at: new Date().toISOString(),
            estado: 'generado',
            ttl_expira_at: new Date(Date.now() + 1800000).toISOString(),
            ciclo: 1,
            sucursal: 1,
            eventos: []
        };
        mockTickets.push(newTicket);
        return newTicket;
    },

    estadoTicket: (uuid: string): TicketDTO => {
        return mockTickets.find(t => t.uuid === uuid) || mockTickets[0];
    },

    validarTicketGuardia: (uuid: string): TicketDTO => {
        const ticket = mockTickets.find(t => t.uuid === uuid);
        if (ticket) {
            ticket.estado = 'entregado';
            ticket.eventos.push({
                tipo: 'validado_guardia',
                timestamp: new Date().toISOString(),
                metadata: {}
            });
        }
        return ticket || mockTickets[0];
    },

    listarTickets: (rut?: string): TicketDTO[] => {
        if (rut) {
            return mockTickets.filter(t => t.trabajador.rut === rut);
        }
        return mockTickets;
    },

    // Agendamientos
    crearAgendamiento: (trabajador_rut: string, fecha_retiro: string): AgendamientoDTO => {
        const newAgendamiento: AgendamientoDTO = {
            id: mockAgendamientos.length + 1,
            trabajador: mockAgendamientos.length + 1,
            ciclo: 1,
            fecha_retiro,
            estado: 'pendiente',
            created_at: new Date().toISOString()
        };
        mockAgendamientos.push(newAgendamiento);
        return newAgendamiento;
    },

    listarAgendamientos: (rut?: string): AgendamientoDTO[] => {
        return mockAgendamientos;
    },

    // Incidencias
    crearIncidencia: (payload: any): IncidenciaDTO => {
        const newIncidencia: IncidenciaDTO = {
            id: mockIncidencias.length + 1,
            codigo: `INC-${String(mockIncidencias.length + 1).padStart(3, '0')}`,
            trabajador: payload.trabajador_rut ? 1 : null,
            tipo: payload.tipo,
            descripcion: payload.descripcion || '',
            estado: 'pendiente',
            creada_por: 'Sistema',
            created_at: new Date().toISOString(),
            resolved_at: null,
            metadata: {}
        };
        mockIncidencias.push(newIncidencia);
        return newIncidencia;
    },

    obtenerIncidencia: (codigo: string): IncidenciaDTO => {
        return mockIncidencias.find(i => i.codigo === codigo) || mockIncidencias[0];
    },

    listarIncidencias: (estado?: string): IncidenciaDTO[] => {
        if (estado) {
            return mockIncidencias.filter(i => i.estado === estado);
        }
        return mockIncidencias;
    },

    resolverIncidencia: (codigo: string, resolucion: string): IncidenciaDTO => {
        const incidencia = mockIncidencias.find(i => i.codigo === codigo);
        if (incidencia) {
            incidencia.estado = 'resuelta';
            incidencia.resolved_at = new Date().toISOString();
            incidencia.metadata = { ...incidencia.metadata, resolucion };
        }
        return incidencia || mockIncidencias[0];
    },

    cambiarEstadoIncidencia: (codigo: string, estado: string): IncidenciaDTO => {
        const incidencia = mockIncidencias.find(i => i.codigo === codigo);
        if (incidencia) {
            incidencia.estado = estado as any;
        }
        return incidencia || mockIncidencias[0];
    },

    // Ciclo
    cicloActivo: (): CicloDTO => ({
        id: 1,
        fecha_inicio: new Date(Date.now() - 15 * 86400000).toISOString(),
        fecha_fin: new Date(Date.now() + 45 * 86400000).toISOString(),
        activo: true,
        dias_restantes: 45
    }),

    // Métricas
    metricasGuardia: (): MetricasGuardiaDTO => ({
        entregados: 42,
        pendientes: 8,
        incidencias_pendientes: mockIncidencias.filter(i => i.estado === 'pendiente').length
    }),

    // Parámetros
    listarParametros: (): ParametroOperativoDTO[] => {
        return mockParametros;
    },

    upsertParametro: (clave: string, valor: string, descripcion?: string): ParametroOperativoDTO => {
        const existing = mockParametros.find(p => p.clave === clave);
        if (existing) {
            existing.valor = valor;
            if (descripcion) existing.descripcion = descripcion;
            existing.updated_at = new Date().toISOString();
            return existing;
        } else {
            const newParam: ParametroOperativoDTO = {
                id: mockParametros.length + 1,
                clave,
                valor,
                descripcion: descripcion || '',
                updated_at: new Date().toISOString()
            };
            mockParametros.push(newParam);
            return newParam;
        }
    },

    // Reportes
    reportesRetirosPorDia: (dias: number): RetirosDiaDTO[] => {
        const result: RetirosDiaDTO[] = [];
        for (let i = 0; i < dias; i++) {
            const fecha = new Date(Date.now() - i * 86400000);
            result.push({
                fecha: fecha.toISOString().split('T')[0],
                entregados: Math.floor(Math.random() * 20) + 10,
                pendientes: Math.floor(Math.random() * 5),
                expirados: Math.floor(Math.random() * 3)
            });
        }
        return result.reverse();
    },

    // Stock
    stockResumen: (): StockResumenDTO => ({
        disponible: 145,
        entregadas_hoy: 23,
        reservadas: 12,
        total_mes: 568,
        por_tipo: { estandar: 120, premium: 25 }
    }),

    stockMovimientos: (): StockMovimientoDTO[] => [
        {
            fecha: new Date().toISOString().split('T')[0],
            hora: '09:30',
            tipo_caja: 'Estándar',
            accion: 'Agregado',
            cantidad: 50,
            motivo: 'Reposición semanal',
            usuario: 'admin'
        },
        {
            fecha: new Date().toISOString().split('T')[0],
            hora: '14:15',
            tipo_caja: 'Premium',
            accion: 'Retirado',
            cantidad: 5,
            motivo: 'Entrega beneficios',
            usuario: 'guardia'
        }
    ]
};
