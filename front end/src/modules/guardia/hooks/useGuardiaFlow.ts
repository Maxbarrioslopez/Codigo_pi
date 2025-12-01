import { useState } from 'react';

type GuardiaScreen = 'login' | 'dashboard';
type DashboardTab = 'scanner' | 'incidents' | 'metrics';

export function useGuardiaFlow() {
    const [currentScreen, setCurrentScreen] = useState<GuardiaScreen>('login');
    const [currentTab, setCurrentTab] = useState<DashboardTab>('scanner');

    return { currentScreen, setCurrentScreen, currentTab, setCurrentTab };
}
