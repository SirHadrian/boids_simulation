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
    initial_boid_velocity: 1,
    boids_number: 50,
    plane_size: 200,
    light_intensity: 1,
    boid_size: 1,
    boid_speed: 1,
    aligment_force: 0.05,
    boid_perception_radius: 20,
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
      new PlaneGeometry( this.#configs.plane_size, this.#configs.plane_size ),
      new MeshBasicMaterial( {
        color: 0x000000,
        side: DoubleSide
      } )
    );
    plane.position.set( 0, 0, 0 );
    return plane;
  }


  cohesion ( boid: Object3D, boids: Group ) {

    if ( boids.children.length <= 1 ) return;

    let steering = new Vector3( 0, 0, 0 );
    let total = 0;

    boids.children.forEach( ( other ) => {

      let distance = boid.position.distanceTo( other.position );

      if ( distance < this.#configs.boid_perception_radius ) {
        steering.add( other.position );
        total++;
      }
    } );

    steering.divideScalar( total );
    steering.sub( boid.position );
    steering.multiplyScalar( this.#configs.aligment_force );

    boid.userData.acceleration.add( steering );
  }


  aligment ( boid: Object3D, boids: Group ) {

    if ( boids.children.length <= 1 ) return;

    let steering = new Vector3( 0, 0, 0 );
    let total = 0;

    boids.children.forEach( ( other ) => {

      let distance = boid.position.distanceTo( other.position );

      if ( distance < this.#configs.boid_perception_radius ) {
        steering.add( other.userData.velocity );
        total++;
      }
    } );

    steering.divideScalar( total );
    steering.normalize();
    steering.sub( boid.userData.velocity );
    steering.multiplyScalar( this.#configs.aligment_force );

    boid.userData.acceleration.add(steering);
  }


  checkEdges ( boid: Object3D ) {

    const width = this.#configs.plane_size / 2;
    const height = this.#configs.plane_size / 2;

    // x col
    if ( boid.position.x < -width ) {
      boid.position.x = width;
    } else if ( boid.position.x > width ) {
      boid.position.x = -width;
    }

    // y col
    if ( boid.position.y < -height ) {
      boid.position.y = height;
    } else if ( boid.position.y > height ) {
      boid.position.y = -height;
    }
  }


  animateBalls () {

    // Delete lines from scene
    this.#lines.remove( ...this.#lines.children );

    if ( this.boids.children.length == 0 ) return;

    this.boids.children.forEach( ( boid ) => {

      boid.position.add( boid.userData.velocity.add( boid.userData.acceleration ).multiplyScalar( this.#configs.boid_speed ).normalize() );

      //this.aligment( boid, this.#boids );
      this.cohesion( boid, this.#boids );

      this.checkEdges( boid );


      // Draw lines
      this.#lines.add(
        LineDirection.create( [
          boid.position,
          boid.position.clone().add( boid.userData.velocity.clone().multiplyScalar( 5 ) )
        ] )
      );
    } );
  }


  #create_boids () {

    for ( let i = 0; i < this.#configs.boids_number; ++i ) {
      const boid = new Boid(
        new SphereGeometry( this.#configs.boid_size, 10, 10 ),
        new MeshStandardMaterial( {
          color: Math.random() * 0xffffff,
        } ),
        this.#configs.initial_boid_velocity,
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
  // gui.add( configs, "plane_size", 100, 500, 50 ).onChange( () => plane.scale.set( configs.plane_size, configs.plane_size, 0 ) );
  // gui.add( configs, "light_intensity", 0.1, 1, 0.1 ).onChange( () => light.intensity = configs.light_intensity );
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
