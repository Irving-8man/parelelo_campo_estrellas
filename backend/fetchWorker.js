// backend/fetchWorker.js
import { parentPort, workerData } from 'node:worker_threads';

// Ejemplo de simulación de datos
const { raMin, raMax, decMin, decMax } = workerData;
const simulatedStars = Array.from({ length: 1000 }, () => ({
    ra: Math.random() * (raMax - raMin) + raMin,
    dec: Math.random() * (decMax - decMin) + decMin,
    parallax: Math.random() * 10,
}));



parentPort.postMessage(simulatedStars);
