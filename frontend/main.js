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

    // Crear una geometría básica para todas las estrellas
    const geometry = new THREE.SphereGeometry(0.05, 6, 6);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff }); // Blanco para las estrellas

    // Usamos InstancedMesh para mejorar el rendimiento
    const starCount = stars.length;
    const instancedMesh = new THREE.InstancedMesh(geometry, material, starCount);
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // Hacer la matriz de instancias dinámica

    stars.forEach((star, index) => {
        const { x, y, z } = star;

        // Crear una matriz de transformación para cada estrella
        const matrix = new THREE.Matrix4();
        matrix.setPosition(new THREE.Vector3(x, y, z));

        // Actualizar la matriz de la estrella en la malla instanciada
        instancedMesh.setMatrixAt(index, matrix);
    });

    scene.add(instancedMesh);
    // Ajustar la posición inicial de la cámara
    camera.position.z = 8;
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// Iniciar carga de estrellas
loadStars();
