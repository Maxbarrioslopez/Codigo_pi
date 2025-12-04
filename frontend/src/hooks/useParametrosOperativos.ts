import { useEffect, useState, useCallback } from 'react';
import { listarParametros, upsertParametro, ParametroOperativoDTO } from '../services/api';

export function useParametrosOperativos() {
    const [params, setParams] = useState<ParametroOperativoDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(() => {
        setLoading(true);
        listarParametros()
            .then(setParams)
            .catch(e => setError(e.detail || 'Error parámetros'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    async function save(clave: string, valor: string, descripcion?: string) {
        setSaving(true);
        try {
            const updated = await upsertParametro(clave, valor, descripcion);
            setParams((prev: ParametroOperativoDTO[]) => {
                const idx = prev.findIndex((p: ParametroOperativoDTO) => p.clave === updated.clave);
                if (idx >= 0) {
                    const copy = [...prev]; copy[idx] = updated; return copy;
                }
                return [...prev, updated];
            });
        } catch (e: any) {
            setError(e.detail || 'Error guardando parámetro');
        } finally {
            setSaving(false);
        }
    }

    function getValor(clave: string, def: string = ''): string {
        return params.find((p: ParametroOperativoDTO) => p.clave === clave)?.valor ?? def;
    }

    return { params, loading, saving, error, refresh, save, getValor };
}
