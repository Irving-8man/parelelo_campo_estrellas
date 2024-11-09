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
    console.time('totalRequestTime'); 
    // Cuadrantes a pedir
    const quadrants = [
        {id:1, raMin: 0, raMax: 90, decMin: -45, decMax: 45 },  // Cuadrante 1
        {id:2, raMin: 90, raMax: 180, decMin: -45, decMax: 45 }, // Cuadrante 2
        {id:3, raMin: 0, raMax: 90, decMin: -90, decMax: -45 },  // Cuadrante 3
        {id:4, raMin: 90, raMax: 180, decMin: -90, decMax: -45 }, // Cuadrante 4
    ];

    const results = [];
    let completed = 0;

    console.time('workerStartTime'); // Tiempo de inicio del trabajo del worker

    // Recorre los cuadrantes y crea un worker para cada uno
    for (const quadrant of quadrants) {
        const worker = new Worker('./backend/fetchWorker.js', { workerData: quadrant });
        worker.on('message', data => {
            // Convertir las coordenadas (ra, dec) a (x, y, z)
            const stars = data.map(star => {
                const { ra, dec, parallax } = star;

                // Convertir ra y dec de grados a radianes
                const raRad = ra * (Math.PI / 180); // Convertir a radianes
                const decRad = dec * (Math.PI / 180);

                // Calcular la distancia en parsecs a partir de la parallax (en arcseg)
                const distance = parallax !== 0 ? 1 / parallax : 1e10; // Si no hay paralaje, una distancia muy grande

                // Convertir coordenadas esféricas a cartesianas
                const x = distance * Math.cos(decRad) * Math.cos(raRad);
                const y = distance * Math.cos(decRad) * Math.sin(raRad);
                const z = distance * Math.sin(decRad);

                return { x, y, z, parallax };
            });

            results.push(...stars);
            completed += 1;
            if (completed === quadrants.length) {
                console.timeEnd('workerStartTime'); // Fin del tiempo del worker
                console.timeEnd('totalRequestTime'); // Fin del tiempo total para la solicitud
                res.json(results); // Enviar los resultados al cliente cuando todos los cuadrantes hayan sido procesados
            }
        });
        worker.on('error', err => console.error(err));
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
