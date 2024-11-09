import * as THREE from '/modules/three/build/three.module.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('starfield') });
renderer.setSize(window.innerWidth, window.innerHeight);

// Cambiar el fondo de la escena para simular el espacio
scene.background = new THREE.Color(0x000033); // Azul oscuro

async function loadStars() {
    const response = await fetch('/api/stars');
    const stars = await response.json();


    stars.forEach(star => {
        // Crear la geometría y el material de la estrella
        const geometry = new THREE.SphereGeometry(0.05, 6, 6);
        const material = new THREE.MeshBasicMaterial({ color:"red" }); // Blanco para las estrellas
        const starMesh = new THREE.Mesh(geometry, material);

        // Calcular la posición en el espacio 3D
        const raRad = star.ra * Math.PI / 180; // Convertir de grados a radianes
        const decRad = star.dec * Math.PI / 180; // Convertir de grados a radianes

        starMesh.position.set(
            (star.ra - 180) * Math.cos(decRad) * 0.5, 
            (star.ra - 180) * Math.sin(decRad) * 0.5, 
            -star.parallax * 10 
        );

        scene.add(starMesh); // Agregar la estrella a la escena
    });

    // Ajustar la posición inicial de la cámara
    camera.position.z = 10;

    // Iniciar la animación
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

loadStars();
