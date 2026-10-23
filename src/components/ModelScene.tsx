import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { CharacterCfg } from "../lib/types";

const H = 2.5; // model ke ei height e normalize kora hoy
const DUST = 140;

function shadowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, "rgba(0,0,0,.75)");
  r.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

function dotTexture() {
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

export default function ModelScene({ cfg, className = "" }: { cfg: CharacterCfg; className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [bust, setBust] = useState(false); // adha-sharir model hole nichey soft fade

  useEffect(() => {
    const el = host.current!;
    setFailed(false);
    setLoaded(false);
    setBust(false);
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.55;
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);

    const key = new THREE.DirectionalLight(0xffd7a8, 2.6);
    const rim = new THREE.DirectionalLight(0xd9a15b, 2.4);
    rim.position.set(-2.5, 2, -3);
    const fill = new THREE.DirectionalLight(0xbfd4ff, 0.45); // thanda halka fill — shadow side e depth
    fill.position.set(-3, 0.5, 2.5);
    scene.add(key, rim, fill, new THREE.HemisphereLight(0xffffff, 0x1a1410, 0.5));

    const root = new THREE.Group(); // mouse-follow + drag rotation
    const holder = new THREE.Group(); // admin slider: scale / y / rotation
    root.add(holder);
    scene.add(root);

    let disposed = false, raf = 0, visible = true, W = 1.2;
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -H / 2 + 0.005;
    scene.add(shadow);

    // pichone bhasha amber dust — depth er feel
    const dustPos = new Float32Array(DUST * 3);
    const dustSpeed = new Float32Array(DUST);
    for (let i = 0; i < DUST; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 4.2;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 3.4;
      dustPos[i * 3 + 2] = -0.6 - Math.random() * 1.6;
      dustSpeed[i] = 0.05 + Math.random() * 0.12;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      size: 0.05, map: dotTexture(), transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    const draco = new DRACOLoader();
    draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.setCrossOrigin("anonymous");

    const fit = () => {
      const w = el.clientWidth || 1, h = el.clientHeight || 1;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const z = Math.max((H * 1.12) / 2 / t, (W * 1.5) / 2 / (t * camera.aspect));
      camera.position.set(0, 0.05, z);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    };

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
        model.position.y -= box.min.y + H / 2; // paa neeche
        W = Math.max(size.x, size.z) * s;
        const isBust = size.y / Math.max(size.x, size.z) < 2.4;
        setBust(isBust);
        shadow.visible = !isBust;
        shadow.scale.set(W * 1.6, W * 1.6, 1);
        model.traverse((o) => {
          const m = o as THREE.Mesh;
          if (m.isMesh) {
            const mat = m.material as THREE.MeshStandardMaterial;
            mat.side = THREE.FrontSide;
            if (mat.map) mat.map.anisotropy = 8;
          }
        });
        holder.add(model);
        fit();
        setLoaded(true);
      },
      undefined,
      (e) => {
        console.warn("GLB load failed", e);
        if (!disposed) setFailed(true);
      }
    );

    // mouse-follow + drag-to-rotate (touch e o kaj kore, vertical scroll block hoy na)
    const target = new THREE.Vector2(), cur = new THREE.Vector2();
    let dragging = false, lastX = 0, drag = 0, vel = 0;
    const onMove = (e: PointerEvent) => {
      target.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
      if (dragging) {
        vel = (e.clientX - lastX) * 0.012;
        drag += vel;
        lastX = e.clientX;
      }
    };
    const down = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      el.setPointerCapture(e.pointerId);
      el.classList.add("grabbing");
    };
    const up = (e: PointerEvent) => {
      dragging = false;
      el.classList.remove("grabbing");
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    };
    window.addEventListener("pointermove", onMove);
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);

    const ro = new ResizeObserver(fit);
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const clock = new THREE.Clock();

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      const c = cfgRef.current;
      const t = clock.getElapsedTime();
      const k = reduce ? 0 : 1;
      cur.lerp(target, 0.06);
      if (!dragging) {
        drag += vel; // inertia
        vel *= 0.94;
        drag *= 0.985; // dhire dhire mouse-follow e fire ashe
      }
      root.rotation.y = cur.x * 0.55 * k + Math.sin(t * 0.5) * 0.05 * k + drag;
      root.rotation.x = cur.y * 0.06 * k;
      holder.rotation.y = THREE.MathUtils.degToRad(c.modelRotation);
      holder.scale.setScalar(c.modelScale);
      holder.position.y = c.modelY + Math.sin(t * 0.9) * 0.012 * k;
      renderer.toneMappingExposure = c.modelLight;
      key.position.set(cur.x * 3 + 1.5, 2.5 - cur.y * 1.5, 3.5);

      if (!reduce) {
        const p = dustGeo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < DUST; i++) {
          let y = p.getY(i) + dustSpeed[i] * 0.016;
          if (y > 1.8) y = -1.8;
          p.setY(i, y);
        }
        p.needsUpdate = true;
        dust.position.x = -cur.x * 0.15;
      }
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      ro.disconnect();
      io.disconnect();
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
      draco.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [cfg.model]);

  if (failed) return <img className={`char-fallback ${className}`} src={cfg.image} alt="" />;
  return (
    <div className={`char-wrap ${className}`}>
      <div ref={host} className={`char-canvas ${bust ? "fade-bottom" : ""} ${loaded ? "is-loaded" : ""}`} />
      {!loaded && <span className="char-loader" aria-label="Loading 3D model" />}
    </div>
  );
}
