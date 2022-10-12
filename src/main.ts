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


function main () {

  //#region  General Configurations
  const configs = {
    boidVelocity: 1,
    boidsNumber: 100,
    planeSize: 200,
    lightIntensity: 1,
    boidSize: 2,
  };

  let balls: Mesh[] = [];



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
      color: 0xffffff,
      side: DoubleSide
    } )
  );
  plane.position.set( 0, 0, 0 );
  scene.add( plane );


  //scene.add( sphere );



  for ( let i = 0; i < configs.boidsNumber; ++i ) {
    const sphere: Mesh = new Mesh(
      new SphereGeometry( configs.boidSize, 30, 30 ),
      new MeshStandardMaterial( {
        color: Math.random() * 0xffffff,
      } )
    );
    sphere.position.set( 0, 0, 0 );


    sphere.userData.velocity = new Vector3().randomDirection().setZ( 0 );
    sphere.userData.velocity.multiplyScalar( configs.boidVelocity );

    balls.push( sphere );
    scene.add( sphere );
  }


  const animateBalls = () => {
    if ( balls.length == 0 ) return;

    balls.forEach( ( item ) => item.position.add( item.userData.velocity ) );

    const negEdge = -1 * ( configs.planeSize / 2 );
    const posEdge = configs.planeSize / 2;

    const offset = 2;

    balls.forEach( ( item ) => {

      // x col
      if ( item.position.x < negEdge ) {
        item.position.x += offset;
        item.userData.velocity.x *= -1;
      } else if ( item.position.x > posEdge ) {
        item.position.x -= offset;
        item.userData.velocity.x *= -1;
      }

      // y col
      if ( item.position.y < negEdge ) {
        item.position.y += offset;
        item.userData.velocity.y *= -1;
      } else if ( item.position.y > posEdge ) {
        item.position.y -= offset;
        item.userData.velocity.y *= -1;
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