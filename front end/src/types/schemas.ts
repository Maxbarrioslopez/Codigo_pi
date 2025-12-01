import { z } from 'zod';

export const TicketSchema = z.object({
    uuid: z.string(),
    estado: z.string(),
    trabajador: z.object({ rut: z.string().optional(), nombre: z.string().optional() }).optional(),
    data: z.record(z.any()).optional(),
    ttl_expira_at: z.string().optional(),
});
export type TicketDTOChecked = z.infer<typeof TicketSchema>;

export const BeneficioResponseSchema = z.object({
    beneficio: z.object({
        beneficio_disponible: z.object({ stock: z.number().optional() }).optional(),
    }).optional(),
});
export type BeneficioResponseChecked = z.infer<typeof BeneficioResponseSchema>;
