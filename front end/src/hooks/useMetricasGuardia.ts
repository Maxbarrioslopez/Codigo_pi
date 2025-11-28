import { useEffect, useState } from 'react';
import { metricasGuardia, MetricasGuardiaDTO } from '../services/api';

export function useMetricasGuardia(pollMs: number = 0) {
    const [data, setData] = useState<MetricasGuardiaDTO | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        const fetchOnce = () => {
            setLoading(true);
            metricasGuardia()
                .then(res => { if (active) setData(res); })
                .catch(e => { if (active) setError(e.detail || 'Error métricas'); })
                .finally(() => { if (active) setLoading(false); });
        };
        fetchOnce();
        let interval: any;
        if (pollMs > 0) {
            interval = setInterval(fetchOnce, pollMs);
        }
        return () => { active = false; if (interval) clearInterval(interval); };
    }, [pollMs]);

    return { metricas: data, loading, error };
}
