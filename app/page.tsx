"use client";
import NavBar from "./components/NavBar";

import { Label } from "@/components/ui/label";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

import giftour from "@/public/projects/giftour.png";
import bilai from "@/public/projects/bilai.png";
import clean from "@/public/projects/clean.png";

import { Archivo_Black, IBM_Plex_Mono, Manrope } from "next/font/google";
import { useState } from "react";
import clsx from "clsx";

const archivoBlack = Archivo_Black({ weight: "400", subsets: ["latin"] });
const ibmPlexMono = IBM_Plex_Mono({ weight: "600", subsets: ["latin"] });
const manrope = Manrope({ weight: "600", subsets: ["latin"] });

export default function App() {
  const [imageSelection, setImageSelection] = useState(1);

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
          <section className="flex flex-1 flex-col justify-center text-[#F4F4F0]">
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
          <section className="flex flex-1 flex-col justify-center text-[#F4F4F0]">
            <div
              className={`${archivoBlack.className}  pb-4 border-b flex justify-between`}
            >
              <Label className="text-[8px]">SELECTED WORK</Label>
              <Label className="text-[8px]">03 PROJECTS</Label>
            </div>
            <div className="relative w-full aspect-2/1">
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-[80%] z-0 border-t border-white/50"
              />
              <div className="absolute left-[10%] top-[7%] w-[32%] border-primary opacity-50 border bg-black">
                <div
                  className={`flex justify-between ${ibmPlexMono.className} p-2 opacity-50 text-primary`}
                >
                  <Label className="text-[10px]">01</Label>
                  <Label className="text-[10px]">2026</Label>
                </div>
                <Image
                  src={giftour}
                  alt=""
                  height={450}
                  width={450}
                  className="block w-full h-auto border-t border-primary"
                />
              </div>
              <div className="absolute right-[10%] top-[15%] w-[32%]">
                <div className="border-primary border opacity-50 bg-black">
                  <div
                    className={`flex justify-between ${ibmPlexMono.className} p-2 opacity-50 text-primary `}
                  >
                    <Label className="text-[10px]">02</Label>
                    <Label className="text-[10px]">2026</Label>
                  </div>
                  <Image
                    src={bilai}
                    alt=""
                    height={450}
                    width={450}
                    className="block w-full h-auto border-t border-primary"
                  />
                </div>
                <div className="absolute right-0 top-full flex gap-2 pt-60">
                  {["Giftour", "bilai", "clean"].map((name, index) => {
                    const selection = index + 1;
                    const isSelected = imageSelection === selection;

                    return (
                      <Button
                        key={name}
                        variant="ghost"
                        aria-pressed={isSelected}
                        onClick={() => setImageSelection(selection)}
                        className={clsx(
                          ibmPlexMono.className,
                          "rounded-none border-primary",
                          isSelected
                            ? "bg-primary text-black hover:bg-primary hover:text-black"
                            : "bg-black text-white hover:bg-black hover:text-white",
                        )}
                      >
                        <span className={clsx(isSelected ? "text-black" : "text-primary")}>
                          {String(selection).padStart(2, "0")}
                        </span>
                        <span>{name}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 top-[29%] w-[42%] z-20 border-primary border bg-black">
                <div
                  className={`flex justify-between ${ibmPlexMono.className} p-2 opacity-50 text-primary`}
                >
                  <Label className="text-[10px]">02</Label>
                  <Label className="text-[10px]">2026</Label>
                </div>
                <Image
                  src={clean}
                  alt=""
                  height={600}
                  width={600}
                  className="block w-full h-auto border-t border-primary"
                />
                <div className="absolute inset-x-0 top-full flex flex-col items-center gap-1 pt-4 text-center">
                  <Label className={`text-6xl ${archivoBlack.className}`}>
                    CLEAN
                  </Label>
                  <Label className={`${ibmPlexMono.className} text-primary`}>
                    CLEAN CLOTHES START HERE
                  </Label>
                </div>
              </div>
            </div>
          </section>
        </div>
        <section className="bg-[#e3e2da]">
          <div className="px-5">
            <div
              className={`flex justify-between ${ibmPlexMono.className} border border-b-black py-4`}
            >
              <Label>NO BROKEN LINKS</Label>
              <Label>NO 90s NOSTALGIA TRIP</Label>
            </div>
            <div className="py-30 flex justify-between gap-20 flex-wrap items-center">
              {" "}
              <Label className={`${archivoBlack.className} text-8xl`}>
                WEBSITES <br /> THAT DON&apos;T <br /> SUCK.
              </Label>
              <Label
                className={`${manrope.className} text-[30px] font text-right`}
              >
                Say goodbye to being charged premium <br /> for incomplete
                websites that don&apos;t work. <br /> We don&apos;t ship
                products with broken links <br />
                that remind you of the 90s web.
              </Label>
            </div>
            <div className="flex justify-between border-t border-black py-4">
              <Label className={`${ibmPlexMono.className}`}>
                MODERN WEBSITES
              </Label>
              <Label className={`${ibmPlexMono.className}`}>MADE EASY</Label>
            </div>
          </div>
          <div className="bg-theme px-5 pt-20 pb-10">
            <div className="flex items-center gap-4 pb-10">
              <span
                aria-hidden="true"
                className="size-3 shrink-0 rounded-full bg-black"
              />
              <Label className={`${ibmPlexMono.className}`}>
                HAVE SOMETHING WITH A BITE?
              </Label>
            </div>
            <div className="border-b-2 border-black pb-3">
              <Label className={`${archivoBlack.className} pb-15 text-9xl`}>
                EMAIL US <br />
                YOUR IDEA
              </Label>
              <Link
                href="mailto:gator.gdev@gmail.com"
                type="email"
                className={`${manrope.className} text-4xl`}
              >
                gator.gdev@gmail.com
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
