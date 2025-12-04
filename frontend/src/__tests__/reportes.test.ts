import { reportesRetirosPorDia } from '../services/api';

describe('reportesRetirosPorDia', () => {
    it('returns daily summary list', async () => {
        // @ts-ignore
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ([
                { fecha: '2025-11-01', entregados: 5, pendientes: 2, expirados: 1 },
                { fecha: '2025-11-02', entregados: 7, pendientes: 1, expirados: 0 }
            ])
        });
        const data = await reportesRetirosPorDia(2);
        expect(data.length).toBe(2);
        expect(data[0].entregados).toBe(5);
    });

    it('handles API error', async () => {
        // @ts-ignore
        global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({ detail: 'fail' }) });
        await expect(reportesRetirosPorDia(2)).rejects.toMatchObject({ status: 500 });
    });
});
