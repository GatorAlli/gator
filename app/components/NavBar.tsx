"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IBM_Plex_Mono } from "next/font/google";

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
});

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", close);

    return () => window.removeEventListener("keydown", close);
  }, []);

  return (
    <header className={`gator-navbar ${mono.className}`}>
      {/* Logo */}
      <Link
        href="/"
        className="gator-logo"
        aria-label="Gator homepage"
        onClick={() => setMenuOpen(false)}
      >
        <img src="/gator-logo.png" alt="Gator" />
      </Link>

      {/* navigation */}
      <nav className="desktop-nav" aria-label="Main navigation">
        <Link
          href="/work"
          aria-current={pathname === "/work" ? "page" : undefined}
        >
          Work
        </Link>

        <Link href="/#about">Studio</Link>
        <Link href="/#contact">Contact</Link>
      </nav>

      {/* Mobile menu button */}
      <button
        type="button"
        className="menu-button"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        aria-controls="gator-mobile-navigation"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          {menuOpen ? (
            <path d="m6 6 12 12M6 18 18 6" />
          ) : (
            <path d="M4 5h16M4 12h16M4 19h16" />
          )}
        </svg>
      </button>

      {/* Mobile navigation */}
      {menuOpen && (
        <nav
          id="gator-mobile-navigation"
          className="mobile-nav"
          aria-label="Mobile navigation"
        >
          <Link
            href="/work"
            aria-current={pathname === "/work" ? "page" : undefined}
            onClick={() => setMenuOpen(false)}
          >
            Work
          </Link>

          <Link href="/#about" onClick={() => setMenuOpen(false)}>
            Studio
          </Link>

          <Link href="/#contact" onClick={() => setMenuOpen(false)}>
            Contact
          </Link>
        </nav>
      )}

      {/* Navbar styles */}
      <style jsx>{`
        .gator-navbar {
          position: sticky;
          top: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
          width: 100%;
          height: 88px;
          padding: 0 clamp(20px, 4vw, 76px);
          box-sizing: border-box;
          border-bottom: 1px solid #374532;
          background: #000;
          color: #f6f5ed;
        }

        .gator-navbar :global(a) {
          color: inherit;
          text-decoration: none;
          -webkit-tap-highlight-color: transparent;
        }

        .gator-navbar :global(.gator-logo) {
          display: block;
          width: 128px;
          flex-shrink: 0;
        }

        .gator-logo img {
          display: block;
          width: 100%;
          height: auto;
          transform-origin: 50% 55%;
          transition:
            transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
            filter 0.3s;
        }

        .gator-navbar :global(.gator-logo:hover) img,
        .gator-navbar :global(.gator-logo:focus-visible) img {
          transform: translateY(-2px) rotate(-3deg) scale(1.055);
          filter: drop-shadow(0 0 10px #74da4655);
        }

        .gator-navbar :global(.gator-logo:active) img {
          transform: scale(0.97);
        }

        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 40px;
          font-size: 12px;
          font-weight: 500;
          line-height: 1;
          text-transform: uppercase;
        }

        .desktop-nav :global(a) {
          position: relative;
          padding: 15px 0;
        }

        .desktop-nav :global(a::after) {
          content: "";
          position: absolute;
          right: 0;
          bottom: 6px;
          left: 0;
          height: 1px;
          background: #68cc35;
          transform: scaleX(0);
          transform-origin: right;
          transition: transform 0.25s;
        }

        .desktop-nav :global(a:hover::after) {
          transform: scaleX(1);
          transform-origin: left;
        }

        .gator-navbar :global(a[aria-current="page"]) {
          color: #68cc35;
        }

        .menu-button {
          display: none;
          place-items: center;
          width: 44px;
          height: 44px;
          padding: 0;
          border: 0;
          background: transparent;
          color: inherit;
          cursor: pointer;
        }

        .mobile-nav {
          position: absolute;
          top: 100%;
          right: 0;
          left: 0;
          display: grid;
          background: #000;
          border-bottom: 1px solid #374532;
        }

        .mobile-nav :global(a) {
          padding: 18px 20px;
          border-top: 1px solid #374532;
          font-size: 13px;
          font-weight: 500;
          line-height: 1;
          text-transform: uppercase;
        }

        .gator-navbar :global(a:focus-visible),
        .menu-button:focus-visible {
          outline: 2px solid #a4e57b;
          outline-offset: 4px;
        }

        @media (min-width: 761px) {
          .mobile-nav {
            display: none;
          }
        }

        @media (max-width: 760px) {
          .gator-navbar {
            height: 70px;
            padding-inline: 20px;
          }

          .gator-navbar :global(.gator-logo) {
            width: 108px;
          }

          .desktop-nav {
            display: none;
          }

          .menu-button {
            display: grid;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .gator-logo img,
          .desktop-nav :global(a::after) {
            transition: none;
          }

          .gator-navbar :global(.gator-logo:hover) img,
          .gator-navbar :global(.gator-logo:focus-visible) img {
            transform: none;
          }
        }
      `}</style>
    </header>
  );
}