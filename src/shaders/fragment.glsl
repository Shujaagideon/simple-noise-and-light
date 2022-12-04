uniform float time;
uniform float progress;
uniform sampler2D uTexture;
uniform vec4 resolution;
varying vec2 vUv;
varying vec3 vPosition;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uMouse;
varying float vColor;
varying vec3 vNormal;
varying float vMouseNoise;


void main(){
    vec2 newUv = (vUv - vec2(0.5)) * 1. + vec2(0.5);
    float mouse = 1. - distance(newUv, uMouse.xy);
    mouse = smoothstep( 0.75, 1., mouse);
    mouse = clamp(0.1, .5, mouse) * 2.8;
    //float mo = mix( vMouseNoise, vColor ,mouse);
    vec3 color = mix(uColor1, uColor2, vColor) + mix(uColor1, uColor2, vColor * mouse);
    gl_FragColor = vec4(color, 1.);
}