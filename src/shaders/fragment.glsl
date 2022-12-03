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

void main(){
    float mouse = 1.- distance(vUv, uMouse.xy);
    vec3 color = mix(uColor1, uColor2, vColor) * mouse;
    gl_FragColor = vec4(color, 1.);
}