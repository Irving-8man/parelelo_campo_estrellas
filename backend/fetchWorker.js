import { parentPort, workerData } from 'node:worker_threads';
import fetch from 'node-fetch';
import xml2js from 'xml2js';

// Función para obtener datos de las estrellas a partir de la consulta
async function fetchStarData(quadrant) {
    const {id, raMin, raMax, decMin, decMax } = quadrant;
    const query = `SELECT TOP 500 ra, dec, parallax FROM gaiadr2.gaia_source 
                   WHERE ra BETWEEN ${raMin} AND ${raMax} 
                   AND dec BETWEEN ${decMin} AND ${decMax}`;
    const url = `https://gea.esac.esa.int/tap-server/tap/sync?REQUEST=doQuery&LANG=ADQL&FORMAT=votable&QUERY=${encodeURIComponent(query)}`;


    console.time(`Inicio-fetchData-cuadrante-${id}`); // Comienza a medir el tiempo

    try {
        const response = await fetch(url);
        const contentType = response.headers.get('content-type');

        if (!contentType.includes('xml')) {
            throw new Error('Formato de respuesta inesperado');
        }

        const xml = await response.text();
        const parser = new xml2js.Parser();
        const json = await parser.parseStringPromise(xml);

        // Verificar la estructura del XML
        const resource = json.VOTABLE && json.VOTABLE.RESOURCE && json.VOTABLE.RESOURCE[0];
        if (!resource) {
            throw new Error('No se encontró el recurso esperado en el XML');
        }

        const table = resource.TABLE && resource.TABLE[0];
        if (!table) {
            throw new Error('No se encontró la tabla esperada en el XML');
        }

        const data = table.DATA && table.DATA[0];
        if (!data) {
            throw new Error('No se encontró la sección de datos en el XML');
        }

        // Extraer el bloque BINARY2 que contiene los datos base64
        const binaryData = data.BINARY2 && data.BINARY2[0].STREAM[0];
        if (!binaryData) {
            throw new Error('No se encontraron datos binarios en el XML');
        }

        // Si binaryData es un objeto, la cadena base64 estará dentro de la propiedad `_`
        if (binaryData._) {
            const base64Data = binaryData._.replace(/\s+/g, ''); // Limpiar espacios y saltos de línea
            const decodedBuffer = Buffer.from(base64Data, 'base64');

            const stars = [];
            const starDataLength = 12;  // 12 bytes por estrella (4 para RA, 4 para Dec, 4 para Parallax)
            for (let i = 0; i + starDataLength <= decodedBuffer.length; i += starDataLength) {
                const ra = decodedBuffer.readFloatLE(i);        
                const dec = decodedBuffer.readFloatLE(i + 4);   
                const parallax = decodedBuffer.readFloatLE(i + 8); 
                stars.push({ ra, dec, parallax });
            }
            console.timeEnd(`Inicio-fetchData-cuadrante-${id}`); // Fin de la medición
            return stars; 
        } else {
            throw new Error('binaryData._ no contiene los datos base64 esperados');
        }

    } catch (err) {
        console.error('Error al procesar la consulta:', err);
        throw err;
    }
}
console.time('workerProcess'); // Comienza a medir el tiempo del proceso en el worker

fetchStarData(workerData)
    .then(data => {
        console.timeEnd('workerProcess');  // Fin del tiempo de procesamiento en el worker
        parentPort.postMessage(data);  // Enviar los datos de estrellas al hilo principal
    })
    .catch(err => {
        console.error('Error en el worker:', err);
        parentPort.postMessage({ error: err.message });
    });
