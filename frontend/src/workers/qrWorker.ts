import jsQR from 'jsqr';

// Worker que analiza QR sin bloquear el main thread
let frameCount = 0;
self.onmessage = (event: MessageEvent<{
    data: Uint8ClampedArray;
    width: number;
    height: number;
}>) => {
    const { data, width, height } = event.data;
    frameCount++;
    console.log(`🔍 Worker procesando frame #${frameCount}: ${width}x${height}`);
    try {
        // Intentar con diferentes opciones de inversión
        const code = jsQR(data, width, height, {
            inversionAttempts: "attemptBoth"
        });
        if (code && code.data) {
            console.log('✅ Worker encontró QR:', code.data);
            self.postMessage({ success: true, data: code.data });
        } else {
            // Solo loguear cada 10 frames para no saturar
            if (frameCount % 10 === 0) {
                console.log(`❌ Worker: No QR en frame #${frameCount}`);
            }
            self.postMessage({ success: false });
        }
    } catch (e) {
        console.error('❌ Worker error:', e);
        self.postMessage({ success: false, error: String(e) });
    }
};
