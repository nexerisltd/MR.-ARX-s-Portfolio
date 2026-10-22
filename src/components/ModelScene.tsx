import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { CharacterCfg } from "../lib/types";

const H = 2.5; // model ke ei height e normalize kora hoy

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

export default function ModelScene({ cfg, className = "" }: { cfg: CharacterCfg; className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;
  const [failed, setFailed] = useState(false);
  const [bust, setBust] = useState(false); // adha-sharir model hole nichey soft fade

  useEffect(() => {
    const el = host.current!;
    setFailed(false);
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
    const rim = new THREE.DirectionalLight(0xd9a15b, 2.2);
    rim.position.set(-2.5, 2, -3);
    scene.add(key, rim, new THREE.HemisphereLight(0xffffff, 0x1a1410, 0.5));

    const root = new THREE.Group(); // mouse-follow rotation
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
      },
      undefined,
      (e) => {
        console.warn("GLB load failed", e);
        if (!disposed) setFailed(true);
      }
    );

    const target = new THREE.Vector2(), cur = new THREE.Vector2();
    const onMove = (e: PointerEvent) => target.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    window.addEventListener("pointermove", onMove);
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
      root.rotation.y = cur.x * 0.55 * k + Math.sin(t * 0.5) * 0.05 * k;
      root.rotation.x = cur.y * 0.06 * k;
      holder.rotation.y = THREE.MathUtils.degToRad(c.modelRotation);
      holder.scale.setScalar(c.modelScale);
      holder.position.y = c.modelY + Math.sin(t * 0.9) * 0.012 * k;
      renderer.toneMappingExposure = c.modelLight;
      key.position.set(cur.x * 3 + 1.5, 2.5 - cur.y * 1.5, 3.5);
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      ro.disconnect();
      io.disconnect();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
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
  return <div ref={host} className={`char-canvas ${bust ? "fade-bottom" : ""} ${className}`} />;
}
