import * as THREE from 'three'
import { BloomEffect, EffectComposer, EffectPass, RenderPass, ShaderPass } from "postprocessing";
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

        this.shaders = {
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
                    value: 0.5
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
                },
                grainUpper: {
                    value: 103
                },
                grainLower: {
                    value: 6
                }
            },
            vertexShader: "\n    uniform float time;\n    uniform float progress;\n    uniform vec2 resolution;\n    const float pi = 3.1415925;\n        varying vec2 vUv;\n        void main() {\n            vUv = uv;\n            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n        }\n    ",
            fragmentShader: "\n        uniform float time;\n        uniform float progress;\n        uniform sampler2D tDiffuse;\n        uniform vec2 resolution;\n        varying vec2 vUv;\n        uniform vec2 uMouse;\n        uniform float uVelo;\n        uniform vec3 background;\n        uniform float colorOpacity;\n        uniform float warpNoise;\n        uniform float warpMultiply;\n        uniform float circBlurMin;\n        uniform float circBlurMax;\n        uniform float circleSize;\n        uniform float grainExpand;\n        uniform float grainMix;\n        uniform float grainUpper;\n        uniform float grainLower;\n\n        int uType;\n\n        float circle2(vec2 uv, vec2 disc_center, float disc_radius, float border_size) {\n            uv -= disc_center;\n            uv*=resolution;\n            float dist = sqrt(dot(uv, uv));\n            return smoothstep(disc_radius+border_size, disc_radius-border_size, dist);\n        }\n\n        float random1d(float n){\n            return fract(sin(n) * 43758.5453);\n        }\n\n        float random2d(vec2 n) { \n            return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);\n        }\n\n        //1D NOISE \n        //returns 0 - 1\n        float noise1d(float p){\n            float fl = floor(p);\n            float fc = fract(p);\n            return mix(random1d(fl), random1d(fl + 1.0), fc);\n        }\n\n        //2D NOISE cheap value noise\n        //returns 0 - 1\n        float noise2d(vec2 p){\n            vec2 ip = floor(p);\n            vec2 u = fract(p);\n            u = u*u*(3.0-2.0*u);\n\n            float res = mix(\n                mix(random2d(ip),random2d(ip+vec2(1.0,0.0)),u.x),\n                mix(random2d(ip+vec2(0.0,1.0)),random2d(ip+vec2(1.0,1.0)),u.x),u.y);\n            return res*res;\n        }\n\n        vec2 fade(vec2 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}\n        vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}\n\n        float cnoise(vec2 P){\n            vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);\n            vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);\n            Pi = mod(Pi, 289.0); // To avoid truncation effects in permutation\n            vec4 ix = Pi.xzxz;\n            vec4 iy = Pi.yyww;\n            vec4 fx = Pf.xzxz;\n            vec4 fy = Pf.yyww;\n            vec4 i = permute(permute(ix) + iy);\n            vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; // 1/41 = 0.024...\n            vec4 gy = abs(gx) - 0.5;\n            vec4 tx = floor(gx + 0.5);\n            gx = gx - tx;\n            vec2 g00 = vec2(gx.x,gy.x);\n            vec2 g10 = vec2(gx.y,gy.y);\n            vec2 g01 = vec2(gx.z,gy.z);\n            vec2 g11 = vec2(gx.w,gy.w);\n            vec4 norm = 1.79284291400159 - 0.85373472095314 * \n                vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));\n            g00 *= norm.x;\n            g01 *= norm.y;\n            g10 *= norm.z;\n            g11 *= norm.w;\n            float n00 = dot(g00, vec2(fx.x, fy.x));\n            float n10 = dot(g10, vec2(fx.y, fy.y));\n            float n01 = dot(g01, vec2(fx.z, fy.z));\n            float n11 = dot(g11, vec2(fx.w, fy.w));\n            vec2 fade_xy = fade(Pf.xy);\n            vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);\n            float n_xy = mix(n_x.x, n_x.y, fade_xy.y);\n            return 2.3 * n_xy;\n        }\n\n        float Perlin2D( vec2 P )\n        {\n            //  https://github.com/BrianSharpe/Wombat/blob/master/Perlin2D.glsl\n    \n            // establish our grid cell and unit position\n            vec2 Pi = floor(P);\n            vec4 Pf_Pfmin1 = P.xyxy - vec4( Pi, Pi + 1.0 );\n    \n            // calculate the hash\n            vec4 Pt = vec4( Pi.xy, Pi.xy + 1.0 );\n            Pt = Pt - floor(Pt * ( 1.0 / 71.0 )) * 710.0;\n            Pt += vec2( 26.0, 161.0 ).xyxy;\n            Pt *= Pt;\n            Pt = Pt.xzxz * Pt.yyww;\n            vec4 hash_x = fract( Pt * ( 11.0 / 951.135664 ) );\n            vec4 hash_y = fract( Pt * ( 11.0 / 642.949883 ) );\n    \n            // calculate the gradient results\n            vec4 grad_x = hash_x - 0.49999;\n            vec4 grad_y = hash_y - 0.49999;\n            vec4 grad_results = inversesqrt( grad_x * grad_x + grad_y * grad_y ) * ( grad_x * Pf_Pfmin1.xzxz + grad_y * Pf_Pfmin1.yyww );\n    \n            // Classic Perlin Interpolation\n            grad_results *= 1.4142135623730950488016887242097;  // scale things to a strict -1.0->1.0 range  *= 1.0/sqrt(0.5)\n            vec2 blend = Pf_Pfmin1.xy * Pf_Pfmin1.xy * Pf_Pfmin1.xy * (Pf_Pfmin1.xy * (Pf_Pfmin1.xy * 6.0 - 15.0) + 10.0);\n            vec4 blend2 = vec4( blend, vec2( 1.0 - blend ) );\n            return dot( grad_results, blend2.zxzx * blend2.wwyy );\n        }\n\n        void main()\t{\n            vec4 color = vec4(1.,0.,0.,1.);\n            vec2 position = vUv;\n\n            //define colors\n            vec4 bgCol = texture2D(tDiffuse, position);\n            vec4 circCol = vec4(background, colorOpacity);\n            \n            //warp uv space to make the circle warp based on uv coord and time\n            vec2 warpUv = position + cnoise(position * warpNoise + time * 0.75) * warpMultiply;\n            \n            //draw circle \n            float circ = circle2(warpUv, uMouse, resolution.x * uVelo * circleSize, circBlurMin + uVelo * circBlurMax);    \n            float grain = 1.; //1. - cnoise(position * grainUpper + time) * cnoise(position * grainLower +time);\n\n            grain *= circ * grainExpand;\n\n            vec4 col = mix(bgCol, circCol - (grain * grainMix), circ);\n\n            color = col;\n\n            gl_FragColor = color;\n        }\n        "
            
        }

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.paused = false;
        this.materials = [];
        this.meshes = [];

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.composer.addPass(new ShaderPass(
            this.shaders,
        ));
        // this.composer.addPass(new EffectPass(this.camera, new BloomEffect()));
        
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
                    value: new THREE.Color("#114081")
                },
                uColor2: {
                    value: new THREE.Color("#5388B5")
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
                },
                grainUpper: {
                    value: 103
                },
                grainLower: {
                    value: 6
                }
            },
            // vertexShader: "\n    uniform float time;\n    uniform float progress;\n    uniform vec2 resolution;\n    const float pi = 3.1415925;\n        varying vec2 vUv;\n        void main() {\n            vUv = uv;\n            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n        }\n    ",
            // fragmentShader: "\n        uniform float time;\n        uniform float progress;\n        uniform sampler2D tDiffuse;\n        uniform vec2 resolution;\n        varying vec2 vUv;\n        uniform vec2 uMouse;\n        uniform float uVelo;\n        uniform vec3 background;\n        uniform float colorOpacity;\n        uniform float warpNoise;\n        uniform float warpMultiply;\n        uniform float circBlurMin;\n        uniform float circBlurMax;\n        uniform float circleSize;\n        uniform float grainExpand;\n        uniform float grainMix;\n        uniform float grainUpper;\n        uniform float grainLower;\n\n        int uType;\n\n        float circle2(vec2 uv, vec2 disc_center, float disc_radius, float border_size) {\n            uv -= disc_center;\n            uv*=resolution;\n            float dist = sqrt(dot(uv, uv));\n            return smoothstep(disc_radius+border_size, disc_radius-border_size, dist);\n        }\n\n        float random1d(float n){\n            return fract(sin(n) * 43758.5453);\n        }\n\n        float random2d(vec2 n) { \n            return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);\n        }\n\n        //1D NOISE \n        //returns 0 - 1\n        float noise1d(float p){\n            float fl = floor(p);\n            float fc = fract(p);\n            return mix(random1d(fl), random1d(fl + 1.0), fc);\n        }\n\n        //2D NOISE cheap value noise\n        //returns 0 - 1\n        float noise2d(vec2 p){\n            vec2 ip = floor(p);\n            vec2 u = fract(p);\n            u = u*u*(3.0-2.0*u);\n\n            float res = mix(\n                mix(random2d(ip),random2d(ip+vec2(1.0,0.0)),u.x),\n                mix(random2d(ip+vec2(0.0,1.0)),random2d(ip+vec2(1.0,1.0)),u.x),u.y);\n            return res*res;\n        }\n\n        vec2 fade(vec2 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}\n        vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}\n\n        float cnoise(vec2 P){\n            vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);\n            vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);\n            Pi = mod(Pi, 289.0); // To avoid truncation effects in permutation\n            vec4 ix = Pi.xzxz;\n            vec4 iy = Pi.yyww;\n            vec4 fx = Pf.xzxz;\n            vec4 fy = Pf.yyww;\n            vec4 i = permute(permute(ix) + iy);\n            vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; // 1/41 = 0.024...\n            vec4 gy = abs(gx) - 0.5;\n            vec4 tx = floor(gx + 0.5);\n            gx = gx - tx;\n            vec2 g00 = vec2(gx.x,gy.x);\n            vec2 g10 = vec2(gx.y,gy.y);\n            vec2 g01 = vec2(gx.z,gy.z);\n            vec2 g11 = vec2(gx.w,gy.w);\n            vec4 norm = 1.79284291400159 - 0.85373472095314 * \n                vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));\n            g00 *= norm.x;\n            g01 *= norm.y;\n            g10 *= norm.z;\n            g11 *= norm.w;\n            float n00 = dot(g00, vec2(fx.x, fy.x));\n            float n10 = dot(g10, vec2(fx.y, fy.y));\n            float n01 = dot(g01, vec2(fx.z, fy.z));\n            float n11 = dot(g11, vec2(fx.w, fy.w));\n            vec2 fade_xy = fade(Pf.xy);\n            vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);\n            float n_xy = mix(n_x.x, n_x.y, fade_xy.y);\n            return 2.3 * n_xy;\n        }\n\n        float Perlin2D( vec2 P )\n        {\n            //  https://github.com/BrianSharpe/Wombat/blob/master/Perlin2D.glsl\n    \n            // establish our grid cell and unit position\n            vec2 Pi = floor(P);\n            vec4 Pf_Pfmin1 = P.xyxy - vec4( Pi, Pi + 1.0 );\n    \n            // calculate the hash\n            vec4 Pt = vec4( Pi.xy, Pi.xy + 1.0 );\n            Pt = Pt - floor(Pt * ( 1.0 / 71.0 )) * 710.0;\n            Pt += vec2( 26.0, 161.0 ).xyxy;\n            Pt *= Pt;\n            Pt = Pt.xzxz * Pt.yyww;\n            vec4 hash_x = fract( Pt * ( 11.0 / 951.135664 ) );\n            vec4 hash_y = fract( Pt * ( 11.0 / 642.949883 ) );\n    \n            // calculate the gradient results\n            vec4 grad_x = hash_x - 0.49999;\n            vec4 grad_y = hash_y - 0.49999;\n            vec4 grad_results = inversesqrt( grad_x * grad_x + grad_y * grad_y ) * ( grad_x * Pf_Pfmin1.xzxz + grad_y * Pf_Pfmin1.yyww );\n    \n            // Classic Perlin Interpolation\n            grad_results *= 1.4142135623730950488016887242097;  // scale things to a strict -1.0->1.0 range  *= 1.0/sqrt(0.5)\n            vec2 blend = Pf_Pfmin1.xy * Pf_Pfmin1.xy * Pf_Pfmin1.xy * (Pf_Pfmin1.xy * (Pf_Pfmin1.xy * 6.0 - 15.0) + 10.0);\n            vec4 blend2 = vec4( blend, vec2( 1.0 - blend ) );\n            return dot( grad_results, blend2.zxzx * blend2.wwyy );\n        }\n\n        void main()\t{\n            vec4 color = vec4(1.,0.,0.,1.);\n            vec2 position = vUv;\n\n            //define colors\n            vec4 bgCol = texture2D(tDiffuse, position);\n            vec4 circCol = vec4(background, colorOpacity);\n            \n            //warp uv space to make the circle warp based on uv coord and time\n            vec2 warpUv = position + cnoise(position * warpNoise + time * 0.75) * warpMultiply;\n            \n            //draw circle \n            float circ = circle2(warpUv, uMouse, resolution.x * uVelo * circleSize, circBlurMin + uVelo * circBlurMax);    \n            float grain = 1.; //1. - cnoise(position * grainUpper + time) * cnoise(position * grainLower +time);\n\n            grain *= circ * grainExpand;\n\n            vec4 col = mix(bgCol, circCol - (grain * grainMix), circ);\n\n            color = col;\n\n            gl_FragColor = color;\n        }\n        "
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

                // this.material.uniforms.uMouse.value.x = intersects[0].uv.x
                // this.material.uniforms.uMouse.value.y = intersects[0].uv.y
                // console.log(points);
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
        // if(this.materials){
        //     this.materials.forEach(m =>{
        //         m.uniforms.time.value = this.time;
        //     })
        // }
        this.material.uniforms.time.value = this.time;
        requestAnimationFrame(this.render.bind(this));
        this.renderer.render(this.scene, this.camera);
        // this.composer.render();
    }
}

new Template(document.getElementById('container'));