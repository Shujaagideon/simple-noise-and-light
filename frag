uniform sampler2D tDiffuse;
// uniform vec2 mouse;
uniform vec2 resolution;
uniform vec2 center;
uniform vec2 uMouse;
uniform float size;
const float PI = 3.14159265358979;

varying vec2 vUv;
float circle2(vec2 uv, vec2 disc_center, float disc_radius, float border_size){
    uv -= disc_center;
    uv*=resolution;
    float dist = sqrt(dot(uv, uv));
    return smoothstep(disc_radius+border_size, disc_radius-border_size, dist);
}

void main() {
    vec2 st = vUv;
    float gradientSize = resolution.x * (size + .18);
    float pct = circle2(st, uMouse, gradientSize, gradientSize - 0.2);
    vec4 transparent = vec4(0.0, 0.0, 0.0, 0.0);
    vec4 texel = texture2D( tDiffuse, vUv );
    vec4 col = min(texel * pct, texel);
    gl_FragColor = col;
}



uniform float time;
uniform float progress;
uniform sampler2D tDiffuse; 
uniform vec2 resolution;
varying vec2 vUv;
uniform vec2 uMouse;
uniform float uVelo;       
uniform vec3 background;
uniform float colorOpacity;
uniform float warpNoise;
uniform float warpMultiply;
uniform float circBlurMin;
uniform float circBlurMax;
uniform float circleSize;
uniform float grainExpand;
uniform float grainMix;
uniform float grainUpper;
uniform float grainLower;

int uType;
float circle2(vec2 uv, vec2 disc_center, float disc_radius, float border_size) {
        uv -= disc_center;
        uv*=resolution;
        float dist = sqrt(dot(uv, uv));
        return smoothstep(disc_radius+border_size, disc_radius-border_size, dist);
}
float random1d(float n){
    return fract(sin(n) * 43758.5453);
}
float random2d(vec2 n) {
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}
       //1D NOISE
       //returns 0 - 1
float noise1d(float p){
        float fl = floor(p);
        float fc = fract(p);
        return mix(random1d(fl), random1d(fl + 1.0), fc);
    }

//2D NOISE cheap value noise
//returns 0 - 1
float noise2d(vec2 p){
        vec2 ip = floor(p);
        vec2 u = fract(p);
        u = u*u*(3.0-2.0*u);
        
        float res = mix(
        mix(random2d(ip),random2d(ip+vec2(1.0,0.0)),u.x),
        mix(random2d(ip+vec2(0.0,1.0)),random2d(ip+vec2(1.0,1.0)),u.x),u.y);
    return res*res;
}
vec2 fade(vec2 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}

float cnoise(vec2 P){
    vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
    vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
    Pi = mod(Pi, 289.0); // To avoid truncation effects in permutation
    vec4 ix = Pi.xzxz;
    vec4 iy = Pi.yyww;
    vec4 fx = Pf.xzxz;
    vec4 fy = Pf.yyww;
    vec4 i = permute(permute(ix) + iy);
    vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; // 1/41 = 0.024...
    vec4 gy = abs(gx) - 0.5;
    vec4 tx = floor(gx + 0.5);
    gx = gx - tx;
    vec2 g00 = vec2(gx.x,gy.x);
    vec2 g10 = vec2(gx.y,gy.y);
    vec2 g01 = vec2(gx.z,gy.z);
    vec2 g11 = vec2(gx.w,gy.w);
    vec4 norm = 1.79284291400159 - 0.85373472095314 * 
    vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
    g00 *= norm.x;
    g01 *= norm.y;
    g10 *= norm.z;
    g11 *= norm.w;
    float n00 = dot(g00, vec2(fx.x, fy.x));
    float n10 = dot(g10, vec2(fx.y, fy.y));
    float n01 = dot(g01, vec2(fx.z, fy.z));
    float n11 = dot(g11, vec2(fx.w, fy.w));
    vec2 fade_xy = fade(Pf.xy);
    vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
    float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
    return 2.3 * n_xy;
}

float Perlin2D( vec2 P ){
    //  https://github.com/BrianSharpe/Wombat/blob/master/Perlin2D.glsl
    // establish our grid cell and unit position
    vec2 Pi = floor(P);
    vec4 Pf_Pfmin1 = P.xyxy - vec4( Pi, Pi + 1.0 );
    // calculate the hash
    vec4 Pt = vec4( Pi.xy, Pi.xy + 1.0 );
    Pt = Pt - floor(Pt * ( 1.0 / 71.0 )) * 710.0;
    Pt += vec2( 26.0, 161.0 ).xyxy;
    Pt *= Pt;
    Pt = Pt.xzxz * Pt.yyww;
    vec4 hash_x = fract( Pt * ( 11.0 / 951.135664 ) );
    vec4 hash_y = fract( Pt * ( 11.0 / 642.949883 ) );
    
    // calculate the gradient results
    vec4 grad_x = hash_x - 0.49999;
    vec4 grad_y = hash_y - 0.49999;
    vec4 grad_results = inversesqrt( grad_x * grad_x + grad_y * grad_y ) * ( grad_x * Pf_Pfmin1.xzxz + grad_y * Pf_Pfmin1.yyww );
    
    // Classic Perlin Interpolation
    grad_results *= 1.4142135623730950488016887242097;  // scale things to a strict -1.0->1.0 range  *= 1.0/sqrt(0.5)
    vec2 blend = Pf_Pfmin1.xy * Pf_Pfmin1.xy * Pf_Pfmin1.xy * (Pf_Pfmin1.xy * (Pf_Pfmin1.xy * 6.0 - 15.0) + 10.0);
    vec4 blend2 = vec4( blend, vec2( 1.0 - blend ) );
    return dot( grad_results, blend2.zxzx * blend2.wwyy );
}

void main(){
    vec4 color = vec4(1.,0.,0.,1.);
    vec2 position = vUv;

    //define colors
    vec4 bgCol = texture2D(tDiffuse, position);
    vec4 circCol = vec4(background, colorOpacity);
    
    //warp uv space to make the circle warp based on uv coord and time
    vec2 warpUv = position + cnoise(position * warpNoise + time * 0.75) * warpMultiply;
    
    //draw circle
    float circ = circle2(warpUv, uMouse, resolution.x * uVelo * circleSize, circBlurMin + uVelo * circBlurMax);
    float grain = 1.; //1. - cnoise(position * grainUpper + time) * cnoise(position * grainLower +time);
    
    grain *= circ * grainExpand;
    
    vec4 col = mix(bgCol, circCol - (grain * grainMix), circ);
    color = col;
    
    
    gl_FragColor = color;
}


