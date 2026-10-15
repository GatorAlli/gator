"use client";
import { NavBar } from "./components/NavBar";

import { Label } from "@/components/ui/label";
import Image from "next/image";

import giftour from "@/public/projects/giftour.png";
import bilai from "@/public/projects/bilai.png";
import clean from "@/public/projects/clean.png";

import { Archivo_Black, IBM_Plex_Mono, Manrope } from "next/font/google";

const archivoBlack = Archivo_Black({ weight: "400", subsets: ["latin"] });
const ibmPlexMono = IBM_Plex_Mono({ weight: "600", subsets: ["latin"] });
const manrope = Manrope({ weight: "600", subsets: ["latin"] });

export default function App() {
  return (
    <main className="relative flex min-h-screen flex-col bg-black">
      {/* video */}
      <div className="fixed inset-0 z-0 h-screen w-screen overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover opacity-80 saturate-50"
        >
          <source src="/starfield.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[#050505]/50" />{" "}
      </div>
      {/* upper black body jeikhane teeth */}
      <div className="relative z-10 flex min-h-screen flex-col">
        <NavBar />
        {/* text */}
        <div className="px-5 pt-5 ">
          <Label className={`text-white text-[10px] ${ibmPlexMono.className}`}>
            INDEPENDENT CREATIVE STUDIO
          </Label>
          <section className="flex flex-1 flex-col justify-center  text-[#F4F4F0]">
            <h1
              className={`max-w-[1280px] text-[clamp(64px,11vw,176px)] pt-20 pb-20 uppercase leading-[0.84] ${archivoBlack.className}`}
            >
              WE MAKE
              <br />
              DIGITAL
              <br />
              WORK WITH
              <br />
              TEETH.{" "}
            </h1>

            <Label className={`${manrope.className} text-[10px] pb-5`}>
              &#47;&#47; WEBSITES THAT DON&apos;T SUCK
            </Label>
          </section>
        </div>
        <div className="bg-black border-t border-primary/50 px-5 pt-4">
          <section className="flex flex-1 flex-col justify-center b text-[#F4F4F0]">
            <div
              className={`${archivoBlack.className}  pb-4 border-b flex justify-between`}
            >
              <Label className="text-[8px]">SELECTED WORK</Label>
              <Label className="text-[8px]">03 PROJECTS</Label>
            </div>
            <div className="relative top-20 pb-135 ">
              <Image
                src={giftour}
                alt=""
                height={450}
                width={450}
                className="absolute left-20 border-primary opacity-50 border-3"
              />
              <Image
                src={bilai}
                alt=""
                height={450}
                width={450}
                className="absolute right-20 border-[#42d000] border-3 opacity-50 top-15"
              />
              <Image
                src={clean}
                alt=""
                height={600}
                width={600}
                className="absolute left-3/10 z-20 top-40 border-[#42d000] border-3"
              />
            </div>
            <div className={`border-t border-white/50 pt-20 `}>
              <div className="flex flex-col justify-between items-center gap-x-12 gap-y- p-8 text-center">
                <Label className={`text-6xl ${archivoBlack.className}`}>
                  CLEAN
                </Label>
                <Label className={`${ibmPlexMono.className} text-primary`}>
                  CLEAN CLOTHES START HERE
                </Label>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
