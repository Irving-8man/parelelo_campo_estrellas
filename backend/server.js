// backend/server.mjs
import express from 'express';
import { Worker } from 'node:worker_threads';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/modules', express.static(path.join(__dirname, '../node_modules')));

// Endpoint para obtener datos de estrellas
app.get('/api/stars', async (req, res) => {
    const quadrants = [
        { raMin: 0, raMax: 90, decMin: -45, decMax: 45 },
        { raMin: 90, raMax: 180, decMin: -45, decMax: 45 },
    ];

    const results = [];
    let completed = 0;

    for (const quadrant of quadrants) {
        const worker = new Worker('./backend/fetchWorker.js', { workerData: quadrant });
        worker.on('message', data => {
            results.push(...data);
            completed += 1;
            if (completed === quadrants.length) {
                res.json(results);
            }
        });
        worker.on('error', err => console.error('Error en el worker:', err));
    }
});

app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
