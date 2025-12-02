import React from 'react';

type Props = {
    onSubmit: (tipo: string, descripcion: string) => void;
    loading?: boolean;
};

export default function TotemIncidentForm({ onSubmit, loading }: Props) {
    const [tipo, setTipo] = React.useState('usuario');
    const [descripcion, setDescripcion] = React.useState('');
    return (
        <form
            className="p-6 flex flex-col gap-3 w-full max-w-xl"
            onSubmit={(e) => { e.preventDefault(); onSubmit(tipo, descripcion); }}
        >
            <h2 className="text-xl font-semibold">Reportar incidencia</h2>
            <label className="text-sm">Tipo</label>
            <select className="border rounded px-3 py-2" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="usuario">Usuario</option>
                <option value="operacional">Operacional</option>
                <option value="tecnica">Técnica</option>
            </select>
            <label className="text-sm">Descripción</label>
            <textarea className="border rounded px-3 py-2" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            <button className="mt-2 px-6 py-3 bg-blue-600 text-white rounded disabled:opacity-60" disabled={!!loading}>
                Enviar incidencia
            </button>
        </form>
    );
}
