const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const output = document.getElementById('output');
const flipCamera = document.getElementById('flipCamera');
const runOutput = document.getElementById('runOutput');
const copyRunBtn = document.getElementById('copyRunBtn');
const sendRunBtn = document.getElementById('sendRunBtn');
const endpointInput = document.getElementById('endpointInput');
const runStatus = document.getElementById('runStatus');

let stream = null;
let scanning = false;

async function startCamera() {
  try {
    const useBack = flipCamera.checked;
    const constraints = {
      video: {
        facingMode: useBack ? { ideal: 'environment' } : { ideal: 'user' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };

    stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    await video.play();

    scanning = true;
    stopBtn.disabled = false;
    startBtn.disabled = true;
    output.textContent = 'Buscando código QR...';
    tick();
  } catch (err) {
    console.error('Error accediendo a la cámara:', err);
    output.textContent = 'Error accediendo a la cámara: ' + err.message;
  }
}

function stopCamera() {
  scanning = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  output.textContent = '—';
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
}

function tick() {
  if (!scanning) return;
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code) {
      drawBoundingBox(code.location, ctx);
      handleResult(code.data);
      return;
    }
  }
  requestAnimationFrame(tick);
}

function drawBoundingBox(location, ctx) {
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(location.topLeftCorner.x, location.topLeftCorner.y);
  ctx.lineTo(location.topRightCorner.x, location.topRightCorner.y);
  ctx.lineTo(location.bottomRightCorner.x, location.bottomRightCorner.y);
  ctx.lineTo(location.bottomLeftCorner.x, location.bottomLeftCorner.y);
  ctx.closePath();
  ctx.stroke();
}

function handleResult(text) {
  scanning = false;
  output.textContent = text;
  const run = extractRUN(text);
  if (run) {
    runOutput.textContent = run;
    copyRunBtn.disabled = false;
    sendRunBtn.disabled = false;
  } else {
    runOutput.textContent = 'No se encontró RUN en el texto.';
    copyRunBtn.disabled = true;
    sendRunBtn.disabled = true;
  }
  if (navigator.vibrate) navigator.vibrate(200);
  if (stream) stream.getTracks().forEach(t => t.stop());
  startBtn.disabled = false;
  stopBtn.disabled = true;
}

function extractRUN(text) {
  if (!text) return null;
  const runRegex = /RUN\s*[=:]?\s*([0-9]{1,8}-?[0-9kK]?)/i;
  const m = text.match(runRegex);
  if (m && m[1]) return m[1];
  const rutRegex = /([0-9]{6,8}-[0-9kK])/;
  const m2 = text.match(rutRegex);
  if (m2 && m2[1]) return m2[1];
  return null;
}

copyRunBtn.addEventListener('click', async () => {
  const txt = runOutput.textContent;
  try {
    await navigator.clipboard.writeText(txt);
    runStatus.textContent = 'RUN copiado al portapapeles.';
  } catch (err) {
    runStatus.textContent = 'Error al copiar: ' + err.message;
  }
});

sendRunBtn.addEventListener('click', async () => {
  const endpoint = endpointInput.value.trim();
  const run = runOutput.textContent;
  if (!endpoint) { runStatus.textContent = 'Ingresa la URL del endpoint.'; return; }
  runStatus.textContent = 'Enviando...';
  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ run })
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json().catch(() => null);
    runStatus.textContent = 'Enviado correctamente.' + (data ? ' Respuesta: ' + JSON.stringify(data) : '');
  } catch (err) {
    runStatus.textContent = 'Error enviando: ' + err.message;
  }
});

startBtn.addEventListener('click', startCamera);
stopBtn.addEventListener('click', stopCamera);

flipCamera.addEventListener('change', () => {
  if (stream) {
    stopCamera();
    startCamera();
  }
});
