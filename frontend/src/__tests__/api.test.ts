import { cicloActivo } from '../services/api';

// Mock global fetch
const mockFetch = (data: any, ok = true, status = 200) => {
    // @ts-ignore
    global.fetch = jest.fn().mockResolvedValue({
        ok,
        status,
        json: async () => data,
    });
};

describe('service layer: cicloActivo', () => {
    it('returns ciclo activo data', async () => {
        mockFetch({ id: 1, fecha_inicio: '2025-11-01', fecha_fin: '2025-12-31', activo: true, dias_restantes: 20 });
        const ciclo = await cicloActivo();
        expect(ciclo.activo).toBe(true);
        expect(ciclo.dias_restantes).toBe(20);
    });

    it('throws ApiError on failure', async () => {
        // @ts-ignore
        global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({ detail: 'Sin ciclo activo' }) });
        await expect(cicloActivo()).rejects.toMatchObject({ status: 404 });
    });
});
