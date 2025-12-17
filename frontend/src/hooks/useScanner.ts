import { useRef, useState, useEffect } from 'react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

export type UseScannerOptions = {
    formats: BarcodeFormat[];
    onResult: (text: string) => void;
    onError?: (error: Error) => void;
    deviceId?: string;
};

export type UseScannerReturn = {
    start: (videoEl: HTMLVideoElement, deviceId?: string) => Promise<void>;
    stop: () => void;
    isActive: boolean;
};

export function useScanner(options: UseScannerOptions): UseScannerReturn {
    const { formats, onResult, onError } = options;
    const [isActive, setIsActive] = useState(false);
    const controlsRef = useRef<IScannerControls | null>(null);
    const readerRef = useRef<BrowserMultiFormatReader | null>(null);

    useEffect(() => {
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
        readerRef.current = new BrowserMultiFormatReader(hints);
        return () => {
            stop();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function start(videoEl: HTMLVideoElement, deviceId?: string) {
        try {
            if (!readerRef.current) throw new Error('Scanner not initialized');
            const id = deviceId || options.deviceId || undefined;
            const controls = await readerRef.current.decodeFromVideoDevice(
                id,
                videoEl,
                (result, err) => {
                    if (result) {
                        const text = result.getText();
                        try { onResult(text); } catch (e: any) { onError?.(e); }
                    } else if (err && !(err as any).name?.includes('NotFoundException')) {
                        onError?.(err as Error);
                    }
                }
            );
            controlsRef.current = controls;
            setIsActive(true);
        } catch (e: any) {
            onError?.(e as Error);
        }
    }

    function stop() {
        try {
            controlsRef.current?.stop();
            if (readerRef.current && 'reset' in readerRef.current) {
                (readerRef.current as any).reset();
            }
        } catch { /* noop */ }
        setIsActive(false);
    }

    return { start, stop, isActive };
}
