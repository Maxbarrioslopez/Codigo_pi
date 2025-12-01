/**
 * Servicio de Stock
 */
import { apiClient } from './apiClient';
import { ErrorHandler } from '@/utils/errors/errorHandler';

export type StockResumen = { total: number; disponibles: number; entregadas: number };
export type StockMovimiento = { fecha: string; tipo: 'entrada' | 'salida'; cantidad: number; referencia?: string };

export class StockService {
    private static instance: StockService;
    private constructor() { }
    static getInstance(): StockService {
        if (!StockService.instance) StockService.instance = new StockService();
        return StockService.instance;
    }

    async stockResumen(): Promise<StockResumen> {
        try {
            const { data } = await apiClient.get<StockResumen>('/stock/resumen/');
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'StockService.stockResumen', false);
        }
    }

    async stockMovimientos(): Promise<StockMovimiento[]> {
        try {
            const { data } = await apiClient.get<StockMovimiento[]>('/stock/movimientos/');
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'StockService.stockMovimientos', false);
        }
    }

    async registrarMovimiento(tipo: 'entrada' | 'salida', cantidad: number, referencia?: string): Promise<void> {
        try {
            await apiClient.post('/stock/movimientos/', { tipo, cantidad, referencia });
        } catch (error) {
            throw ErrorHandler.handle(error, 'StockService.registrarMovimiento', false);
        }
    }
}

export const stockService = StockService.getInstance();
