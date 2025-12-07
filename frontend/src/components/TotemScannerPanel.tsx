import React, { useState, useCallback } from 'react';
import { normalizeRutFromScan, parseChileanIDFromPdf417 } from '@/utils/parseChileanID';
import { ScannerBase } from '@/components/ScannerBase';

export type TotemScannerPanelProps = {
    onRutDetected: (rut: string) => void;
    onError?: (msg: string) => void;
    deviceId?: string;
};

export default function TotemScannerPanel({ onRutDetected, onError, deviceId }: TotemScannerPanelProps) {
    const [scanSuccess, setScanSuccess] = useState(false);

    const playSuccessSound = useCallback(() => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const notes = [262, 330, 392]; // C4, E4, G4
            let time = audioContext.currentTime;
            notes.forEach((frequency, index) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.frequency.value = frequency;
                gain.gain.setValueAtTime(0.2, time);
                gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
                osc.start(time + index * 0.15);
                osc.stop(time + index * 0.15 + 0.2);
            });
        } catch {
            console.warn('No se pudo reproducir sonido de éxito');
        }
    }, []);

    const handleScanResult = (text: string) => {
        // Primero intenta PDF417 -> RUT
        const parsed = parseChileanIDFromPdf417(text);
        const rutToUse = parsed?.rut || normalizeRutFromScan(text);

        if (!rutToUse) {
            onError?.('No se pudo extraer un RUT válido del código');
            return;
        }

        // Feedback visual y sonoro
        setScanSuccess(true);
        playSuccessSound();
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100, 50, 100]);
        }

        // Pausa 1s para mostrar feedback, luego dispara callback
        setTimeout(() => {
            onRutDetected(rutToUse);
            setScanSuccess(false);
        }, 1000);
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <ScannerBase
                onScanResult={handleScanResult}
                onError={onError}
                isActive={true}
                showGuide="qr"
                allowControls={true}
                enableSound={true}
                containerClassName="w-full h-full"
            />
            {scanSuccess && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(34, 197, 94, 0.3)',
                    border: '4px solid #22c55e',
                    borderRadius: '0.5rem',
                    pointerEvents: 'none',
                    animation: 'pulse-success 0.5s ease-out'
                }} />
            )}
            <style>{`
        @keyframes pulse-success {
          0% { box-shadow: 0 0 80px rgba(34, 197, 94, 1), inset 0 0 40px rgba(34, 197, 94, 0.3); }
          100% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.5); }
        }
      `}</style>
        </div>
    );
}
