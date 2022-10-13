import {
  Scene,
  PlaneGeometry,
  Mesh,
  MeshBasicMaterial,
  WebGLRenderer,
  TextureLoader,
  PerspectiveCamera,
  sRGBEncoding,
  DirectionalLight,
  ColorRepresentation,
  SphereGeometry,
  MeshStandardMaterial,
  DoubleSide,
  Vector3,
  Group,
  Line,
  BufferGeometry,
  LineBasicMaterial,
} from 'three';
import * as dat from 'dat.gui'
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

    this.position.set( 0, 0, 200 );
    this.lookAt( 0, 0, 0 );
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

    this.position.set( 0, 0, 10 );
    scene.add( this );
  }
}


class LineDirection {

  constructor() {

  }

  static create ( points: Vector3[] ) {
    const line = new Line(
      new BufferGeometry().setFromPoints( points ),
      new LineBasicMaterial( {
        color: 0xff00ff
      } )
    );
    return line;
  }
}

class Boid extends Mesh {

  constructor( geometry: SphereGeometry, material: MeshStandardMaterial, velocity: number, scene: Scene ) {
    super( geometry, material );

    this.position.set( 0, 0, 0 );

    this.userData.velocity = new Vector3().randomDirection().setZ( 0 );
    this.userData.velocity.multiplyScalar( velocity );

    this.userData.line = LineDirection.create( [this.position, this.position.clone().add( this.userData.velocity ).multiplyScalar( 20 )] );
    scene.add( this.userData.line );
  }

}



function main () {

  //#region  General Configurations
  const configs = {
    boidVelocity: 0.5,
    boidsNumber: 100,
    planeSize: 200,
    lightIntensity: 1,
    boidSize: 1,
  };

  const balls = new Group();
  //#endregion

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
    configs.lightIntensity
  );
  //#endregion

  //#region PlayGround

  // Test Objects
  const plane = new Mesh(
    new PlaneGeometry( configs.planeSize, configs.planeSize ),
    new MeshBasicMaterial( {
      color: 0x000000,
      side: DoubleSide
    } )
  );
  plane.position.set( 0, 0, 0 );
  scene.add( plane );


  for ( let i = 0; i < configs.boidsNumber; ++i ) {
    const boid = new Boid(
      new SphereGeometry( configs.boidSize, 30, 30 ),
      new MeshStandardMaterial( {
        color: Math.random() * 0xffffff,
      } ),
      configs.boidVelocity,
      scene
    );
    balls.add( boid );
  }

  scene.add( balls );

  const animateBalls = () => {
    if ( balls.children.length == 0 ) return;

    balls.children.forEach( ( boid ) => {
      boid.position.add( boid.userData.velocity );
      boid.userData.line.position.add( boid.userData.velocity );
    } );

    const negEdge = -1 * ( configs.planeSize / 2 );
    const posEdge = configs.planeSize / 2;

    const offset = 2;


    balls.children.forEach( ( boid ) => {
      // x col
      if ( boid.position.x < negEdge ) {
        boid.position.x += offset;
        boid.userData.line.position.x += offset;
        boid.userData.velocity.x *= -1;
      } else if ( boid.position.x > posEdge ) {
        boid.position.x -= offset;
        boid.userData.line.position.x -= offset;
        boid.userData.velocity.x *= -1;
      }

      // y col
      if ( boid.position.y < negEdge ) {
        boid.position.y += offset;
        boid.userData.line.position.y += offset;
        boid.userData.velocity.y *= -1;
      } else if ( boid.position.y > posEdge ) {
        boid.position.y -= offset;
        boid.userData.line.position.y -= offset;
        boid.userData.velocity.y *= -1;
      }
    } );
  }
  //#endregion

  //#region GUI
  const gui = new dat.GUI( { width: 200 } );

  gui.add( configs, "planeSize", 100, 500, 50 ).onChange( () => plane.scale.set( configs.planeSize, configs.planeSize, 0 ) );
  gui.add( configs, "lightIntensity", 0.1, 1, 0.1 ).onChange( () => light.intensity = configs.lightIntensity );
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

    animateBalls();

    renderer.render( scene, camera );
    requestAnimationFrame( animate );
  }
  animate();
  //#endregion
}

main();