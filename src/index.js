import * as THREE from 'three'
// import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'

import vertex from './shaders/vertex'
import fragment from './shaders/fragment'

import * as dat from 'dat.gui'
// import datGuiImage from 'dat.gui.image'
// datGuiImage(dat)
import gsap from 'gsap'

import { TimelineMax } from 'gsap'
import { OrthographicCamera } from 'three'
let OrbitControls = require('three-orbit-controls')(THREE);

// const createInputEvents = require('simple-input-events')
// const event = createInputEvents(window);



export default class Template {
    constructor(selector) {
        this.images =[];

        // getting the heights of the containing windows
        this.container = selector;
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;

        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.width, this.height);
        this.renderer.setClearColor('#ccc', 1);
        this.renderer.physicallyCorrectLights = true;
        this.renderer.outputEncoding = THREE.sRGBEncoding;

        this.container.appendChild(this.renderer.domElement);

        this.camera = new THREE.PerspectiveCamera(
            70, this.width / this.height,
            0.001,
            1000
        );

        // let frustumSize = 10;
        // let aspect = window.innerWidth / window.innerHeight;
        // this.camera = new THREE.OrthographicCamera(frustumSize* aspect / -2, frustumSize*aspect);
        this.camera.position.set(0, 0, 4);
        // this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.time = 0;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.paused = false;
        this.materials = [];
        this.meshes = [];
        
        this.setupResize();
        this.tabEvents();
        this.addObjects();
        this.mouseMove();
        this.resize();
        this.render();

        // this.domImages();
        // this.settings();
    }
    domImages() {
        this.images = [...document.querySelectorAll('img')];

        this.images.forEach((image,i)=>{
            let mat = this.material.clone();
            this.materials.push(mat);
            mat.uniforms.texture1.value = new THREE.Texture(image);
            mat.uniforms.texture1.value.needsUpdate = true;

            let geo = new THREE.PlaneBufferGeometry(2, 1.5, 20, 20)
            this.mesh = new THREE.Mesh(geo, mat);
            this.scene.add(this.mesh);
            this.mesh.position.y = i * -1.5;
            this.meshes.push(this.mesh)
        })
    }
    settings() {
        let that = this;
        this.settings = {
            time: 0,
        };
        this.gui = new dat.GUI();
        this.gui.add(this.settings, 'time', 0, 100, 0.01);
        this.gui.addImage(this.settings, 'texturePath').onChange((image) => {
            body.append(image);
        });
    }

    setupResize() {
        window.addEventListener('resize', this.resize.bind(this));
    }

    resize() {
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        this.renderer.setSize(this.width, this.height);
        this.camera.aspect = this.width / this.height;

        this.imageAspect = 853 / 1280;
        let a1; let a2;
        if (this.height / this.width > this.imageAspect) {
            a1 = (this.width / this.height) * this.imageAspect;
            a2 = 1;
        } else {
            a2 = (this.height / this.width) * this.imageAspect;
            a1 = 1;
        }
        this.material.uniforms.resolution.value.x = this.width;
        this.material.uniforms.resolution.value.y = this.height;
        this.material.uniforms.resolution.value.z = a1;
        this.material.uniforms.resolution.value.w = a2;

        // const dist = this.camera.position.z;
        // const height = 1;
        // this.camera.fov = 2 * (180 / Math.PI) * Math.atan(height / (2 * dist));

        // if (this.width / this.height > 1) {
        //     this.mesh ? this.mesh.scale.x = this.camera.aspect: null;
        //     // this.plane.scale.y = this.camera.aspect;
        // } else {
        //     this.mesh ? this.mesh.scale.y = 1 / this.camera.aspect: null;
        // }

        this.camera.updateProjectionMatrix();
    }

    addObjects() {
        let that = this;
        this.material = new THREE.ShaderMaterial({
            extensions: {
                derivatives: '#extension GL_OES_standard_derivatives : enable'
            },
            side: THREE.DoubleSide,
            uniforms: {
                time: { type: "f", value: 0 },
                uTexture: { type: "t", value: null },
                uColor1:{value: new THREE.Color('#114081')},
                uColor2:{value: new THREE.Color('#5388B5')},
                uMouse:{value: new THREE.Vector2(0,0)},
                resolution: { type: "v4", value: new THREE.Vector4() },
                uvRate: {
                    value: new THREE.Vector2(1, 1)
                }
            },
            // wireframe: true,
            // transparent: true,
            vertexShader: vertex,
            fragmentShader: fragment
        });

        this.geometry = new THREE.PlaneBufferGeometry(15, 8, 150, 150);

        this.plane = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.plane);
    }

    tabEvents() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stop()
            } else {
                this.play();
            }
        });
    }

    mouseMove() {
        window.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / this.width) * 2 - 1;
            this.mouse.y = - (event.clientY / this.height) * 2 + 1;

            // update the picking ray with the camera and mouse position
            this.raycaster.setFromCamera(this.mouse, this.camera);

            // calculate objects intersecting the picking ray
            const intersects = this.raycaster.intersectObjects(this.scene.children);

            if (intersects.length > 0) {
                let points = intersects[0].point;
                points.z = 0;
                // console.log(points);
                gsap.to(this.material.uniforms.uMouse.value,{
                    x: intersects[0].uv.x,
                    y: intersects[0].uv.y,
                    duration: 0.5,
                    ease: 'Power.easeIn'
                });
            }
        }, false);
    }

    stop() {
        this.paused = true;
    }

    play() {
        this.paused = false;
    }

    render() {
        if (this.paused) return;
        this.time += 0.02;
        // if(this.materials){
        //     this.materials.forEach(m =>{
        //         m.uniforms.time.value = this.time;
        //     })
        // }
        this.material.uniforms.time.value = this.time;
        requestAnimationFrame(this.render.bind(this));
        this.renderer.render(this.scene, this.camera);
    }
}

new Template(document.getElementById('container'));