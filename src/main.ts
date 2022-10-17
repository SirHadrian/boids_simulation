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
  Object3D,
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

  constructor( geometry: SphereGeometry, material: MeshStandardMaterial, speed: number ) {
    super( geometry, material );

    this.position.set( Math.random() * 200 - 100, Math.random() * 200 - 100, 0 );

    this.userData.velocity = new Vector3().randomDirection().setZ( 0 ).multiplyScalar( speed );

    this.userData.acceleration = new Vector3( 0, 0, 0 );

  }
}


class Simualtion {

  #boids: Group;
  #lines: Group;

  #configs = {
    initialBoidVelocity: 1,
    boidsNumber: 50,
    planeSize: 200,
    lightIntensity: 1,
    boidSize: 1,
    boidSpeed: 1,
    aligmentForce: 0.05,
  }

  constructor() {

    this.#boids = new Group();
    this.#lines = new Group();

    this.#create_boids();
  }

  get boids () {
    return this.#boids;
  }

  get lines () {
    return this.#lines;
  }

  create_plane () {
    const plane = new Mesh(
      new PlaneGeometry( this.#configs.planeSize, this.#configs.planeSize ),
      new MeshBasicMaterial( {
        color: 0x000000,
        side: DoubleSide
      } )
    );
    plane.position.set( 0, 0, 0 );
    return plane;
  }


  aligment ( boid: Object3D, boids: Group ) {

    if ( boids.children.length == 0 ) return;

    let steering = new Vector3( 0, 0, 0 );
    let radius = 10;
    let total = 0;

    boids.children.forEach( ( other ) => {

      let distance = boid.position.distanceTo( other.position );

      if ( distance < radius ) {
        steering.add( other.userData.velocity );
        total++;
      }
    } );
    steering.divideScalar( total );
    steering.normalize();
    steering.sub( boid.userData.velocity );
    steering.multiplyScalar( this.#configs.aligmentForce );
    boid.userData.acceleration = steering;
  }

  checkEdges ( boid: Object3D ) {

    const width = 100;
    const height = 100;

    // x col
    if ( boid.position.x < -100 ) {
      boid.position.x = width;
    } else if ( boid.position.x > width ) {
      boid.position.x = -100;
    }

    // y col
    if ( boid.position.y < -100 ) {
      boid.position.y = height;
    } else if ( boid.position.y > height ) {
      boid.position.y = -100;
    }
  }

  animateBalls () {

    // Delete lines from scene
    this.#lines.remove( ...this.#lines.children );

    if ( this.boids.children.length == 0 ) return;

    this.boids.children.forEach( ( boid ) => {

      boid.position.add( boid.userData.velocity.add( boid.userData.acceleration ).multiplyScalar( this.#configs.boidSpeed ) );

      this.aligment( boid, this.#boids );

      this.checkEdges( boid );



      // Draw lines
      this.#lines.add(
        LineDirection.create( [
          boid.position,
          boid.position.clone().add( boid.userData.velocity.clone().multiplyScalar( 20 ) )
        ] )
      );
    } );
  }

  #create_boids () {

    for ( let i = 0; i < this.#configs.boidsNumber; ++i ) {
      const boid = new Boid(
        new SphereGeometry( this.#configs.boidSize, 10, 10 ),
        new MeshStandardMaterial( {
          color: Math.random() * 0xffffff,
        } ),
        this.#configs.initialBoidVelocity,
      );
      this.#boids.add( boid );
    }
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
  scene.add( light );
  //#endregion


  //#region PlayGround

  // Simualtion
  const simulation = new Simualtion();

  scene.add( simulation.boids );
  scene.add( simulation.create_plane() );
  //scene.add( simulation.lines );

  //#endregion


  //#region GUI
  // const gui = new dat.GUI( { width: 200 } );
  // gui.add( configs, "planeSize", 100, 500, 50 ).onChange( () => plane.scale.set( configs.planeSize, configs.planeSize, 0 ) );
  // gui.add( configs, "lightIntensity", 0.1, 1, 0.1 ).onChange( () => light.intensity = configs.lightIntensity );
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

    simulation.animateBalls();

    renderer.render( scene, camera );
    requestAnimationFrame( animate );
  }
  animate();

  //#endregion
}

main();
