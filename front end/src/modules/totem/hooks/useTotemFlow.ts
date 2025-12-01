import { useState } from 'react';

type TotemScreen = 'initial' | 'validating' | 'success' | 'success-choice' | 'no-stock' | 'schedule-select' | 'schedule-confirm' | 'no-benefit' | 'error' | 'incident-form' | 'incident-sent' | 'incident-scan' | 'incident-status';

export function useTotemFlow() {
    const [currentScreen, setCurrentScreen] = useState<TotemScreen>('initial');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    return { currentScreen, setCurrentScreen, loading, setLoading, errorMsg, setErrorMsg };
}
