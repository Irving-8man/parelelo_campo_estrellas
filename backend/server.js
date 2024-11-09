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
    console.time('totalRequestTime');  // Tiempo total de la solicitud

    // Cuadrantes a pedir
    const quadrants = [
        {id:1, raMin: 0, raMax: 90, decMin: -45, decMax: 45 },  // Cuadrante 1
        {id:2, raMin: 90, raMax: 180, decMin: -45, decMax: 45 }, // Cuadrante 2
        {id:3, raMin: 0, raMax: 90, decMin: -90, decMax: -45 },  // Cuadrante 3
        {id:4, raMin: 90, raMax: 180, decMin: -90, decMax: -45 }, // Cuadrante 4
    ];

    const results = [];
    let completed = 0;

    console.time('workerStartTime');  // Tiempo de inicio del trabajo del worker

    // Recorre los cuadrantes y crea un worker para cada uno
    for (const quadrant of quadrants) {
        console.time(`workerFetch-${quadrant.id}`);  // Medir tiempo de cada worker individual

        const worker = new Worker('./backend/fetchWorker.js', { workerData: quadrant });
        worker.on('message', data => {
            // Convertir las coordenadas (ra, dec) a (x, y, z)
            const stars = data.map(star => {
                const { ra, dec, parallax } = star;
                const raRad = ra * (Math.PI / 180);  // Convertir a radianes
                const decRad = dec * (Math.PI / 180);
                const distance = parallax !== 0 ? 1 / parallax : 1e10;  // Parallax a distancia
                const x = distance * Math.cos(decRad) * Math.cos(raRad);
                const y = distance * Math.cos(decRad) * Math.sin(raRad);
                const z = distance * Math.sin(decRad);
                return { x, y, z, parallax };
            });

            results.push(...stars);
            completed += 1;
            console.timeEnd(`workerFetch-${quadrant.id}`);  // Fin del tiempo por worker

            if (completed === quadrants.length) {
                console.timeEnd('workerStartTime');  // Fin del tiempo total de los workers
                console.timeEnd('totalRequestTime');  // Fin del tiempo total de la solicitud
                res.json(results);  // Enviar los resultados al cliente
            }
        });

        worker.on('error', err => console.error(err));
    }
});


app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
