"use client";

import { NavBar } from "./components/NavBar";
import { Label } from "@/components/ui/label";
import { Archivo_Black, IBM_Plex_Mono } from "next/font/google";
const archivoBlack = Archivo_Black({ weight: "400", subsets: ["latin"] });
const ibmPlexMono = IBM_Plex_Mono({ weight: "600", subsets: ["latin"] });

export default function App() {
  return (
    <main className="relative flex min-h-screen flex-col bg-black">
       {/* video */}
      <div className="fixed inset-0 z-0 h-screen w-screen overflow-hidden">
        <video autoPlay loop muted playsInline className="h-full w-full object-cover opacity-80 saturate-50">
          <source src="/starfield.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[#050505]/50" /> </div>
      {/* upper black body jeikhane teeth */}
      <div className="relative z-10 flex min-h-screen flex-col">
        <NavBar />
      {/* text */}
        <section className="flex flex-1 flex-col justify-center border-b border-[#4ade80]/30 px-10 pb-10 pt-10 text-[#F4F4F0]">
         <h1 className={`max-w-[1280px] text-[clamp(64px,11vw,176px)] uppercase leading-[0.84] ${archivoBlack.className}`}>
            WE MAKE<br />DIGITAL<br />WORK WITH<br />TEETH.  </h1>
       </section>
      </div>
    </main>
  );
}