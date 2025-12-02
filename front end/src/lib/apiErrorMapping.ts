export type ApiError = { code?: string; message?: string; detail?: string } | any;

export type FlowHandlers = {
    setError: (msg: string) => void;
    toState: (state: string) => void;
};

export function mapApiErrorToStateAndToast(err: ApiError, h: FlowHandlers) {
    const code = err?.code;
    const msg = err?.message || err?.detail || 'Error inesperado';
    h.setError(msg);
    switch (code) {
        case 'rut_invalid':
        case 'rut_not_found':
            h.toState('error');
            break;
        case 'no_stock':
            h.toState('no-stock');
            break;
        case 'ticket_expired':
        case 'ticket_already_used':
        case 'ticket_invalid_state':
            h.toState('error');
            break;
        default:
            h.toState('error');
    }
}
