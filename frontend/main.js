import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Crear la escena
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('starfield') });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Color de fondo
scene.background = new THREE.Color(0x000022);

// Controles orbitales
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 5;
controls.maxDistance = 100;

// Luz ambiente
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

// Cargar y renderizar las estrellas
async function loadStars() {
    const response = await fetch('/api/stars');
    const stars = await response.json();

    const geometry = new THREE.SphereGeometry(0.04, 8, 8); 
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });

    const starCount = stars.length;
    const instancedMesh = new THREE.InstancedMesh(geometry, material, starCount);
    const scaleFactor = 0.001; // Ajuste de escala

    stars.forEach((star, index) => {
        const matrix = new THREE.Matrix4();
        matrix.setPosition(new THREE.Vector3(star.x * scaleFactor, star.y * scaleFactor, star.z * scaleFactor));
        instancedMesh.setMatrixAt(index, matrix);
    });

    instancedMesh.instanceMatrix.needsUpdate = true; 
    scene.add(instancedMesh);
    camera.position.z = 20; // Posición inicial de la cámara
    animate();
}

// Animación
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Ajustar tamaño al redimensionar la ventana
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

loadStars();
