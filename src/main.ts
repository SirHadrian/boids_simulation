import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';


// Create scene and camera
const scene: THREE.Scene = new THREE.Scene();
const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
  75,
  innerWidth / innerHeight,
  0.1,
  1000,
);
const backgroundLoader = new THREE.TextureLoader();
const texture = backgroundLoader.load('./assets/back.jpg');
scene.background = texture;

// Renderer
const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({
  antialias: true,
});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);
const target = document.getElementById('app');
target?.appendChild(renderer.domElement);

// Orbit controls / camera position
new OrbitControls(camera, renderer.domElement);
camera.position.z = 20;

// Objects
const sphere: THREE.Mesh = new THREE.Mesh(
  new THREE.SphereGeometry(1, 10, 10),
  new THREE.MeshStandardMaterial({
    color: 0xffffff,
  })
);
scene.add(sphere);

// Light
const light: THREE.AmbientLight = new THREE.AmbientLight(
  0xffffff,
  1
);
scene.add(light);

// Main loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();