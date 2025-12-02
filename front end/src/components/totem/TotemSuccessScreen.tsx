import React from 'react';

type Props = {
    beneficio: any;
    onGenerateTicket: () => void;
    loading?: boolean;
};

export default function TotemSuccessScreen({ beneficio, onGenerateTicket, loading }: Props) {
    return (
        <div className="p-6 flex flex-col items-center gap-4">
            <h2 className="text-xl font-semibold">Beneficio disponible</h2>
            <pre className="bg-gray-100 p-4 rounded w-full max-w-xl overflow-auto text-sm">
                {JSON.stringify(beneficio, null, 2)}
            </pre>
            <button
                className="px-6 py-3 bg-green-600 text-white rounded disabled:opacity-60"
                disabled={!!loading}
                onClick={onGenerateTicket}
            >
                Generar Ticket
            </button>
        </div>
    );
}
