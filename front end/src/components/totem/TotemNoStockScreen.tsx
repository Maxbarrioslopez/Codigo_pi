import React from 'react';

type Props = { onSchedule: () => void };

export default function TotemNoStockScreen({ onSchedule }: Props) {
    return (
        <div className="p-6 flex flex-col items-center gap-4">
            <h2 className="text-xl font-semibold text-red-600">No hay stock disponible</h2>
            <p>Puede agendar un retiro para una fecha futura.</p>
            <button className="px-6 py-3 bg-blue-600 text-white rounded" onClick={onSchedule}>
                Agendar Retiro
            </button>
        </div>
    );
}
