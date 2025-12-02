/**
 * Servicio de Stock
 */
import { apiClient } from './apiClient';
import { ErrorHandler } from '@/utils/errors/errorHandler';
import { StockResumenDTO, StockMovimientoDTO } from '@/types';

export class StockService {
    private static instance: StockService;
    private constructor() { }
    static getInstance(): StockService {
        if (!StockService.instance) StockService.instance = new StockService();
        return StockService.instance;
    }

    async stockResumen(): Promise<StockResumenDTO> {
        try {
            const { data } = await apiClient.get<StockResumenDTO>('stock/resumen/');
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'StockService.stockResumen', false);
        }
    }

    async stockMovimientos(): Promise<StockMovimientoDTO[]> {
        try {
            const { data } = await apiClient.get<StockMovimientoDTO[]>('stock/movimientos/');
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'StockService.stockMovimientos', false);
        }
    }

    async registrarMovimiento(tipo: 'entrada' | 'salida', cantidad: number, referencia?: string): Promise<void> {
        try {
            await apiClient.post('stock/movimientos/', { tipo, cantidad, referencia });
        } catch (error) {
            throw ErrorHandler.handle(error, 'StockService.registrarMovimiento', false);
        }
    }
}

export const stockService = StockService.getInstance();
