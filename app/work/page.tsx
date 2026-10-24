"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Archivo_Black, IBM_Plex_Mono, Manrope } from "next/font/google";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
/* Fonts */
const archivo = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
});
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
/* Project data */
const HOME = "/";
const projects = [
  {
    title: "Clean",
    category: "Laundry booking",
    image: "/project-clean.jpg",
    post: "DeEAQ1BjzAy",
  },
  {
    title: "bilai.",
    category: "Cat adoption",
    image: "/project-bilai.jpg",
    post: "DdgzUE5j68j",
  },
  {
    title: "Giftour",
    category: "Travel app",
    image: "/project-giftour.jpg",
    post: "DdZJfl3j2Y1",
  },
];
type Action = "up" | "down" | "left" | "right" | "a" | "b" | "select" | "start";
const meshNames: Record<Action, string> = {
  up: "gba_dpad",
  down: "gba_dpad",
  left: "gba_dpad",
  right: "gba_dpad",
  a: "gba_button_A",
  b: "gba_button_B",
  start: "gba_button_start",
  select: "gba_button_select",
};
/* ================================================================*
   GAMEBOY
   Model, screen, physical buttons, rotation, zoom and related styles
*   ================================================================ */
function Gameboy({ selected, onSelect }: { selected: number; onSelect: (index: number) => void }) {
  const router = useRouter();
  const host = useRef<HTMLDivElement>(null);
  const index = useRef(selected);
  const navigation = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drawScreen = useRef<() => void>(() => {});
  const press = useRef<(action: Action, held?: boolean) => void>(() => {});
  const act = useRef<(action: Action) => void>(() => {});
  const [error, setError] = useState("");
  const project = projects[selected];
  useEffect(() => {
    act.current = (action) => {
      press.current(action);
      if (action === "b") {
        if (navigation.current) clearTimeout(navigation.current);
        try {
          sessionStorage.setItem("gator-intro-seen", "1");
        } catch {}
        router.push(HOME);
        return;
      }
      if (action === "a" || action === "start") {
        if (navigation.current) clearTimeout(navigation.current);
        const url = `https://www.instagram.com/gator.gd/p/` + `${projects[index.current].post}/`;
        navigation.current = setTimeout(() => {
          window.location.assign(url);
        }, 100);
        return;
      }
      index.current =
        (index.current + (["left", "up"].includes(action) ? -1 : 1) + projects.length) % projects.length;
      onSelect(index.current);
      drawScreen.current();
    };
  }, [router, onSelect]);
  useEffect(() => {
    const mount = host.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !matchMedia("(pointer: coarse)").matches,
        powerPreference: "low-power",
      });
    } catch {
      setError("Your browser could not start 3D. Open a project below or reload to try again.");
      return;
    }
    const canvas = renderer.domElement;
    canvas.tabIndex = 0;
    canvas.setAttribute("aria-label", "Game Boy: drag to rotate; arrows browse; A opens; B returns.");
    mount.appendChild(canvas);
    const scene = new THREE.Scene();
    const pivot = new THREE.Group();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.001, 10);
    camera.position.z = 1;
    scene.add(pivot);
    const target = new THREE.Quaternion();
    const ray = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const lcd = document.createElement("canvas");
    lcd.width = 768;
    lcd.height = 512;
    const ctx = lcd.getContext("2d")!;
    const texture = new THREE.CanvasTexture(lcd);
    texture.colorSpace = THREE.SRGBColorSpace;
    const buttons = new Map<
      string,
      {
        node: THREE.Object3D;
        z: number;
        rotation: THREE.Euler;
        amount: number;
      }
    >();
    const images = new Map<string, HTMLImageElement>();
    const abort = new AbortController();
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let disposed = false;
    let radius = 0.085;
    let zoom = 1;
    let ready = false;
    let previous = 0;
    let mode: "rotate" | "zoom" | "button" | null = null;
    let action: Action | null = null;
    let moved = false;
    let x = 0;
    let y = 0;
    let startX = 0,
      startY = 0;
    let activePointer: number | null = null;
    let pressed: {
      action: Action;
      held: boolean;
      until: number;
    } | null = null;
    /* Gameboy: camera framing */
    const fit = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      const half = radius * 1.04 * Math.max(1, height / width);
      renderer.setPixelRatio(
        Math.min(devicePixelRatio || 1, matchMedia("(pointer: coarse)").matches ? 1.25 : 1.7),
      );
      renderer.setSize(width, height);
      camera.left = (-half * width) / height;
      camera.right = (half * width) / height;
      camera.top = half;
      camera.bottom = -half;
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
    };
    /* Gameboy: project screen */
    const paint = () => {
      if (disposed) return;
      const current = projects[index.current];
      const image = images.get(current.image);
      ctx.fillStyle = "#b5cc95";
      ctx.fillRect(0, 0, 768, 512);
      ctx.fillStyle = "#1b321c";
      ctx.font = `500 24px ${mono.style.fontFamily}`;
      ctx.fillText("GATOR / WORK", 26, 40);
      ctx.fillText(`0${index.current + 1} / 03`, 610, 40);
      if (image?.complete && image.naturalWidth) {
        const scale = Math.max(768 / image.width, 292 / image.height);
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 62, 768, 292);
        ctx.clip();
        ctx.filter = "grayscale(1) contrast(1.12)";
        ctx.drawImage(
          image,
          (768 - image.width * scale) / 2,
          62 + (292 - image.height * scale) / 2,
          image.width * scale,
          image.height * scale,
        );
        ctx.globalCompositeOperation = "multiply";
        ctx.fillStyle = "#b5cc95";
        ctx.fillRect(0, 62, 768, 292);
        ctx.restore();
      } else if (!image) {
        const next = new Image();
        images.set(current.image, next);
        next.onload = paint;
        next.src = current.image;
      }
      ctx.font = `500 20px ${mono.style.fontFamily}`;
      ctx.fillText(`${current.category} · 2026`.toUpperCase(), 26, 389);
      ctx.font = `400 54px ${archivo.style.fontFamily}`;
      ctx.fillText(current.title.toUpperCase(), 26, 450);
      ctx.font = `500 20px ${mono.style.fontFamily}`;
      ctx.fillText(projects.map((_, i) => (i === index.current ? "●" : "○")).join(" "), 26, 490);
      ctx.fillText("A : INSTAGRAM", 560, 490);
      ctx.fillStyle = "#19381918";
      for (let line = 0; line < 512; line += 5) {
        ctx.fillRect(0, line, 768, 1);
      }
      texture.needsUpdate = true;
      schedule();
    };
    /* Gameboy: smooth rotation and physical button animation */
    function render(now: number) {
      frame = 0;
      if (disposed || document.hidden) return;
      const ease = motion.matches ? 1 : 1 - Math.exp(-Math.min(40, now - previous || 16) / 55);
      previous = now;
      pivot.quaternion.slerp(target, ease);
      let moving = pivot.quaternion.angleTo(target) > 0.001;
      buttons.forEach(({ node, z, rotation, amount }, name) => {
        const active = pressed && meshNames[pressed.action] === name && (pressed.held || now < pressed.until);
        const next = motion.matches ? 0 : THREE.MathUtils.lerp(amount, active ? 1 : 0, 0.3);
        buttons.get(name)!.amount = next;
        node.position.z = z - next * (name === "gba_dpad" ? 0.0002 : 0.002);
        node.rotation.copy(rotation);
        node.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material instanceof THREE.ShaderMaterial) {
            child.material.uniforms.press.value = next;
          }
        });
        if (name === "gba_dpad" && pressed) {
          node.rotation.x += next * (pressed.action === "up" ? -0.18 : pressed.action === "down" ? 0.18 : 0);
          node.rotation.y +=
            next * (pressed.action === "left" ? -0.18 : pressed.action === "right" ? 0.18 : 0);
        }
        moving ||= Math.abs(next - (active ? 1 : 0)) > 0.001 || Boolean(active && !pressed?.held);
      });
      renderer.render(scene, camera);
      if (moving || mode === "rotate") schedule();
    }
    function schedule() {
      if (!disposed && !document.hidden && !frame) {
        frame = requestAnimationFrame(render);
      }
    }
    const reset = () => {
      activePointer = null;
      mode = null;
      action = null;
      zoom = 1;
      if (pressed) {
        pressed.held = false;
        pressed.until = 0;
      }
      target.identity();
      fit();
      renderer.render(scene, camera);
      schedule();
    };
    press.current = (nextAction, held = false) => {
      pressed = {
        action: nextAction,
        held,
        until: performance.now() + 110,
      };
      schedule();
    };
    drawScreen.current = paint;
    /* Gameboy: resource cleanup */
    const disposeObject = (object: THREE.Object3D) => {
      object.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return;
        node.geometry.dispose();
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        for (const material of materials) {
          if (material instanceof THREE.ShaderMaterial) {
            Object.values(material.uniforms).forEach(({ value }) => {
              if (value instanceof THREE.Texture) value.dispose();
            });
          }
          Object.values(material).forEach((value) => {
            if (value instanceof THREE.Texture) value.dispose();
          });
          material.dispose();
        }
      });
    };
    void document.fonts.ready.then(() => {
      if (!disposed) {
        paint();
        schedule();
      }
    });
    /* Gameboy: load model and recreate reference lighting */
    new GLTFLoader().load(
      "/gator-gba.glb",
      (gltf) => {
        if (disposed) {
          disposeObject(gltf.scene);
          return;
        }
        const body = gltf.scene;
        const glass = body.getObjectByName("gba_screen_glass");
        if (glass) glass.visible = false;
        const screen = new THREE.Mesh(
          new THREE.PlaneGeometry(0.06135, 0.04202),
          new THREE.MeshBasicMaterial({
            map: texture,
            toneMapped: false,
          }),
        );
        screen.position.set(0.000025, 0.04509, 0.00356);
        body.add(screen);
        body.updateMatrixWorld(true);
        body.traverse((node) => {
          if (!(node instanceof THREE.Mesh) || !node.visible || node === screen) return;
          const original = node.material as THREE.MeshStandardMaterial;
          node.material = new THREE.ShaderMaterial({
            uniforms: {
              map: { value: original.map },
              press: { value: 0 },
            },
            vertexShader: `
              varying vec2 vUV;
              varying float vLight;
              void main() {
                vUV = uv;
                vec3 n = normalize(normalMatrix * normal);
                float key = max(
                  dot(n, normalize(vec3(-.5, .8, 1.))),
                  0.
                );
                float rim = pow(1. - abs(n.z), 2.);
                float fill = max(
                  dot(n, normalize(vec3(.8, .1, .5))),
                  0.
                );
                vLight = clamp(
                  .62 + .48 * key + .18 * fill + .2 * rim,
                  .4,
                  1.26
                );
                gl_Position =
                  projectionMatrix *
                  modelViewMatrix *
                  vec4(position, 1.);
              }
            `,
            fragmentShader: `
              uniform sampler2D map;
              uniform float press;
              varying vec2 vUV;
              varying float vLight;
              void main() {
                vec4 color = texture2D(map, vUV);
                float greenRatio = color.g / max(max(color.r, color.b), .015);
                float greenMask = smoothstep(1.08, 1.6, greenRatio);
                vec3 finish = color.rgb * (1. + greenMask * .28);
                gl_FragColor = vec4(
                  finish * vLight * (1. - press * .22),
                  1.
                );
              }
            `,
          });
          original.dispose();
        });
        /* Tight vertex bounds prevent the console appearing distant. */
        const box = new THREE.Box3();
        const point = new THREE.Vector3();
        const visitVertices = (visit: (point: THREE.Vector3) => void) => {
          body.traverse((node) => {
            if (!(node instanceof THREE.Mesh) || !node.visible) return;
            const positions = node.geometry.getAttribute("position");
            for (let i = 0; i < positions.count; i++) {
              point.fromBufferAttribute(positions, i).applyMatrix4(node.matrixWorld);
              visit(point);
            }
          });
        };
        visitVertices((point) => box.expandByPoint(point));
        const center = box.getCenter(new THREE.Vector3());
        radius = 0;
        visitVertices((point) => {
          radius = Math.max(radius, point.distanceTo(center));
        });
        radius += 0.002;
        body.position.sub(center);
        pivot.add(body);
        Object.values(meshNames).forEach((name) => {
          const node = body.getObjectByName(name);
          if (node) {
            buttons.set(name, {
              node,
              z: node.position.z,
              rotation: node.rotation.clone(),
              amount: 0,
            });
          }
        });
        ready = true;
        fit();
        paint();
        schedule();
      },
      undefined,
      () => {
        if (!disposed) {
          setError("Model could not load. Check public/gator-gba.glb.");
        }
      },
    );
    /* Gameboy: mouse and touch controls */
    canvas.addEventListener(
      "pointerdown",
      (event) => {
        if (
          !ready ||
          event.isPrimary === false ||
          activePointer !== null ||
          (event.pointerType === "mouse" && ![0, 1].includes(event.button))
        )
          return;
        event.preventDefault();
        canvas.focus({ preventScroll: true });
        activePointer = event.pointerId;
        canvas.setPointerCapture?.(event.pointerId);
        x = startX = event.clientX;
        y = startY = event.clientY;
        moved = false;
        if (event.pointerType === "mouse" && event.button === 1) {
          mode = "zoom";
          return;
        }
        const rect = canvas.getBoundingClientRect();
        pointer.set(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          1 - ((event.clientY - rect.top) / rect.height) * 2,
        );
        ray.setFromCamera(pointer, camera);
        const hit = ray.intersectObject(pivot, true).find((entry) => entry.object.visible);
        action = null;
        if (hit) {
          let node: THREE.Object3D | null = hit.object;
          while (node && !buttons.has(node.name)) {
            node = node.parent;
          }
          if (node) {
            action =
              (Object.keys(meshNames) as Action[]).find((key) => meshNames[key] === node!.name) ?? null;
            if (node.name === "gba_dpad") {
              const local = node.worldToLocal(hit.point.clone());
              action =
                Math.abs(local.x) > Math.abs(local.y)
                  ? local.x > 0
                    ? "right"
                    : "left"
                  : local.y > 0
                    ? "up"
                    : "down";
            }
          }
        }
        // On a small screen, use the closest physical control if the ray
        // misses its tiny mesh. Each tap still resolves to one control.
        if (!action && event.pointerType !== "mouse") {
          pivot.updateMatrixWorld(true);
          const anchors: [Action, THREE.Vector3][] = [];
          for (const [key, name] of Object.entries(meshNames) as [Action, string][]) {
            if (["up", "down", "left", "right"].includes(key)) continue;
            const node = buttons.get(name)?.node;
            if (node) anchors.push([key, node.getWorldPosition(new THREE.Vector3())]);
          }
          const dpad = buttons.get("gba_dpad")?.node;
          if (dpad) {
            for (const [key, dx, dy] of [
              ["left", -0.006, 0],
              ["right", 0.006, 0],
              ["up", 0, 0.006],
              ["down", 0, -0.006],
            ] as [Action, number, number][]) {
              anchors.push([key, dpad.localToWorld(new THREE.Vector3(dx, dy, 0.002))]);
            }
          }
          let nearest = 26;
          for (const [key, world] of anchors) {
            const projected = world.project(camera);
            const px = rect.left + ((projected.x + 1) * rect.width) / 2;
            const py = rect.top + ((1 - projected.y) * rect.height) / 2;
            const distance = Math.hypot(event.clientX - px, event.clientY - py);
            if (distance < nearest) {
              nearest = distance;
              action = key;
            }
          }
        }
        mode = action ? "button" : "rotate";
        if (action) press.current(action, true);
      },
      { signal: abort.signal },
    );
    canvas.addEventListener(
      "pointermove",
      (event) => {
        if (!mode || event.pointerId !== activePointer) return;
        if (event.pointerType === "mouse" && !(event.buttons & (mode === "zoom" ? 4 : 1))) {
          reset();
          return;
        }
        const dx = event.clientX - x;
        const dy = event.clientY - y;
        moved ||=
          Math.hypot(event.clientX - startX, event.clientY - startY) >
          (event.pointerType === "mouse" ? 4 : 10);
        if (mode === "rotate") {
          const speed = (Math.PI * 2) / Math.max(320, Math.min(mount.clientWidth, mount.clientHeight));
          const delta = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(
              event.shiftKey ? 0 : dy * speed,
              event.shiftKey ? 0 : dx * speed,
              event.shiftKey ? dx * speed : 0,
            ),
          );
          target.premultiply(delta);
          schedule();
        }
        x = event.clientX;
        y = event.clientY;
      },
      { signal: abort.signal },
    );
    canvas.addEventListener(
      "pointerup",
      (event) => {
        if (event.pointerId !== activePointer) return;
        const chosen = mode === "button" && !moved ? action : null;
        reset();
        if (canvas.hasPointerCapture(event.pointerId)) {
          canvas.releasePointerCapture(event.pointerId);
        }
        if (chosen) act.current(chosen);
      },
      { signal: abort.signal },
    );
    canvas.addEventListener("pointercancel", reset, {
      signal: abort.signal,
    });
    canvas.addEventListener("lostpointercapture", reset, {
      signal: abort.signal,
    });
    for (const type of ["mousedown", "auxclick"] as const) {
      canvas.addEventListener(
        type,
        (event) => {
          if (event.button === 1) event.preventDefault();
        },
        { signal: abort.signal },
      );
    }
    /* Gameboy: temporary scroll-wheel zoom */
    canvas.addEventListener(
      "wheel",
      (event) => {
        if (mode !== "zoom" || event.ctrlKey || event.metaKey) return;
        event.preventDefault();
        zoom = THREE.MathUtils.clamp(zoom * Math.exp(-event.deltaY * 0.0017), 0.72, 1.35);
        fit();
        schedule();
      },
      { passive: false, signal: abort.signal },
    );
    /* Gameboy: keyboard controls */
    canvas.addEventListener(
      "keydown",
      (event) => {
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        const key = event.key.toLowerCase();
        const keys: Record<string, Action> = {
          arrowleft: "left",
          arrowright: "right",
          arrowup: "up",
          arrowdown: "down",
          a: "a",
          enter: "a",
          b: "b",
        };
        if ((event.shiftKey && key.startsWith("arrow")) || key === "q" || key === "e") {
          event.preventDefault();
          target.premultiply(
            new THREE.Quaternion().setFromEuler(
              new THREE.Euler(
                key === "arrowup" ? -0.15 : key === "arrowdown" ? 0.15 : 0,
                key === "arrowleft" ? -0.15 : key === "arrowright" ? 0.15 : 0,
                key === "q" ? -0.15 : key === "e" ? 0.15 : 0,
              ),
            ),
          );
          schedule();
        } else if (["+", "=", "-"].includes(key)) {
          event.preventDefault();
          zoom = key === "-" ? 0.8 : 1.25;
          fit();
          schedule();
        } else if (keys[key] && !event.repeat) {
          event.preventDefault();
          act.current(keys[key]);
        }
      },
      { signal: abort.signal },
    );
    canvas.addEventListener("keyup", reset, {
      signal: abort.signal,
    });
    canvas.addEventListener("blur", reset, {
      signal: abort.signal,
    });
    window.addEventListener("blur", reset, {
      signal: abort.signal,
    });
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) reset();
        else schedule();
      },
      { signal: abort.signal },
    );
    canvas.addEventListener(
      "webglcontextlost",
      (event) => {
        event.preventDefault();
        setError("3D paused by your browser. Open a project below or reload.");
        reset();
      },
      { signal: abort.signal },
    );
    /* Gameboy: resize and unmount */
    const observer = new ResizeObserver(() => {
      fit();
      schedule();
    });
    observer.observe(mount);
    fit();
    return () => {
      disposed = true;
      abort.abort();
      observer.disconnect();
      cancelAnimationFrame(frame);
      disposeObject(scene);
      texture.dispose();
      renderer.dispose();
      canvas.remove();
      drawScreen.current = () => {};
      press.current = () => {};
    };
  }, []);
  useEffect(() => {
    index.current = selected;
    drawScreen.current();
  }, [selected]);
  useEffect(
    () => () => {
      if (navigation.current) clearTimeout(navigation.current);
    },
    [],
  );
  return (
    <section className="gator-stage flex min-h-0 flex-1 flex-col" aria-label="Interactive Gameboy">
      {/* Gameboy */}
      <div ref={host} className="gator-model relative min-h-0 flex-1" />
      {error && (
        <p role="status" className="pb-3 text-center text-xs text-[#b9dca4]">
          {error}{" "}
          <a href={`https://www.instagram.com/gator.gd/p/${project.post}/`} className="underline">
            View {project.title}
          </a>
        </p>
      )}
      {/* Keyboard-accessible recovery links appear only if 3D fails. */}
      {error && (
        <div className="flex flex-wrap justify-center gap-3 pb-4">
          {projects.map((item) => (
            <a
              key={item.post}
              className="underline"
              href={`https://www.instagram.com/gator.gd/p/${item.post}/`}
            >
              {item.title}
            </a>
          ))}
          <Link href={HOME}>Return home</Link>
        </div>
      )}
      <p role="status" className="sr-only">
        {project.title}, project {selected + 1} of 3.
      </p>
      <style jsx global>{`
        .gator-model { width: 100%; min-height: 220px; }
        .gator-model canvas { display: block; width: 100%; height: 100%; touch-action: none; outline: none; cursor: grab; }
        .gator-model canvas:active { cursor: grabbing; }
      `}</style>
    </section>
  );
}
function Music() {
  const audio = useRef<HTMLAudioElement>(null);
  const cd = useRef<HTMLVideoElement>(null);
  const wanted = useRef(false);
  const request = useRef(0);
  const [status, setStatus] = useState("Click CD to play");
  const playing = status === "Playing";
  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      if (document.hidden) {
        wanted.current = false;
        request.current++;
        audio.current?.pause();
        setStatus("Click CD to play");
      }
      if (playing && !motion.matches && !document.hidden) {
        void cd.current?.play().catch(() => {});
      } else {
        cd.current?.pause();
      }
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
    };
  }, [playing]);
  useEffect(
    () => () => {
      wanted.current = false;
      request.current++;
      audio.current?.pause();
    },
    [],
  );
  async function toggleMusic() {
    const track = audio.current;
    if (!track) return;
    if (wanted.current) {
      wanted.current = false;
      request.current++;
      track.pause();
      setStatus("Click CD to play");
      return;
    }
    wanted.current = true;
    const attempt = ++request.current;
    track.volume = 0.45;
    setStatus("Loading…");
    try {
      if (track.error) track.load();
      await track.play();
    } catch {
      if (attempt === request.current) {
        wanted.current = false;
        setStatus("Click CD to retry");
      }
    }
  }
  return (
    <aside className={`gator-music flex items-center gap-4 ${mono.className}`} aria-label="Soundtrack">
      <div className="text-right text-[9px]">
        <p className="gator-track-name">REVOLUTION 909</p>
        <p className="gator-track-artist mt-1 text-[#adb8a4]">DAFT PUNK</p>
        <p role="status" className="mt-1 uppercase text-[#7ee34b]">
          {status}
        </p>
      </div>
      {/* CD */}
      <button
        onClick={() => void toggleMusic()}
        aria-label={playing ? "Pause music" : "Play music"}
        aria-pressed={playing}
        className="gator-cd relative h-[78px] w-[78px] shrink-0 overflow-hidden rounded-full bg-black"
      >
        <video
          ref={cd}
          src="/rotating-cd.mp4"
          poster="/cd-poster.jpg"
          muted
          loop
          playsInline
          aria-hidden="true"
          className="h-full w-full object-cover"
        />
        <span aria-hidden="true" className="absolute inset-0 grid place-items-center text-xs">
          {playing ? "Ⅱ" : "▶"}
        </span>
      </button>
      {/* Soundtrack */}
      <audio
        ref={audio}
        src="/revolution-909.mp3"
        preload="none"
        onPlaying={() => {
          if (wanted.current) setStatus("Playing");
          else audio.current?.pause();
        }}
        onWaiting={() => {
          if (wanted.current) setStatus("Buffering…");
        }}
        onPause={() => {
          wanted.current = false;
          setStatus("Click CD to play");
        }}
        onEnded={() => {
          wanted.current = false;
          setStatus("Click CD to play");
        }}
        onError={() => {
          wanted.current = false;
          setStatus("Click CD to retry");
        }}
      />
    </aside>
  );
}
function Background() {
  const terrain = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      if (motion.matches || document.hidden) {
        terrain.current?.pause();
      } else {
        void terrain.current?.play().catch(() => {});
      }
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
    };
  }, []);
  return (
    <div className="gator-background pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Stars */}
      <div
        className="gator-stars absolute inset-0 opacity-10"
        style={{
          backgroundImage: "url('/starfield.gif')",
          backgroundSize: "540px auto",
          backgroundPosition: "center",
        }}
      />
      {/* Lighting */}
      <div className="gator-glow gator-glow-left" />
      <div className="gator-glow gator-glow-right" />
      <div className="gator-floor" />
      {/* vectors */}
      <svg
        className="gator-vectors absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          <linearGradient
            id="gator-vector-ink"
            x1="0"
            y1="0"
            x2="1440"
            y2="900"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#b7f499" stopOpacity=".45" />
            <stop offset=".5" stopColor="#5fd939" stopOpacity=".12" />
            <stop offset="1" stopColor="#91efad" stopOpacity=".5" />
          </linearGradient>
        </defs>
        <g stroke="url(#gator-vector-ink)" strokeWidth="1">
          <path d="M-70 300 120 110 340 150 445 -50M90 800 200 610 105 485 -90 555M1130 -30 1280 190 1430 240 1540 80M1280 970 1180 690 1370 535 1530 640" />
          <path
            opacity=".4"
            d="M-80 345 165 150 355 202 480 -40M50 870 250 638 148 450 -100 510M1080 -40 1225 230 1455 285 1510 110M1340 930 1230 722 1400 575 1510 675"
          />
          <path
            className="gator-trace"
            d="M-70 300 120 110 340 150 445 -50M90 800 200 610 105 485 -90 555M1130 -30 1280 190 1430 240 1540 80M1280 970 1180 690 1370 535 1530 640"
            stroke="#a3ed80"
            strokeWidth="1.5"
          />
        </g>
        <g fill="#9ce66e" opacity=".5">
          <circle cx="120" cy="110" r="2.5" />
          <circle cx="340" cy="150" r="2" />
          <circle cx="200" cy="610" r="2.5" />
          <circle cx="1280" cy="190" r="2" />
          <circle cx="1370" cy="535" r="2.5" />
        </g>
      </svg>
      {/* bottom video */}
      <video
        ref={terrain}
        src="/wireframe-terrain.mp4"
        poster="/terrain-poster.jpg"
        muted
        loop
        playsInline
        className="gator-terrain absolute bottom-0 w-full object-fill"
        preload="metadata"
      />
      <style jsx global>{`
        .gator-background .gator-terrain { height: clamp(260px, 42vh, 520px); opacity: 0.38; filter: brightness(0.85); mix-blend-mode: screen; mask-image: linear-gradient(transparent, black 28%); }
        .gator-background .gator-glow { position: absolute; width: 65vw; height: 80vh; min-width: 500px; border-radius: 50%; mix-blend-mode: screen; opacity: 0.65; }
        .gator-background .gator-glow-left { left: -27vw; top: -22vh; background: radial-gradient(ellipse, #71c84830, #427b3514 30%, transparent 68%); animation: gator-left 20s ease-in-out infinite alternate; }
        .gator-background .gator-glow-right { right: -28vw; top: 6vh; background: radial-gradient(ellipse, #51a68a24, #3963420d 35%, transparent 68%); animation: gator-right 24s ease-in-out infinite alternate; }
        .gator-floor { position: absolute; width: 65%; height: 25%; left: 17.5%; bottom: 8%; background: radial-gradient(ellipse, #86dc4526, transparent 65%); transform: scaleY(0.45); opacity: 0.75; }
        .gator-background .gator-vectors { opacity: 0.48; animation: gator-vectors 22s ease-in-out infinite alternate; }
        .gator-trace { opacity: 0.45; stroke-dasharray: 60 500; animation: gator-trace 14s linear infinite; }
        @keyframes gator-left {
          to { transform: translate(18vw, 12vh) rotate(18deg); }
        }
        @keyframes gator-right {
          to { transform: translate(-12vw, -10vh) rotate(-12deg); }
        }
        @keyframes gator-vectors {
          to { transform: translate(18px, -12px) scale(1.025); }
        }
        @keyframes gator-trace {
          to { stroke-dashoffset: -1120; }
        }
        @media (prefers-reduced-motion: reduce) {
          .gator-background * { animation: none !important; }
          .gator-background .gator-stars { background-image: none !important; }
          .gator-background video { visibility: hidden; }
        }
      `}</style>
    </div>
  );
}
export default function Work() {
  const [selected, setSelected] = useState(0);
  const [guide, setGuide] = useState(false);
  const [menu, setMenu] = useState(false);
  const guideRef = useRef<HTMLDivElement>(null);
  const guideButton = useRef<HTMLButtonElement>(null);
  const project = projects[selected];
  useEffect(() => {
    if (guide) {
      guideRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    }
    const outside = (event: PointerEvent) => {
      if (
        !guideRef.current?.contains(event.target as Node) &&
        !guideButton.current?.contains(event.target as Node)
      ) {
        setGuide(false);
      }
    };
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("pointerdown", outside);
    };
  }, [guide]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setGuide(false);
        setMenu(false);
        guideButton.current?.focus();
      }
    };
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("keydown", close);
    };
  }, []);
  return (
    <div
      className={`gator-work relative flex h-dvh min-h-[570px] flex-col overflow-hidden bg-[#050805] text-[#f6f5ed] ${manrope.className}`}
    >
      {/* Background */}
      <Background />
      {/* Navbar */}
      <header className="gator-header relative z-40 flex shrink-0 items-center justify-between border-b border-[#374532] bg-black">
        <Link href={HOME} aria-label="Gator home">
          <img
            src="/gator-logo.png"
            alt="Gator"
            className="gator-logo h-auto w-32 transition duration-300 hover:-translate-y-1 hover:-rotate-3 hover:drop-shadow-[0_0_10px_#79c94b66]"
          />
        </Link>
        <nav
          aria-label="Main navigation"
          className={`gator-desktop-nav flex gap-10 text-xs font-medium uppercase ${mono.className}`}
        >
          <Link href="/work" aria-current="page" className="text-[#7ee34b]">
            Work
          </Link>
          <Link href="/#about">Studio</Link>
          <Link href="/#contact">Contact</Link>
        </nav>
        {/* Mobile navigation */}
        <button
          className="gator-menu"
          aria-label={menu ? "Close menu" : "Open menu"}
          aria-expanded={menu}
          aria-controls="gator-mobile-nav"
          onClick={() => setMenu(!menu)}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M4 5h16M4 12h16M4 19h16" />
          </svg>
        </button>
        {menu && (
          <nav
            id="gator-mobile-nav"
            className={`gator-mobile-nav ${mono.className}`}
            aria-label="Mobile navigation"
          >
            <Link href="/work" onClick={() => setMenu(false)}>
              Work
            </Link>
            <Link href="/#about">Studio</Link>
            <Link href="/#contact">Contact</Link>
          </nav>
        )}
      </header>
      <main className="gator-main relative z-10 mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col">
        {/* Project heading */}
        <div className="gator-toolbar absolute z-20 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button
              ref={guideButton}
              aria-controls="gator-guide"
              aria-label="Instructions"
              aria-expanded={guide}
              onClick={() => setGuide(!guide)}
              className="h-9 w-9 shrink-0 rounded-full border border-[#829577] bg-[#0d170b] font-serif text-[22px] italic"
            >
              i
            </button>
            <div>
              <p className={`text-[10px] tracking-widest text-[#adba9f] ${mono.className}`}>
                0{selected + 1} / 03
              </p>
              <h1
                className={`mt-1 text-[clamp(28px,3.4vw,52px)] leading-none tracking-[-0.045em] uppercase ${archivo.className}`}
              >
                {project.title}
              </h1>
            </div>
          </div>
          {/* Music */}
          <Music />
        </div>
        {/* Instructions */}
        {guide && (
          <div
            ref={guideRef}
            id="gator-guide"
            role="region"
            aria-labelledby="gator-guide-title"
            className="gator-guide absolute z-30 w-[350px] max-w-[calc(100vw-36px)] border border-[#829577] bg-[#0d170bfa] p-[22px] shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4">
              <h2
                id="gator-guide-title"
                className={`text-[11px] font-medium tracking-[.07em] text-[#7ee34b] ${mono.className}`}
              >
                YOUR FIELD GUIDE
              </h2>
              <button
                aria-label="Close instructions"
                onClick={() => {
                  setGuide(false);
                  guideButton.current?.focus();
                }}
                className="h-8 w-8 text-2xl"
              >
                ×
              </button>
            </div>
            <dl className="my-[18px] grid gap-[17px]">
              {[
                ["D-PAD", "Browse projects in either direction."],
                ["A / START", "Open the selected Instagram post."],
                ["B", "Return straight to the homepage."],
                [
                  "ROTATE",
                  "Drag with a finger or hold the left mouse button to rotate. Release to return to the front. Shift + drag rolls the console.",
                ],
                [
                  "ZOOM",
                  "Hold down the scroll wheel over the console and scroll up to zoom in or down to zoom out. Release the wheel to reset instantly. Keyboard: hold + or − while the console is focused.",
                ],
                ["MUSIC", "Click the CD to play or pause Revolution 909."],
              ].map(([label, description]) => (
                <div key={label} className="grid grid-cols-[78px_1fr] gap-3">
                  <dt className={`text-[10px] font-medium leading-[1.6] text-[#aee77e] ${mono.className}`}>
                    {label}
                  </dt>
                  <dd className="m-0 text-xs leading-[1.6] text-[#d5decf]">{description}</dd>
                </div>
              ))}
            </dl>
            <p
              className={`border-t border-[#7da45a33] pt-[15px] text-[10px] leading-[1.7] text-[#adb8a4] ${mono.className}`}
            >
              Keyboard: arrows to browse, A / Enter to open, B for home, Escape to close the guide. Focus the
              model and hold Shift + arrows or Q / E to rotate.
            </p>
          </div>
        )}
        {/* Gameboy */}
        <Gameboy selected={selected} onSelect={setSelected} />
        {/* Footer */}
        <footer
          className={`flex shrink-0 justify-between gap-5 border-t border-[#374532] pt-3 text-[10px] font-medium tracking-[.035em] text-[#adb8a4] ${mono.className}`}
        >
          <Link href={HOME}> BACK TO STUDIO</Link>
          <span>© {new Date().getFullYear()} GATOR STUDIO</span>
        </footer>
      </main>
      {/* Work page */}
      <style jsx global>{`
        .gator-header { height: 88px; padding-inline: clamp(20px, 4vw, 76px); }
        .gator-main { padding: 6px 40px 12px; }
        .gator-toolbar { top: 15px; left: 40px; right: 40px; pointer-events: none; }
        .gator-toolbar > * { pointer-events: auto; }
        .gator-guide { top: 77px; left: 40px; }
        .gator-stage { filter: drop-shadow(0 40px 32px #0006); }
        .gator-menu { display: none; }
        .gator-desktop-nav a { position: relative; padding: 15px 0; }
        .gator-desktop-nav a::after { content: ""; position: absolute; bottom: 6px; left: 0; right: 0; height: 1px; background: #7ee34b; transform: scaleX(0); transform-origin: right; transition: transform 0.25s; }
        .gator-desktop-nav a:hover::after { transform: scaleX(1); transform-origin: left; }
        .gator-mobile-nav { position: absolute; top: 100%; left: 0; right: 0; display: grid; background: #050805; border-bottom: 1px solid #374532; }
        .gator-mobile-nav a { padding: 18px; border-top: 1px solid #374532; font-size: 13px; text-transform: uppercase; }
        .gator-work button:focus-visible,
        .gator-work a:focus-visible { outline: 2px solid #a4e57b; outline-offset: 4px; }
        @media (max-width: 900px) {
          .gator-main { padding-inline: 24px; }
          .gator-toolbar { left: 24px; right: 24px; gap: 16px; }
          .gator-guide { left: 24px; }
          .gator-cd { width: 66px; height: 66px; }
        }
        @media (max-width: 760px) {
          .gator-header { height: 70px; padding-inline: 20px; }
          .gator-logo { width: 108px; }
          .gator-desktop-nav { display: none; }
          .gator-menu { display: grid; place-items: center; width: 44px; height: 44px; }
          .gator-toolbar { top: 8px; }
          .gator-toolbar h1 { font-size: clamp(25px, 6vw, 36px); }
          .gator-guide { top: 70px; }
        }
        @media (max-width: 600px) {
          .gator-main { padding: 4px 18px 10px; min-height: 500px; }
          .gator-toolbar { left: 18px; right: 18px; gap: 12px; }
          .gator-toolbar h1 { font-size: 25px; }
          .gator-guide { left: 18px; }
          .gator-track-name,
          .gator-track-artist { display: none; }
          .gator-music { gap: 8px; }
          .gator-music [role="status"] { max-width: 105px; font-size: 8px; line-height: 1.6; }
          .gator-cd { width: 48px; height: 48px; }
          .gator-work footer { font-size: 8px; }
          .gator-background .gator-terrain { height: 32vh; min-height: 220px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .gator-work * { transition: none !important; }
        }
      `}</style>
    </div>
  );
}
