import React from 'react';

export default function TotemValidatingScreen() {
    return (
        <div className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            <p className="mt-4 text-lg">Validando beneficio…</p>
        </div>
    );
}
