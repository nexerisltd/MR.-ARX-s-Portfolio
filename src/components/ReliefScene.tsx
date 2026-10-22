import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { CharacterCfg } from "../lib/types";

const VERT = /* glsl */ `
varying vec2 vUv;
uniform sampler2D uDepth;
uniform float uScale;
void main() {
  vUv = uv;
  float d = texture2D(uDepth, uv).r;
  vec3 p = position;
  p.z += (d - 0.5) * uScale;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;

const FRAG = /* glsl */ `
varying vec2 vUv;
uniform sampler2D uMap;
uniform sampler2D uDepth;
uniform float uCut;
uniform float uBright;
uniform vec2 uLight;
uniform vec2 uTexel;
void main() {
  float d = texture2D(uDepth, vUv).r;
  float a = smoothstep(uCut - 0.05, uCut + 0.05, d);
  // photo er kinara fade — hard rectangle edge thake na
  a *= smoothstep(0.0, 0.16, vUv.y) * smoothstep(1.0, 0.94, vUv.y) * smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.86, vUv.x);
  if (a < 0.02) discard;
  vec2 o = uTexel * 6.0;
  float dx = texture2D(uDepth, vUv + vec2(o.x, 0.0)).r - texture2D(uDepth, vUv - vec2(o.x, 0.0)).r;
  float dy = texture2D(uDepth, vUv + vec2(0.0, o.y)).r - texture2D(uDepth, vUv - vec2(0.0, o.y)).r;
  vec3 n = normalize(vec3(-dx * 10.0, -dy * 10.0, 1.0));
  vec3 L = normalize(vec3(uLight.x * 0.9, uLight.y * 0.9, 0.75));
  float diff = max(dot(n, L), 0.0);
  float rim = pow(1.0 - max(n.z, 0.0), 2.0);
  vec3 tex = texture2D(uMap, vUv).rgb;
  vec3 c = tex * uBright * (0.55 + diff * 0.75) + vec3(1.0, 0.72, 0.4) * rim * 0.22;
  gl_FragColor = vec4(c, a);
  #include <colorspace_fragment>
}`;

export default function ReliefScene({ cfg, className = "" }: { cfg: CharacterCfg; className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const mat = useRef<THREE.ShaderMaterial | null>(null);
  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;
  const [failed, setFailed] = useState(false);

  // sliders: scene rebuild na kore uniform update
  useEffect(() => {
    const m = mat.current;
    if (!m) return;
    m.uniforms.uScale.value = cfg.depthStrength * 1.4;
    m.uniforms.uCut.value = cfg.cutout;
    m.uniforms.uBright.value = cfg.brightness;
  }, [cfg.depthStrength, cfg.cutout, cfg.brightness]);

  useEffect(() => {
    const el = host.current!;
    setFailed(false);
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    const group = new THREE.Group();
    scene.add(group);

    let disposed = false, raf = 0, visible = true;
    let W = 2, H = 2.5;
    const target = new THREE.Vector2(), cur = new THREE.Vector2();
    const onMove = (e: PointerEvent) => {
      target.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove);

    const fit = () => {
      const w = el.clientWidth || 1, h = el.clientHeight || 1;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      camera.position.z = Math.max((H * 1.1) / 2 / t, (W * 1.15) / 2 / (t * camera.aspect));
      camera.updateProjectionMatrix();
    };

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    Promise.all([loader.loadAsync(cfg.image), loader.loadAsync(cfg.depth)])
      .then(([map, depth]) => {
        if (disposed) return;
        map.colorSpace = THREE.SRGBColorSpace;
        map.anisotropy = 4;
        depth.minFilter = depth.magFilter = THREE.LinearFilter;
        depth.generateMipmaps = false;
        const aspect = map.image.width / map.image.height;
        H = 2.5;
        W = H * aspect;
        const c = cfgRef.current;
        const material = new THREE.ShaderMaterial({
          vertexShader: VERT,
          fragmentShader: FRAG,
          transparent: true,
          uniforms: {
            uMap: { value: map },
            uDepth: { value: depth },
            uScale: { value: c.depthStrength * 1.4 },
            uCut: { value: c.cutout },
            uBright: { value: c.brightness },
            uLight: { value: new THREE.Vector2(0.4, -0.3) },
            uTexel: { value: new THREE.Vector2(1 / depth.image.width, 1 / depth.image.height) },
          },
        });
        mat.current = material;
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(W, H, Math.round(180 * aspect), 180), material);
        group.add(mesh);
        fit();
      })
      .catch(() => !disposed && setFailed(true));

    const ro = new ResizeObserver(fit);
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const clock = new THREE.Clock();
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      const t = clock.getElapsedTime();
      cur.lerp(target, 0.06);
      const k = reduce ? 0 : 1;
      group.rotation.y = cur.x * 0.38 * k + Math.sin(t * 0.6) * 0.04 * k;
      group.rotation.x = cur.y * 0.16 * k;
      group.position.y = Math.sin(t * 0.9) * 0.015 * k;
      if (mat.current) (mat.current.uniforms.uLight.value as THREE.Vector2).set(cur.x * -1 + 0.2, cur.y * -1);
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      ro.disconnect();
      io.disconnect();
      group.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
      });
      mat.current?.uniforms.uMap.value.dispose();
      mat.current?.uniforms.uDepth.value.dispose();
      mat.current?.dispose();
      mat.current = null;
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [cfg.image, cfg.depth]);

  if (failed) return <img className={`char-fallback ${className}`} src={cfg.image} alt="" />;
  return <div ref={host} className={`char-canvas ${className}`} />;
}
