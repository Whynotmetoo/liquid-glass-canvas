import * as THREE from 'three';
import { createCanvasLiquidGlass } from '../src';

const canvas = document.getElementById('bg-canvas') as HTMLCanvasElement;
const container = document.getElementById('container')!;
const panel = document.getElementById('glass-panel')!;

let width = window.innerWidth;
let height = window.innerHeight;

// Setup Three.js scene
const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: true });
renderer.setSize(width, height);
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020108);
scene.fog = new THREE.FogExp2(0x020108, 0.015);

const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 250);
camera.position.set(0, 10, 40);
camera.lookAt(0, 0, 0);

// Aurora Particles
const particleCount = 300000;
const posArray = new Float32Array(particleCount * 3);
const colorArray = new Float32Array(particleCount * 3);

for(let i = 0; i < particleCount; i++) {
  // Distribute particles in a circular area with a radius up to 140
  // Math.random() naturally concentrates particle density towards the center (focus area)
  const r = Math.random() * 140;
  const theta = Math.random() * Math.PI * 2;
  const x = Math.cos(theta) * r;
  const z = Math.sin(theta) * r;
  
  // y will be defined mostly by shader, but we give some initial vertical spread
  const y = (Math.random() - 0.5) * 20;
  
  posArray[i*3] = x;
  posArray[i*3+1] = y;
  posArray[i*3+2] = z;

  const color = new THREE.Color();
  // Aurora colors: primarily greens, with some blues, purples, and pinks
  let hue = 0.3 + Math.random() * 0.15; // mostly green to cyan
  if (Math.random() > 0.7) {
    hue = 0.6 + Math.random() * 0.3; // blue to pink
  }
  color.setHSL(hue, 1.0, 0.8);
  
  colorArray[i*3] = color.r;
  colorArray[i*3+1] = color.g;
  colorArray[i*3+2] = color.b;
}

const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

const particlesMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uPixelRatio: { value: window.devicePixelRatio }
  },
  vertexShader: `
    uniform float uTime;
    uniform float uPixelRatio;
    attribute vec3 color;
    varying vec3 vColor;
    varying float vFade;
    
    // Simple 3D noise function
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 = v - i + dot(i, C.xxx) ;
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute( permute( permute(
                 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
               + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
      float n_ = 0.142857142857;
      vec3  ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                    dot(p2,x2), dot(p3,x3) ) );
    }

    void main() {
      vColor = color;
      vec3 pos = position;
      
      // Wavy aurora pattern
      float noiseFreq = 0.02;
      float noiseAmp = 8.0;
      vec3 noisePos = vec3(pos.x * noiseFreq, pos.y * noiseFreq + uTime * 0.2, pos.z * noiseFreq);
      
      // Create curtain-like displacement
      float wave = sin(pos.x * 0.05 + uTime * 0.5) * cos(pos.z * 0.05 + uTime * 0.3) * 5.0;
      float noiseOffset = snoise(noisePos) * noiseAmp;
      
      pos.y += wave + noiseOffset;
      // create ribbon bends
      pos.x += snoise(vec3(pos.y * 0.05, uTime * 0.1, pos.z * 0.05)) * 4.0;
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      
      // Make particles pulse slightly
      float pulse = 1.0 + sin(uTime * 2.0 + pos.x) * 0.3;
      
      gl_PointSize = (120.0 * uPixelRatio * pulse) / -mvPosition.z;
      gl_Position = projectionMatrix * mvPosition;

      // --- Seamless Infinite Transitions ---
      float depth = -mvPosition.z;

      // 1. Near Fade: prevent particles popping/clipping right in front of the camera
      float nearFade = smoothstep(3.0, 12.0, depth);

      // 2. Center-radial Fade: fade out particles smoothly before they hit the generation limit
      // position.xz contains the original XZ coordinates (stable coordinates)
      float distFromCenter = length(position.xz);
      float centerFade = smoothstep(140.0, 75.0, distFromCenter);

      // 3. Exponential Depth Fog: fade out particles as they move deep into the scene
      float fogFactor = exp(-0.012 * depth);

      vFade = nearFade * centerFade * fogFactor;
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    varying float vFade;
    void main() {
      // Soft circular particle
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if (dist > 0.5) discard;
      
      // Soft glow
      float alpha = pow(1.0 - (dist * 2.0), 1.5) * vFade;
      gl_FragColor = vec4(vColor, alpha);
    }
  `,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

const auroraMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(auroraMesh);

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  particlesMaterial.uniforms.uPixelRatio.value = window.devicePixelRatio;
}
window.addEventListener('resize', resize);

const glass = createCanvasLiquidGlass({
  source: canvas,
  container: container,
  dpr: 'auto'
});

glass.registerLens(panel, {
  radius: 32,
  depth: 120, // Increased depth for better distortion
  feather: 24,
  curve: 2,
  chroma: 0.1,
  tint: 'rgba(255, 255, 255, 0.05)',
  glint: 0.6
});

glass.start();

function loop() {
  const time = performance.now() / 1000;
  
  particlesMaterial.uniforms.uTime.value = time;
  
  // Slow camera rotation
  camera.position.x = Math.sin(time * 0.1) * 35;
  camera.position.z = Math.cos(time * 0.1) * 35;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
loop();

let isDragging = false;
let startX = 0;
let startY = 0;
let initialLeft = 0;
let initialTop = 0;

panel.addEventListener('mousedown', (e) => {
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
  
  if (panel.style.margin !== '0px') {
    initialLeft = panel.offsetLeft;
    initialTop = panel.offsetTop;
    panel.style.margin = '0px';
    panel.style.left = `${initialLeft}px`;
    panel.style.top = `${initialTop}px`;
  } else {
    initialLeft = parseFloat(panel.style.left) || 0;
    initialTop = parseFloat(panel.style.top) || 0;
  }
});

window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const dx = e.clientX - startX;
  const dy = e.clientY - startY;
  panel.style.left = `${initialLeft + dx}px`;
  panel.style.top = `${initialTop + dy}px`;
});

window.addEventListener('mouseup', () => {
  isDragging = false;
});
