import * as THREE from 'three'
import vertex from './shaders/vertex'
import fragment from './shaders/fragment'

import gsap from 'gsap'



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

        this.camera.position.set(0, 0, 4);
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
                tDiffuse: {
                    value: null
                },
                distort: {
                    value: 0
                },
                resolution: {
                    value: new THREE.Vector2(window.innerWidth,window.innerHeight)
                },
                uMouse: {
                    value: new THREE.Vector2(.5,.5)
                },
                uVelo: {
                    value: 0.02
                },
                uScale: {
                    value: 0.5
                },
                time: {
                    value: 0
                },
                background: {
                    value: new THREE.Color("#E4DED5")
                },
                uColor1: {
                    value: new THREE.Color("#cbd5e1")
                },
                uColor2: {
                    value: new THREE.Color("#f8fafc")
                },
                colorOpacity: {
                    value: .65
                },
                warpNoise: {
                    value: 6
                },
                warpMultiply: {
                    value: .1
                },
                circBlurMin: {
                    value: 200
                },
                circBlurMax: {
                    value: 500
                },
                circleSize: {
                    value: .15
                },
                grainExpand: {
                    value: 20
                },
                grainMix: {
                    value: .15
                }
            },
            fragmentShader: fragment,
            vertexShader: vertex
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
                gsap.to(this.material.uniforms.uMouse.value,{
                    x: intersects[0].uv.x,
                    y: intersects[0].uv.y,
                    duration: 0.8,
                    ease: 'Expo.ease'
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
        this.material.uniforms.time.value = this.time;
        requestAnimationFrame(this.render.bind(this));
        this.renderer.render(this.scene, this.camera);
    }
}

new Template(document.getElementById('container'));