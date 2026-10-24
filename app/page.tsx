"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Archivo_Black, IBM_Plex_Mono, Instrument_Serif, Manrope } from "next/font/google";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/* Fonts */
const archivo = Archivo_Black({ subsets: ["latin"], weight: "400", variable: "--gator-archivo" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--gator-mono" });
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--gator-manrope",
});
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--gator-serif",
});

/* Rotating G: real GLB model, touch dragging and its own canvas */
function RotatingG() {
  const mount = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const host = mount.current;
    if (!host) return;
    const abort = new AbortController();
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !matchMedia("(pointer:coarse)").matches,
        powerPreference: "low-power",
      });
    } catch {
      return;
    }
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    const canvas = renderer.domElement;
    canvas.tabIndex = 0;
    canvas.setAttribute("aria-label", "Rotating green G sculpture. Drag or use arrow keys to explore.");
    host.appendChild(canvas);
    const scene = new THREE.Scene(),
      pivot = new THREE.Group();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 30);
    camera.position.z = 5.6;
    scene.add(pivot, new THREE.HemisphereLight(0xe4f2b8, 0x143419, 1));
    const key = new THREE.DirectionalLight(0xf1ffd8, 2.2);
    key.position.set(-3, 4, 5);
    scene.add(key);
    const edge = new THREE.DirectionalLight(0xc1f292, 1.2);
    edge.position.set(4, 0.5, 2);
    scene.add(edge);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04);
    scene.environment = environment.texture;
    room.dispose();
    pmrem.dispose();
    let alive = true,
      visible = true,
      frame = 0,
      last = 0,
      clock = 0;
    let targetX = 0,
      targetY = 0,
      currentX = 0,
      currentY = 0;
    let drag: { id: number; x: number; y: number; rx: number; ry: number } | null = null;
    const dispose = (object: THREE.Object3D) =>
      object.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return;
        node.geometry.dispose();
        for (const mat of Array.isArray(node.material) ? node.material : [node.material]) mat.dispose();
      });
    function fit() {
      const w = Math.max(1, host!.clientWidth),
        h = Math.max(1, host!.clientHeight);
      renderer.setPixelRatio(
        Math.min(devicePixelRatio || 1, matchMedia("(pointer:coarse)").matches ? 1 : 1.5),
      );
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.position.z = w / h < 0.8 ? 6.2 : 5.6;
      camera.updateProjectionMatrix();
      schedule();
    }
    function schedule() {
      if (alive && visible && !document.hidden && !frame) frame = requestAnimationFrame(draw);
    }
    function draw(now: number) {
      frame = 0;
      if (!alive || !visible || document.hidden) return;
      if (!drag && !motion.matches && now - last < 30) {
        schedule();
        return;
      }
      const dt = Math.min(0.04, (now - last) / 1000 || 0.016);
      last = now;
      if (!motion.matches) clock += dt;
      const ease = motion.matches ? 1 : 1 - Math.exp(-dt / 0.09);
      currentX += (targetX - currentX) * ease;
      currentY += (targetY - currentY) * ease;
      pivot.rotation.set(0.22 + currentX, -0.35 + currentY - clock * 0.22, -0.3);
      pivot.position.y = motion.matches ? 0 : Math.sin(clock * 0.55) * 0.04;
      renderer.render(scene, camera);
      if (!motion.matches || Math.abs(targetX - currentX) + Math.abs(targetY - currentY) > 0.001) schedule();
    }
    new GLTFLoader().load(
      "/gator-g.glb",
      (gltf) => {
        if (!alive) {
          dispose(gltf.scene);
          return;
        }
        gltf.scene.traverse((node) => {
          if (!(node instanceof THREE.Mesh)) return;
          for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
            if (!(material instanceof THREE.MeshStandardMaterial)) continue;
            material.color.set("#21582b");
            material.roughness = 0.32;
            material.metalness = 0.55;
            material.envMapIntensity = 0.7;
          }
        });
        pivot.add(gltf.scene);
        setReady(true);
        fit();
      },
      undefined,
      () => {
        if (alive) setReady(false);
      },
    );
    canvas.addEventListener(
      "pointerdown",
      (e) => {
        if (e.isPrimary === false || (e.pointerType === "mouse" && e.button !== 0)) return;
        drag = { id: e.pointerId, x: e.clientX, y: e.clientY, rx: targetX, ry: targetY };
        canvas.setPointerCapture?.(e.pointerId);
        schedule();
      },
      { signal: abort.signal },
    );
    canvas.addEventListener(
      "pointermove",
      (e) => {
        if (!drag || drag.id !== e.pointerId) return;
        targetX = drag.rx + (e.clientY - drag.y) * 0.012;
        targetY = drag.ry + (e.clientX - drag.x) * 0.012;
        schedule();
      },
      { signal: abort.signal },
    );
    const reset = () => {
      drag = null;
      targetX = targetY = 0;
      schedule();
    };
    for (const event of ["pointerup", "pointercancel", "lostpointercapture"] as const)
      canvas.addEventListener(event, reset, { signal: abort.signal });
    canvas.addEventListener(
      "keydown",
      (e) => {
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home"].includes(e.key)) return;
        e.preventDefault();
        if (e.key === "Home") reset();
        if (e.key === "ArrowLeft") targetY -= 0.25;
        if (e.key === "ArrowRight") targetY += 0.25;
        if (e.key === "ArrowUp") targetX -= 0.25;
        if (e.key === "ArrowDown") targetX += 0.25;
        schedule();
      },
      { signal: abort.signal },
    );
    canvas.addEventListener("keyup", reset, { signal: abort.signal });
    canvas.addEventListener(
      "webglcontextlost",
      (e) => {
        e.preventDefault();
        setReady(false);
        alive = false;
        cancelAnimationFrame(frame);
      },
      { signal: abort.signal },
    );
    document.addEventListener(
      "visibilitychange",
      () => {
        last = 0;
        if (document.hidden) {
          cancelAnimationFrame(frame);
          frame = 0;
        } else schedule();
      },
      { signal: abort.signal },
    );
    window.addEventListener("blur", reset, { signal: abort.signal });
    motion.addEventListener("change", schedule, { signal: abort.signal });
    const observer = new ResizeObserver(fit);
    observer.observe(host);
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      last = 0;
      if (visible) schedule();
      else {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    visibility.observe(host);
    fit();
    return () => {
      alive = false;
      abort.abort();
      observer.disconnect();
      visibility.disconnect();
      cancelAnimationFrame(frame);
      dispose(pivot);
      environment.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, []);
  return (
    <div ref={mount} className={`sculpture-stage ${ready ? "is-rendered" : ""}`}>
      {/* Rotating G fallback */}
      <div className="sculpture-fallback" aria-hidden="true">
        <img src="/sculpture-poster.webp" width="850" height="700" alt="" />
      </div>
      <span className="object-hint mono">DRAG TO EXPLORE</span>
    </div>
  );
}

/* Rotating projects: native carousel, swipe, keyboard and Instagram links */
const projects = [
  {
    title: "Clean",
    category: "LAUNDRY BOOKING",
    image: "/project-clean.jpg",
    description: "Find, compare, order and track local laundry services in Dhaka.",
    post: "DeEAQ1BjzAy",
    color: "#b9d66d",
  },
  {
    title: "bilai.",
    category: "CAT ADOPTION",
    image: "/project-bilai.jpg",
    description: "Connecting pet parents and adopters in Bangladesh.",
    post: "DdgzUE5j68j",
    color: "#fa7d1f",
  },
  {
    title: "Giftour",
    category: "INCLUSIVE TRAVEL",
    image: "/project-giftour.jpg",
    description: "A travel-planning app for neurodivergent travellers.",
    post: "DdZJfl3j2Y1",
    color: "#b5c6df",
  },
];
function RotatingProjects() {
  const [selected, setSelected] = useState(0);
  const [interacting, setInteracting] = useState(false);
  const drag = useRef<{ id: number; x: number; y: number; dragging: boolean } | null>(null);
  const suppressClick = useRef(0);
  const select = (step: number) => setSelected((value) => (value + step + projects.length) % projects.length);
  /* Auto-rotate even while the mouse rests over the cards. */
  useEffect(() => {
    if (interacting) return;
    const motion = matchMedia("(prefers-reduced-motion:reduce)");
    const timer = setInterval(() => {
      if (!document.hidden && !motion.matches) select(1);
    }, 4000);
    return () => clearInterval(timer);
  }, [interacting, selected]);
  const release = (event: React.PointerEvent<HTMLDivElement>) => {
    if (drag.current?.id !== event.pointerId) return;
    if (drag.current.dragging) suppressClick.current = performance.now() + 500;
    drag.current = null;
    setInteracting(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };
  return (
    <div
      className="rotating-projects"
      role="region"
      aria-roledescription="carousel"
      aria-label="Selected projects"
    >
      <div
        className="window-stack"
        tabIndex={0}
        aria-label="Drag left or right to browse projects. Click a side card to select it. Click the front card to open its project."
        style={{ touchAction: "pan-y" }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            select(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}
        onPointerDown={(event) => {
          if (event.isPrimary === false || (event.pointerType === "mouse" && event.button !== 0)) return;
          drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, dragging: false };
          setInteracting(true);
        }}
        onPointerMove={(event) => {
          const gesture = drag.current;
          if (!gesture || gesture.id !== event.pointerId) return;
          const dx = event.clientX - gesture.x,
            dy = event.clientY - gesture.y;
          if (!gesture.dragging && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
            gesture.dragging = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            suppressClick.current = performance.now() + 500;
          }
          if (!gesture.dragging) return;
          event.preventDefault();
          if (Math.abs(dx) > 60) {
            select(dx < 0 ? 1 : -1);
            gesture.x = event.clientX;
          }
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={release}
        onPointerLeave={() => {
          if (drag.current && !drag.current.dragging) {
            drag.current = null;
            setInteracting(false);
          }
        }}
        onClickCapture={(event) => {
          if (performance.now() < suppressClick.current) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
      >
        {projects.map((item, index) => {
          const relative = (index - selected + projects.length) % projects.length;
          const slot = relative === 2 ? -1 : relative;
          return (
            <article
              key={item.title}
              className={`project-window slot-${slot}`}
              style={{ background: item.color }}
            >
              <div className="window-bar mono">
                <span>0{index + 1} / 03</span>
                <span aria-hidden="true">− □ ×</span>
              </div>
              {slot === 0 ? (
                <a
                  href={`https://www.instagram.com/gator.gd/p/${item.post}/`}
                  aria-label={`View ${item.title} on Instagram`}
                  draggable={false}
                >
                  <img
                    src={item.image}
                    alt={`${item.title} project artwork`}
                    width="1122"
                    height="1402"
                    draggable={false}
                  />
                </a>
              ) : (
                <button
                  type="button"
                  className="project-pick"
                  tabIndex={-1}
                  onClick={() => setSelected(index)}
                  aria-label={`Bring ${item.title} to the front`}
                >
                  <img src={item.image} alt="" width="1122" height="1402" draggable={false} />
                </button>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

/* Back to top: reference double-chevron, turned upward */
function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const update = () => setVisible(window.scrollY > 450);
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);
  if (!visible) return null;
  return (
    <button
      className="back-to-top"
      type="button"
      aria-label="Back to top"
      onClick={() => {
        window.scrollTo({
          top: 0,
          behavior: matchMedia("(prefers-reduced-motion:reduce)").matches ? "instant" : "smooth",
        });
      }}
    >
      <svg
        viewBox="0 0 32 32"
        width="25"
        height="25"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M13 5 3 16l10 11M29 5 19 16l10 11" />
      </svg>
    </button>
  );
}

/* Studio text reveal */
function WordReveal() {
  const ref = useRef<HTMLParagraphElement>(null);
  const [progress, setProgress] = useState(1);
  const text =
    "We’re Gator. We build web apps around real needs: an easier laundry day, a home for a cat, a trip that feels right.";
  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion:reduce)");
    let frame = 0;
    const draw = () => {
      frame = 0;
      if (motion.matches) {
        setProgress(1);
        return;
      }
      const top = ref.current?.getBoundingClientRect().top ?? 0;
      setProgress(Math.max(0, Math.min(1, (innerHeight * 0.92 - top) / (innerHeight * 0.55))));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    motion.addEventListener("change", schedule);
    draw();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      motion.removeEventListener("change", schedule);
    };
  }, []);
  const words = text.split(" ");
  return (
    <p ref={ref} className="word-reveal" aria-label={text}>
      {words.map((word, index) => (
        <span key={index} aria-hidden="true" className={index / words.length > progress ? "is-muted" : ""}>
          {word}
          {index < words.length - 1 ? " " : ""}
        </span>
      ))}
    </p>
  );
}

/* Homepage */
export default function Home() {
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    const root = document.querySelector(".gator-home");
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
    };
    const compact = matchMedia("(max-width:760px)");
    const change = () => {
      if (!compact.matches) setMenu(false);
    };
    window.addEventListener("keydown", close);
    compact.addEventListener("change", change);
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.1 },
    );
    root?.querySelectorAll("[data-reveal]").forEach((node) => observer.observe(node));
    root?.classList.add("motion-ready");
    return () => {
      observer.disconnect();
      window.removeEventListener("keydown", close);
      compact.removeEventListener("change", change);
    };
  }, []);
  return (
    <div className={`gator-home ${archivo.variable} ${mono.variable} ${manrope.variable} ${serif.variable}`}>
      {/* Navbar */}
      <header className="site-header">
        <Link className="header-logo" href="/" aria-label="Gator home">
          <img src="/gator-logo.png" width="480" height="153" alt="Gator" />
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          <Link href="/work">Work</Link>
          <Link href="#about">Studio</Link>
          <Link href="#contact">Contact</Link>
        </nav>
        <button
          className="menu-button"
          aria-label={menu ? "Close menu" : "Open menu"}
          aria-controls="home-mobile-nav"
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
        >
          <span />
          <span />
        </button>
        {menu && (
          <nav id="home-mobile-nav" className="home-mobile-nav" aria-label="Mobile navigation">
            <Link href="/work" onClick={() => setMenu(false)}>
              Work
            </Link>
            <Link href="#about" onClick={() => setMenu(false)}>
              Studio
            </Link>
            <Link href="#contact" onClick={() => setMenu(false)}>
              Contact
            </Link>
          </nav>
        )}
      </header>
      {/* Homepage */}
      <main id="main">
        <section className="hero" id="top" aria-labelledby="hero-title">
          <div className="hero-top mono">
            <span>INDEPENDENT WEB STUDIO</span>
            <span>DHAKA, BANGLADESH</span>
          </div>
          <div className="hero-composition">
            <h1 id="hero-title">
              <span>Good ideas.</span>
              <span>Wild</span>
              <span>
                <em>execution.</em>
              </span>
            </h1>
            <RotatingG />
          </div>
          <div className="hero-bottom">
            <p>
              Websites that don’t suck.
              <br />
              Designed with character. Built around people.
            </p>
            <Link className="primary-link" href="/work">
              Explore our work
            </Link>
          </div>
        </section>
        <section className="selected section-pad" id="selected" aria-labelledby="work-title">
          <div className="section-line mono">
            <h2 id="work-title">SELECTED WORK</h2>
            <span>2026 / 01—03</span>
          </div>
          <RotatingProjects />
        </section>
        <section className="about section-pad" id="about" aria-labelledby="about-title">
          <div className="section-line mono">
            <h2 id="about-title">THE STUDIO</h2>
            <span>BASED IN DHAKA</span>
          </div>
          <div className="about-grid">
            <p className="about-lead" data-reveal="">
              Small team.
              <br />
              <em>Sharp focus.</em>
            </p>
            <div className="about-copy">
              <WordReveal />
              <p data-reveal="">
                We care about the whole experience—from the first impression to the detail that makes
                someone’s day easier.
              </p>
            </div>
          </div>
          <div className="recognition">
            <Link href="https://www.instagram.com/gator.gd/p/DdgzUE5j68j/">
              <span className="mono">ANIMALHACK 2026 / BILAI.</span>
              <strong>Excellence in Social Impact</strong>
            </Link>
            <Link href="https://www.instagram.com/gator.gd/p/DdZJfl3j2Y1/">
              <span className="mono">AI IDEATHON 2026 / GIFTOUR</span>
              <strong>Top 15 finalist</strong>
            </Link>
          </div>
        </section>
        <section className="contact section-pad" id="contact" aria-labelledby="contact-title">
          <div className="section-line mono">
            <span>HAVE A PROJECT IN MIND?</span>
            <span>LET’S TALK</span>
          </div>
          <h2 id="contact-title" data-reveal="">
            Make your
            <br />
            next move.
          </h2>
          <div className="contact-connect">
            <p>Start a conversation</p>
            <div className="contact-channels">
              <Link
                className="contact-channel"
                href="mailto:hello@gator.studio"
                aria-label="Email Gator at hello@gator.studio"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                  <path d="m3 6 9 7 9-7"></path>
                </svg>
                <span>
                  Email<small>hello@gator.studio</small>
                </span>
              </Link>
              <Link
                className="contact-channel"
                href="https://www.instagram.com/gator.gd/"
                aria-label="Visit Gator on Instagram"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="18" height="18" rx="5"></rect>
                  <circle cx="12" cy="12" r="4"></circle>
                  <circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"></circle>
                </svg>
                <span>
                  Instagram<small>@gator.gd</small>
                </span>
              </Link>
            </div>
          </div>
        </section>
      </main>
      {/* arrow */}
      <BackToTop />
      <style jsx global>{`
        .gator-home { --bg: #050805; --text: #f6f5ed; --muted: #adb8a4; --primary: #68cc35; --line: #374532; --font-display: var(--gator-archivo), Arial, sans-serif; --font-sans: var(--gator-manrope), Arial, sans-serif; --font-mono: var(--gator-mono), monospace; --serif: var(--gator-serif), Georgia, serif; --gutter: clamp(20px, 4vw, 76px); }
        @supports (color: oklch(75% 0.25 139)) {
          .gator-home { --primary: oklch(75% 0.25 139); }
        }
        .gator-home * { box-sizing: border-box; }
        .gator-home { scroll-behavior: smooth; scroll-padding-top: 92px; }
        .gator-home { margin: 0; background: var(--bg); color: var(--text); font-family: var(--font-sans); -webkit-font-smoothing: antialiased; }
        .gator-home a { color: inherit; text-decoration: none; }
        .gator-home button { font: inherit; color: inherit; cursor: pointer; }
        .gator-home img { display: block; max-width: 100%; height: auto; }
        .gator-home button,
        .gator-home a { -webkit-tap-highlight-color: transparent; }
        .gator-home a:focus-visible,
        .gator-home button:focus-visible,
        .gator-home canvas:focus-visible { outline: 2px solid var(--primary); outline-offset: 6px; }
        .gator-home [hidden] { display: none !important; }
        .gator-home h1,
        .gator-home h2,
        .gator-home h3,
        .gator-home p { margin: 0; }
        .gator-home .mono { font: 400 12px/1.6 var(--font-mono); letter-spacing: 0.035em; }
        .gator-home em { font-family: var(--serif); font-weight: 400; }
        .gator-home .skip-link { position: fixed; top: -90px; left: 16px; background: var(--primary); color: var(--bg); padding: 16px; z-index: 100; }
        .gator-home .skip-link:focus { top: 12px; }
        .gator-home .site-header { height: 88px; position: sticky; top: 0; z-index: 30; padding: 0 var(--gutter); display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--line); background: #050805f5; backdrop-filter: blur(14px); }
        .gator-home .header-logo { display: block; width: 128px; flex-shrink: 0; }
        .gator-home .desktop-nav { display: flex; gap: 40px; align-items: center; font: 500 12px/1 var(--font-mono); text-transform: uppercase; }
        .gator-home .desktop-nav a { padding: 15px 0; position: relative; }
        .gator-home .desktop-nav a::after { content: ""; position: absolute; bottom: 6px; left: 0; width: 100%; height: 1px; background: var(--primary); transform: scaleX(0); transform-origin: left; transition: transform 0.25s; }
        .gator-home .desktop-nav a:hover::after { transform: scaleX(1); }
        .gator-home .desktop-nav span { margin-left: 10px; color: var(--primary); }
        .gator-home .menu-button { display: none; }
        .gator-home .home-mobile-nav { position: absolute; top: 100%; left: 0; right: 0; background: var(--bg); padding: 20px; border-bottom: 1px solid var(--line); }
        .gator-home .home-mobile-nav a { display: block; padding: 16px 0; font-size: 24px; }
        .gator-home .hero { min-height: calc(100svh - 88px); padding: 28px var(--gutter) 30px; display: flex; flex-direction: column; overflow: clip; }
        .gator-home .hero-top { display: flex; justify-content: space-between; gap: 20px; color: var(--muted); }
        .gator-home .hero-composition { position: relative; display: grid; grid-template-columns: 1.06fr 1fr; align-items: center; flex: 1; min-height: 530px; max-width: 1600px; width: 100%; margin: auto; }
        .gator-home .hero h1 { font: 400 clamp(64px, 7.8vw, 130px)/0.95 var(--font-display); letter-spacing: -0.07em; z-index: 2; pointer-events: none; }
        .gator-home .hero h1 > span { display: block; padding-bottom: 0.065em; }
        .gator-home .hero h1 em { font-size: 1.24em; line-height: 0.8; letter-spacing: -0.05em; color: var(--primary); }
        .gator-home .sculpture-stage { position: relative; min-width: 0; height: 100%; min-height: 500px; isolation: isolate; }
        .gator-home .sculpture-stage canvas { width: 100%; height: 100%; position: absolute; inset: 0; display: block; opacity: 0; transition: opacity 0.4s; touch-action: pan-y; cursor: grab; outline-offset: -10px; }
        .gator-home .sculpture-stage canvas:active { cursor: grabbing; }
        .gator-home .sculpture-fallback { position: absolute; inset: 0; }
        .gator-home .sculpture-fallback img { width: 100%; height: 100%; object-fit: contain; }
        .gator-home .sculpture-stage.is-rendered canvas { opacity: 1; }
        .gator-home .sculpture-stage.is-rendered .sculpture-fallback { visibility: hidden; }
        .gator-home .object-hint { position: absolute; bottom: 4%; left: 50%; translate: -50% 0; color: var(--muted); font-size: 10px; visibility: hidden; white-space: nowrap; }
        .gator-home .is-rendered .object-hint { visibility: visible; }
        .gator-home .hero-bottom { position: relative; display: flex; align-items: center; gap: 40px; padding-top: 26px; border-top: 1px solid var(--line); }
        .gator-home .hero-bottom p { font-size: 15px; line-height: 1.65; color: var(--muted); margin-right: auto; }
        .gator-home .primary-link { display: inline-flex; align-items: center; justify-content: space-between; gap: 44px; background: var(--primary); color: var(--bg); padding: 18px 24px; min-height: 56px; font-size: 14px; font-weight: 700; transition: transform 0.25s; }
        .gator-home .primary-link:hover { transform: translateY(-3px); }
        .gator-home .primary-link span { font-size: 24px; }
        .gator-home .motion-toggle { display: flex; gap: 12px; align-items: center; background: none; border: 0; min-height: 44px; padding: 12px 0; font: 400 10px var(--font-mono); color: var(--muted); }
        .gator-home .motion-toggle span { font-size: 14px; }
        .gator-home .section-pad { padding: 36px var(--gutter) 90px; }
        .gator-home .section-line { display: flex; justify-content: space-between; gap: 16px; padding-bottom: 24px; border-bottom: 1px solid var(--line); color: var(--muted); }
        .gator-home .section-line h2 { font: inherit; }
        .gator-home .selected { background: #080d08; border-top: 1px solid var(--line); overflow: clip; }
        .gator-home .about { padding-top: 44px; }
        .gator-home .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8vw; padding: 90px 0; }
        .gator-home .about-lead { font: 400 clamp(38px, 5.5vw, 86px)/1.02 var(--font-display); letter-spacing: -0.055em; }
        .gator-home .about-lead em { font-size: 1.2em; color: var(--primary); }
        .gator-home .about-copy { max-width: 610px; }
        .gator-home .about-copy p { font-size: clamp(20px, 2.3vw, 32px); line-height: 1.45; letter-spacing: -0.025em; }
        .gator-home .about-copy p + p { margin-top: 28px; font-size: 16px; line-height: 1.75; color: var(--muted); letter-spacing: 0; }
        .gator-home .word-reveal span { transition: color 0.25s; color: var(--text); }
        .gator-home .word-reveal span.is-muted { color: #7e8e77; }
        .gator-home .recognition { border-top: 1px solid var(--line); }
        .gator-home .recognition a { display: grid; grid-template-columns: 1fr 1.4fr auto; align-items: center; gap: 24px; padding: 25px 0; border-bottom: 1px solid var(--line); }
        .gator-home .recognition .mono { color: var(--muted); }
        .gator-home .recognition strong { font-size: 18px; font-weight: 500; }
        .gator-home .recognition a > span:last-child { font-size: 26px; color: var(--primary); }
        .gator-home .contact { background: var(--primary); color: var(--bg); padding-top: 32px; padding-bottom: 65px; }
        .gator-home .contact .section-line { border-color: #05080555; color: var(--bg); }
        .gator-home .contact h2 { font: 400 clamp(56px, 9vw, 150px)/0.94 var(--font-display); text-transform: uppercase; letter-spacing: -0.045em; margin: 76px 0; }
        .gator-home .contact-link { display: flex; align-items: center; gap: 30px; font-size: clamp(19px, 2.7vw, 38px); font-weight: 600; border-bottom: 2px solid currentColor; padding-bottom: 22px; min-height: 56px; }
        .gator-home .contact-handle { margin-left: auto; font: 500 13px var(--font-mono); }
        .gator-home .contact-link > span:last-child { font-size: 42px; transition: translate 0.25s; }
        .gator-home .contact-link:hover > span:last-child { translate: 5px -5px; }
        .gator-home .contact :focus-visible { outline-color: var(--bg); }
        .gator-home.motion-ready [data-reveal] { opacity: 0; transform: translateY(24px); transition: opacity 0.7s,
            transform 0.7s; }
        .gator-home.motion-ready [data-reveal].is-visible { opacity: 1; transform: none; }
        .gator-home .hero h1 > span { animation: enter 0.85s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
        .gator-home .hero h1 > span:nth-child(2) { animation-delay: 0.12s; }
        .gator-home .hero h1 > span:nth-child(3) { animation-delay: 0.24s; }
        @keyframes enter {
          from { opacity: 0; translate: 0 25px; clip-path: inset(100% 0 0); }
          to { opacity: 1; translate: 0 0; clip-path: inset(0); }
        }
        @media (min-width: 1800px) {
          .gator-home .hero-composition { min-height: 620px; }
          .gator-home .window-stack { height: 660px; }
          .gator-home .project-window img { height: 450px; }
        }
        @media (max-width: 1000px) {
          .gator-home .hero-composition { min-height: 460px; }
          .gator-home .hero h1 { font-size: 8.2vw; }
          .gator-home .sculpture-stage { min-height: 440px; }
          .gator-home .hero-bottom { gap: 22px; }
          .gator-home .hero-bottom p { font-size: 13px; }
          .gator-home .primary-link { gap: 22px; padding: 16px; }
          .gator-home .project-window img { height: 360px; }
          .gator-home .window-stack { height: 560px; }
          .gator-home .about-grid { gap: 5vw; }
          .gator-home .recognition a { grid-template-columns: 1fr 1.2fr auto; }
        }
        @media (max-width: 760px) {
          .gator-home { scroll-padding-top: 70px; }
          .gator-home .site-header { height: 70px; }
          .gator-home .header-logo { width: 108px; }
          .gator-home .desktop-nav { display: none; }
          .gator-home .menu-button { display: grid; gap: 7px; place-content: center; background: none; border: 0; width: 44px; height: 44px; }
          .gator-home .menu-button span { width: 22px; height: 1px; background: var(--text); }
          .gator-home .hero { padding-top: 22px; min-height: calc(100svh - 70px); }
          .gator-home .hero-top { font-size: 9px; }
          .gator-home .hero-composition { grid-template-columns: 1fr; min-height: 0; padding-top: 34px; }
          .gator-home .hero h1 { font-size: clamp(52px, 13vw, 88px); line-height: 0.9; position: relative; }
          .gator-home .sculpture-stage { height: 340px; min-height: 0; margin-top: -10px; }
          .gator-home .hero-bottom { flex-wrap: wrap; gap: 20px; padding-top: 20px; }
          .gator-home .hero-bottom p { width: 100%; font-size: 14px; }
          .gator-home .primary-link { flex: 1; max-width: 300px; }
          .gator-home .motion-toggle { margin-left: auto; }
          .gator-home .window-stack { height: 460px; margin: 32px auto 6px; }
          .gator-home .project-window { width: 86%; }
          .gator-home .project-window img { height: 310px; }
          .gator-home .project-window--0 { top: 105px; }
          .gator-home .project-window--1 { left: 29%; top: 34px; transform: translateX(-50%) scale(0.67) rotate(-4deg); }
          .gator-home .project-window--2 { left: 72%; transform: translateX(-50%) scale(0.55) rotate(4deg); }
          .gator-home .window-bar { font-size: 8px; height: 34px; padding: 0 10px; }
          .gator-home .section-pad { padding-bottom: 65px; }
          .gator-home .about-grid { grid-template-columns: 1fr; gap: 35px; padding: 55px 0; }
          .gator-home .about-lead { font-size: 52px; }
          .gator-home .about-copy p { font-size: 25px; }
          .gator-home .recognition a { grid-template-columns: 1fr auto; gap: 8px; }
          .gator-home .recognition .mono { grid-column: 1; }
          .gator-home .recognition strong { grid-column: 1; font-size: 17px; }
          .gator-home .recognition a > span:last-child { grid-column: 2; grid-row: 1/3; }
          .gator-home .contact h2 { margin: 56px 0; font-size: clamp(44px, 10.5vw, 78px); }
          .gator-home .contact-link { font-size: 19px; flex-wrap: wrap; gap: 12px; }
          .gator-home .contact-handle { margin-left: 0; order: 2; flex-basis: 100%; font-size: 12px; }
          .gator-home .contact-link > span:last-child { margin-left: auto; font-size: 30px; }
        }
        @media (max-width: 380px) {
          .gator-home .hero-top { font-size: 8px; }
          .gator-home .sculpture-stage { height: 285px; }
          .gator-home .hero h1 { font-size: 13vw; }
          .gator-home .motion-toggle { font-size: 9px; }
          .gator-home .primary-link { font-size: 12px; gap: 16px; }
          .gator-home .project-window img { height: 260px; }
          .gator-home .window-stack { height: 410px; }
          .gator-home .section-line { font-size: 9px; }
        }
        .gator-home.motion-paused *,
        .gator-home.motion-paused *::before,
        .gator-home.motion-paused *::after { animation-play-state: paused !important; }
        .gator-home.motion-paused [data-reveal] { opacity: 1; transform: none; transition: none; }
        .gator-home.motion-paused .word-reveal span { color: var(--text); }
        @media (prefers-reduced-motion: reduce) {
          .gator-home { scroll-behavior: auto; }
          .gator-home *,
          .gator-home *::before,
          .gator-home *::after { animation: none !important; transition: none !important; }
          .gator-home.motion-ready [data-reveal] { opacity: 1; transform: none; }
          .gator-home .word-reveal span.is-muted { color: var(--text); }
        }
        /* The work display follows the supplied walkthrough: full panels that stack on scroll. */
        .gator-home .project-stack { padding-top: 42px; }
        .gator-home .project-panel { position: sticky; top: 108px; display: grid; grid-template-columns: 42% 58%; height: 76svh; min-height: 540px; max-height: 760px; margin-bottom: 32px; border: 1px solid #39522f; background: #0d1b0b; transform-origin: center top; overflow: hidden; will-change: transform; }
        .gator-home .project-panel:last-child { margin-bottom: 0; }
        .gator-home .bilai-panel { background: #10220d; }
        .gator-home .giftour-panel { background: #142810; }
        .gator-home .project-copy { padding: 40px; display: flex; flex-direction: column; justify-content: space-between; gap: 35px; }
        .gator-home .project-copy > .mono { color: var(--muted); font-size: 11px; }
        .gator-home .project-copy h3 { font: 400 clamp(48px, 5.5vw, 90px)/1 var(--font-display); letter-spacing: -0.055em; margin-bottom: 26px; }
        .gator-home .project-copy p { font-size: clamp(17px, 1.8vw, 26px); line-height: 1.4; max-width: 370px; letter-spacing: -0.025em; color: #c5d0bd; }
        .gator-home .project-open { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid #809b73; font-size: 13px; max-width: 270px; }
        .gator-home .project-open span { font-size: 26px; color: var(--primary); transition: translate 0.25s; }
        .gator-home .project-open:hover span { translate: 4px -4px; }
        .gator-home .project-art { display: grid; place-items: center; padding: 35px; min-width: 0; overflow: hidden; background: radial-gradient(ellipse at 50% 50%, #74ab3533, transparent 73%); }
        .gator-home .project-art img { width: 100%; height: 100%; max-height: calc(76svh - 70px); object-fit: contain; filter: drop-shadow(0 25px 28px #0006); transition: transform 0.6s cubic-bezier(0.2, 0.7, 0.2, 1); }
        .gator-home .project-art:hover img { transform: scale(1.025); }
        @media (min-width: 1800px) {
          .gator-home .project-art img { max-height: 690px; }
        }
        @media (max-width: 1000px) {
          .gator-home .project-copy { padding: 28px; }
          .gator-home .project-art { padding: 24px; }
        }
        @media (max-width: 760px) {
          .gator-home .project-stack { padding-top: 28px; }
          .gator-home .project-panel { position: relative; top: auto; display: flex; flex-direction: column; height: auto; min-height: 0; max-height: none; margin-bottom: 24px; will-change: auto; }
          .gator-home .project-copy { padding: 25px; gap: 28px; }
          .gator-home .project-copy h3 { font-size: 48px; margin-bottom: 16px; }
          .gator-home .project-copy p { font-size: 18px; max-width: 420px; }
          .gator-home .project-open { max-width: none; }
          .gator-home .project-art { padding: 0 25px 28px; }
          .gator-home .project-art img { height: auto; max-height: 480px; max-width: 100%; width: auto; }
          .gator-home .project-art:hover img { transform: none; }
        }
        .gator-home.motion-paused .project-panel { transform: none !important; }
        @media (prefers-reduced-motion: reduce) {
          .gator-home .project-panel { position: relative; top: auto; transform: none !important; will-change: auto; }
        }
        /* Color-matched project surfaces; original artwork remains unfiltered. */
        .gator-home .project-panel { --panel-ink: #101810; --panel-muted: #25331d; background: #b9d66d; color: var(--panel-ink); border-color: #10181035; margin-bottom: 0; }
        .gator-home .bilai-panel { --panel-muted: #362013; background: #fa7d1f; }
        .gator-home .giftour-panel { --panel-muted: #263044; background: #b5c6df; }
        .gator-home .project-copy > .mono,
        .gator-home .project-copy p { color: var(--panel-muted); }
        .gator-home .project-copy h3 { font-family: var(--font-sans); font-weight: 700; letter-spacing: -0.07em; }
        .gator-home .project-open { border-color: #10181088; }
        .gator-home .project-open span { color: var(--panel-ink); }
        .gator-home .project-art { background: none; padding: 46px; }
        .gator-home .project-art img { max-height: calc(76svh - 100px); transform: rotate(-4deg); filter: drop-shadow(0 25px 24px #10181035); }
        .gator-home .bilai-panel .project-art img { transform: rotate(4deg); }
        .gator-home .giftour-panel .project-art img { transform: rotate(-3deg); }
        .gator-home .project-art:hover img { transform: rotate(0) scale(1.015); }
        .gator-home .project-panel a:focus-visible { outline-color: var(--panel-ink); }
        @media (min-width: 1800px) {
          .gator-home .project-art img { max-height: 650px; }
        }
        @media (max-width: 760px) {
          .gator-home .project-panel { margin-bottom: 22px; }
          .gator-home .project-art { padding: 10px 35px 35px; }
          .gator-home .project-art img { max-height: 460px; max-width: 90%; }
          .gator-home .project-art:hover img { transform: rotate(0); }
          .gator-home .project-copy h3 { font-size: 50px; }
        }
        /* Original artwork, animated only while its link is hovered or focused. */
        .gator-home .header-logo img { transform-origin: 50% 55%; transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
            filter 0.3s; }
        .gator-home .header-logo:hover img,
        .gator-home .header-logo:focus-visible img,
        .gator-home .work-page .header-logo:hover img,
        .gator-home .work-page .header-logo:focus-visible img { transform: translateY(-2px) rotate(-3deg) scale(1.055); filter: drop-shadow(0 0 10px #74da4655); }
        .gator-home .header-logo:active img,
        .gator-home .work-page .header-logo:active img { transform: scale(0.97); }
        .gator-home .contact-connect { border-bottom: 2px solid currentColor; padding-bottom: 26px; display: flex; align-items: center; gap: 40px; }
        .gator-home .contact-connect > p { font-size: clamp(22px, 2.6vw, 38px); font-weight: 600; letter-spacing: -0.025em; margin-right: auto; }
        .gator-home .contact-channels { display: flex; align-items: center; gap: 32px; }
        .gator-home .contact-channel { display: flex; align-items: center; gap: 14px; min-height: 56px; padding: 12px 0; transition: transform 0.25s; }
        .gator-home .contact-channel > svg { width: 26px; height: 26px; flex-shrink: 0; }
        .gator-home .contact-channel > span:not(.channel-arrow) { font: 600 14px/1.4 var(--font-sans); }
        .gator-home .contact-channel small { display: block; margin-top: 5px; font: 400 11px/1.5 var(--font-mono); }
        .gator-home .contact-channel .channel-arrow { font-size: 22px; margin-left: 10px; transition: transform 0.25s; }
        .gator-home .contact-channel:hover .channel-arrow { transform: translate(3px, -3px); }
        .gator-home .contact-channel:hover > span:not(.channel-arrow) { text-decoration: underline; text-underline-offset: 4px; }
        @media (max-width: 1050px) {
          .gator-home .contact-connect { align-items: flex-start; flex-direction: column; gap: 20px; }
          .gator-home .contact-channels { width: 100%; justify-content: space-between; gap: 24px; }
          .gator-home .contact-channel { flex: 1; }
        }
        @media (max-width: 520px) {
          .gator-home .contact-channels { align-items: stretch; flex-direction: column; gap: 8px; }
          .gator-home .contact-channel { border-top: 1px solid #05080545; padding: 15px 0; }
          .gator-home .contact-channel .channel-arrow { margin-left: auto; }
          .gator-home .contact-channel > svg { width: 24px; height: 24px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .gator-home .header-logo img,
          .gator-home .contact-channel,
          .gator-home .contact-channel .channel-arrow { transition: none; }
          .gator-home .header-logo:hover img,
          .gator-home .header-logo:focus-visible img,
          .gator-home .work-page .header-logo:hover img,
          .gator-home .work-page .header-logo:focus-visible img { transform: none; filter: drop-shadow(0 0 7px #74da4644); }
        }
        .gator-home.motion-paused .header-logo img { transition: none; transform: none; }
        .gator-home .site-header { background: #000; backdrop-filter: none; }
        /* Rotating projects */
        .gator-home .window-stack { position: relative; perspective: 1400px; height: calc(clamp(250px, 30vw, 380px) + 168px); max-width: 1240px; margin: 42px auto 0; overflow: hidden; }
        .gator-home .project-window { position: absolute; top: 105px; left: 50%; width: 48%; max-width: 520px; border: 1px solid #374532; border-radius: 7px; overflow: hidden; box-shadow: 0 35px 65px #0006; transition: transform 0.8s cubic-bezier(0.2, 0.7, 0.2, 1),
            opacity 0.8s; transform-origin: center; }
        .gator-home .project-window.slot-0 { z-index: 3; transform: translateX(-50%); opacity: 1; }
        .gator-home .project-window.slot--1 { z-index: 1; transform: translateX(-122%) translateY(-85px) rotateY(20deg) rotate(-5deg) scale(0.78); opacity: 0.65; }
        .gator-home .project-window.slot-1 { z-index: 1; transform: translateX(22%) translateY(-85px) rotateY(-20deg) rotate(5deg) scale(0.78); opacity: 0.65; }
        .gator-home .window-bar { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #10181055; color: #101810; font-size: 10px; }
        .gator-home .project-window img { width: 100%; height: clamp(250px, 30vw, 380px); object-fit: contain; padding: 16px; user-select: none; }
        @media (max-width: 760px) {
          .gator-home .window-stack { height: 450px; margin: 32px auto 6px; }
          .gator-home .project-window { width: 82%; top: 75px; }
          .gator-home .project-window img { height: 310px; padding: 12px; }
          .gator-home .window-bar { font-size: 8px; height: 34px; padding: 0 10px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .gator-home .project-window { transition: none; }
        }
        .gator-home .window-stack { cursor: grab; user-select: none; }
        .gator-home .window-stack:active { cursor: grabbing; }
        .gator-home .project-pick { display: block; width: 100%; padding: 0; border: 0; background: none; cursor: pointer; }
        .gator-home .selected.section-pad { padding-bottom: 44px; }
        .gator-home .back-to-top { position: fixed; right: clamp(18px, 3vw, 40px); bottom: calc(22px + env(safe-area-inset-bottom)); z-index: 60; display: grid; place-items: center; width: 52px; height: 52px; padding: 0; border: 1px solid #374532; border-radius: 50%; background: #050805; color: #f6f5ed; cursor: pointer; box-shadow: 0 8px 22px #0005; transition: color 0.2s,
            border-color 0.2s,
            transform 0.2s; }
        .gator-home .back-to-top svg { transform: rotate(90deg); }
        .gator-home .back-to-top:hover { color: #68cc35; border-color: #68cc35; transform: translateY(-3px); }
        @media (prefers-reduced-motion: reduce) {
          .gator-home .back-to-top { transition: none; }
        }
      `}</style>
    </div>
  );
}
