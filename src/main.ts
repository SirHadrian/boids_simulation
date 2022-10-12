import {
  Scene,
  Plane,
  PlaneGeometry,
  Mesh,
  MeshBasicMaterial,
  WebGLRenderer,
  TextureLoader,
  PerspectiveCamera,
  sRGBEncoding,
  Camera,
  DirectionalLight,
  ColorRepresentation,
  SphereGeometry,
  MeshStandardMaterial,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';



class SceneSetup extends Scene {

  constructor() {

    super();

    const backgroundLoader = new TextureLoader();
    const texture = backgroundLoader.load( './assets/back.jpg' );
    this.background = texture;
  }

}


class CameraSetup extends PerspectiveCamera {

  constructor( fov: number, aspectRatio: number, nearDistance: number, farDistance: number ) {

    super( fov, aspectRatio, nearDistance, farDistance );

    this.position.set( 100, 50, -100 );
  }
}


class RendererSetup extends WebGLRenderer {

  constructor( configs: object, camera: CameraSetup ) {

    super( configs );

    this.setSize( window.innerWidth, window.innerHeight );
    this.setPixelRatio( window.devicePixelRatio );
    this.outputEncoding = sRGBEncoding;

    // Inject renderer to DOM
    const target = document.getElementById( "app" );
    target?.appendChild( this.domElement );

    // OrbitControls
    new OrbitControls( camera, this.domElement );
  }
}

class LightSetup extends DirectionalLight {

  constructor( scene: Scene, color: ColorRepresentation, intensity: number ) {

    super( color, intensity );

    this.position.set( 1, 2, -1 );
    scene.add( this );
  }
}


function main () {

  //#region INIT
  // Create Scene
  const scene = new SceneSetup();

  // Create Camera
  const camera = new CameraSetup(
    50, // FOV
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1, // Near: distance objects apear on camera
    1000, // Far: distance objects disapear from camera
  );

  // Create Renderer
  const renderer = new RendererSetup( { antialiasing: true }, camera );

  // Create light source
  const light = new LightSetup(
    scene,
    0xffffff,
    1
  );
  //#endregion

  //#region PlayGround

  // Test Objects
  const sphere: THREE.Mesh = new Mesh(
    new SphereGeometry( 10, 10, 10 ),
    new MeshStandardMaterial( {
      color: 0xffffff,
    } )
  );
  scene.add( sphere );




  //#endregion


  //#region Main loop and events
  // On window resize
  const resize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
  }
  window.addEventListener( "resize", resize, false );

  // Animation loop
  const animate = () => {
    renderer.render( scene, camera );
    requestAnimationFrame( animate );
  }
  animate();
  //#endregion
}

main();