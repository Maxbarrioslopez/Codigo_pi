import { useEffect, useState } from 'react';
import { cicloActivo, CicloDTO } from '../services/api';

export function useCicloActivo() {
    const [data, setData] = useState<CicloDTO | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        cicloActivo()
            .then(setData)
            .catch(e => setError(e.detail || 'Error ciclo'))
            .finally(() => setLoading(false));
    }, []);

    return { ciclo: data, loading, error };
}
