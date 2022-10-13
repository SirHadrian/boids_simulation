import * as THREE from 'three';

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 500 );
camera.position.set( 0, 0, 100 );
camera.lookAt( 0, 0, 0 );

const scene = new THREE.Scene();


class LineDirection {

    #group: THREE.Group;

    constructor( scene: THREE.Scene ) {
        this.#group = new THREE.Group();

        scene.add( this.#group );
    }

    create ( pt1: THREE.Vector3, pt2: THREE.Vector3 ) {
        const line = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints( [pt1, pt2.multiplyScalar( 3 )] ),
            new THREE.LineBasicMaterial( {
                color: 0x00FF00
            } )
        );
        this.#group.add( line );
    }
}

//create a blue LineBasicMaterial
const material = new THREE.LineBasicMaterial( { color: 0xff00ff } );

const points = [];
points.push( new THREE.Vector3( 10, 10, 0 ) );
points.push( new THREE.Vector3( 0, 10, 0 ) );


const line = new LineDirection( scene );
line.create( ...points );

renderer.render( scene, camera );








