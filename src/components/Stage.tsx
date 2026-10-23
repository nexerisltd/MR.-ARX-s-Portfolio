import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { CharacterCfg } from "../lib/types";

/**
 * Fixed full-screen 3D stage: character scroll er shathe section theke section e
 * soreh, ghure, boro-choto hoy. Section gulo `data-stage="<id>"` diye mark kora.
 * x,y = screen NDC (-1..1) · s = scale · r = extra rotation (deg) · o = opacity
 */
interface St { x: number; y: number; s: number; r: number; o: number }
const DESK: Record<string, St> = {
  hero:    { x: 0.5,   y: -0.02, s: 1.18, r: 0,   o: 1 },
  about:   { x: -0.56, y: -0.04, s: 0.95, r: 40,  o: 1 },
  skills:  { x: 0.62,  y: -0.04, s: 0.88, r: -45, o: 1 },
  journey: { x: -0.6,  y: -0.08, s: 0.82, r: 30,  o: 1 },
  work:    { x: 0,     y: -0.1,  s: 0.7,  r: 0,   o: 0 },
  contact: { x: 0.52,  y: -0.02, s: 1.1,  r: -25, o: 1 },
};
const MOB: Record<string, St> = {
  hero:    { x: 0, y: -0.52, s: 0.74, r: 0,   o: 1 },
  about:   { x: 0, y: -0.05, s: 0.9,  r: 30,  o: 0.1 },
  skills:  { x: 0, y: -0.05, s: 0.9,  r: -30, o: 0.1 },
  journey: { x: 0, y: -0.05, s: 0.9,  r: 20,  o: 0.1 },
  work:    { x: 0, y: -0.05, s: 0.8,  r: 0,   o: 0 },
  contact: { x: 0, y: 0.0,   s: 1.0,  r: -20, o: 0.2 },
};
const CAM_Z = 7;
const H = 2.5;
const DUST = 220;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const ease = (t: number) => t * t * (3 - 2 * t);
const mix = (a: St, b: St, t: number): St => ({
  x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, s: a.s + (b.s - a.s) * t,
  r: a.r + (b.r - a.r) * t, o: a.o + (b.o - a.o) * t,
});

function glow() {
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  r.addColorStop(0, "rgba(255,214,150,1)");
  r.addColorStop(1, "rgba(255,214,150,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
}

export default function Stage({ cfg, onFail }: { cfg: CharacterCfg; onFail: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;

  useEffect(() => {
    const el = host.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      onFail();
      window.dispatchEvent(new Event("stage-ready"));
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.opacity = "0";

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.55;
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 80);
    camera.position.set(0, 0, CAM_Z);

    const key = new THREE.DirectionalLight(0xffd7a8, 2.6);
    const rim = new THREE.DirectionalLight(0xd9a15b, 2.4);
    rim.position.set(-2.5, 2, -3);
    const fill = new THREE.DirectionalLight(0xbfd4ff, 0.45);
    fill.position.set(-3, 0.5, 2.5);
    scene.add(key, rim, fill, new THREE.HemisphereLight(0xffffff, 0x1a1410, 0.5));

    const root = new THREE.Group(); // position / scale / scroll rotation
    const holder = new THREE.Group(); // admin: rotation / scale / y
    root.add(holder);
    scene.add(root);

    // dust — poora screen e, scroll e upor uthe
    const dPos = new Float32Array(DUST * 3);
    const dSpd = new Float32Array(DUST);
    for (let i = 0; i < DUST; i++) {
      dPos[i * 3] = (Math.random() - 0.5) * 9;
      dPos[i * 3 + 1] = (Math.random() - 0.5) * 5.2;
      dPos[i * 3 + 2] = -4 + Math.random() * 5;
      dSpd[i] = 0.04 + Math.random() * 0.1;
    }
    const dGeo = new THREE.BufferGeometry();
    dGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
    const dust = new THREE.Points(
      dGeo,
      new THREE.PointsMaterial({ size: 0.07, map: glow(), transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    scene.add(dust);

    let disposed = false, raf = 0, visH = 1, visW = 1, ready = false;
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.setCrossOrigin("anonymous");

    const fit = () => {
      const w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      visH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * CAM_Z;
      visW = visH * camera.aspect;
    };
    fit();
    window.addEventListener("resize", fit);

    loader.load(
      cfg.model,
      (gltf) => {
        if (disposed) return;
        const model = gltf.scene;
        let box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const s = H / size.y;
        model.scale.multiplyScalar(s);
        box = new THREE.Box3().setFromObject(model);
        const c = box.getCenter(new THREE.Vector3());
        model.position.x -= c.x;
        model.position.z -= c.z;
        model.position.y -= c.y;
        const bust = size.y / Math.max(size.x, size.z) < 2.4;
        model.traverse((o) => {
          const m = o as THREE.Mesh;
          if (!m.isMesh) return;
          const mat = m.material as THREE.MeshStandardMaterial;
          mat.side = THREE.FrontSide;
          if (mat.map) mat.map.anisotropy = 8;
          if (bust) {
            // adha-sharir model: nichey alpha fade, jate hawa-e kata na lage
            m.geometry.computeBoundingBox();
            const bb = m.geometry.boundingBox!;
            const minY = bb.min.y, span = bb.max.y - bb.min.y;
            mat.transparent = true;
            mat.onBeforeCompile = (sh) => {
              sh.vertexShader = sh.vertexShader
                .replace("#include <common>", "#include <common>\nvarying float vLY;")
                .replace("#include <begin_vertex>", "#include <begin_vertex>\nvLY = position.y;");
              sh.fragmentShader = sh.fragmentShader
                .replace("#include <common>", "#include <common>\nvarying float vLY;")
                .replace("#include <dithering_fragment>", `#include <dithering_fragment>\ngl_FragColor.a *= smoothstep(${minY.toFixed(5)}, ${(minY + span * 0.26).toFixed(5)}, vLY);`);
            };
            mat.needsUpdate = true;
          }
        });
        holder.add(model);
        ready = true;
        window.dispatchEvent(new Event("stage-ready"));
      },
      undefined,
      (e) => {
        console.warn("GLB load failed", e);
        if (!disposed) onFail();
        window.dispatchEvent(new Event("stage-ready"));
      }
    );

    // --- input ---
    const target = new THREE.Vector2(), cur = new THREE.Vector2();
    let dragging = false, lastX = 0, drag = 0, dvel = 0;
    const onMove = (e: PointerEvent) => {
      target.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
      if (dragging) { dvel = (e.clientX - lastX) * 0.012; drag += dvel; lastX = e.clientX; }
    };
    const onDown = (e: PointerEvent) => {
      if ((e.target as Element | null)?.closest?.("[data-stage-drag]")) { dragging = true; lastX = e.clientX; document.body.classList.add("grabbing"); }
    };
    const onUp = () => { dragging = false; document.body.classList.remove("grabbing"); };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    // --- per-frame ---
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const clock = new THREE.Clock();
    let state: St | null = null, lastY = window.scrollY, spin = 0, intro = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.12);
      const t = clock.elapsedTime;
      const vh = window.innerHeight;
      const table = window.innerWidth < 800 ? MOB : DESK;
      const secs = document.querySelectorAll<HTMLElement>("[data-stage]");
      if (!secs.length) return;

      // target state: ek ek kore proti section e blend — porer section er top uthe ashle
      let tgt = table[secs[0].dataset.stage!] ?? table.hero;
      for (let i = 1; i < secs.length; i++) {
        const top = secs[i].getBoundingClientRect().top;
        const k = clamp01((vh * 0.92 - top) / (vh * 0.8));
        if (k > 0) tgt = mix(tgt, table[secs[i].dataset.stage!] ?? tgt, ease(k));
      }
      state = state ? mix(state, tgt, reduce ? 1 : 0.075) : tgt;

      // scroll velocity → halka lean/spin
      const y = window.scrollY;
      const vel = y - lastY;
      lastY = y;
      spin += (Math.max(-0.7, Math.min(0.7, vel * 0.012)) - spin) * 0.08;

      cur.lerp(target, 0.06);
      if (!dragging) { drag += dvel; dvel *= 0.94; drag *= 0.985; }
      const k = reduce ? 0 : 1;
      if (document.documentElement.classList.contains("ready") && ready) intro = Math.min(1, intro + dt / 1.5);
      const ie = 1 - Math.pow(1 - intro, 3);

      const c = cfgRef.current;
      root.position.set(state.x * (visW / 2), state.y * (visH / 2) - (1 - ie) * 0.35, 0);
      root.scale.setScalar(state.s);
      root.rotation.y = THREE.MathUtils.degToRad(state.r) + cur.x * 0.4 * k + drag + spin * k + Math.sin(t * 0.5) * 0.04 * k;
      root.rotation.x = cur.y * 0.05 * k;
      holder.rotation.y = THREE.MathUtils.degToRad(c.modelRotation);
      holder.scale.setScalar(c.modelScale);
      holder.position.y = c.modelY + Math.sin(t * 0.9) * 0.012 * k;
      renderer.toneMappingExposure = c.modelLight;
      key.position.set(cur.x * 3 + 1.5, 2.5 - cur.y * 1.5, 3.5);
      renderer.domElement.style.opacity = String((state.o * ie).toFixed(3));

      if (!reduce) {
        const p = dGeo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < DUST; i++) {
          let py = p.getY(i) + dSpd[i] * dt * (1 + Math.max(-3, Math.min(10, vel * 0.3)));
          if (py > 2.7) py = -2.7;
          else if (py < -2.7) py = 2.7;
          p.setY(i, py);
        }
        p.needsUpdate = true;
        dust.position.x = -cur.x * 0.25;
      }
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh && !(o as THREE.Points).isPoints) return;
        m.geometry.dispose();
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        mats.forEach((mt) => {
          Object.values(mt).forEach((v) => (v as THREE.Texture)?.isTexture && (v as THREE.Texture).dispose());
          mt.dispose();
        });
      });
      envTex.dispose();
      pmrem.dispose();
      dracoLoader.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.model]);

  return <div ref={host} className="stage" aria-hidden />;
}
