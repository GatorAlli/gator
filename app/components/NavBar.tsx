import Image from "next/image";
import Link from "next/link";
import { IBM_Plex_Mono } from "next/font/google";
import logo from "@/public/logo.png";

const ibmPlexMono = IBM_Plex_Mono({ 
  weight: "600", 
  subsets: ["latin"] 
});

export function NavBar() {
  return (
   <div className="sticky top-0 z-50 flex h-[76px] w-full items-center justify-between border-b border-[#4ade80] bg-black px-10 shadow-[0_2px_15px_rgba(74,222,128,0.15)]">
      {/* logo gator */}
      <Link href="/">
        <Image src={logo} alt="Gator Logo" width={102} height={32} className="h-8 w-auto drop-shadow-md"/></Link>
        
      {/* work, studio, contact and ainimation */}
      <div className={`flex gap-9 text-[11px] uppercase text-[#F4F4F0] ${ibmPlexMono.className}`}>
        
        <Link href="#work" className="group relative py-1 transition-colors hover:text-[#4ade80]">
          Work
          <span className="absolute -bottom-1.5 left-0 right-0 h-[2px] origin-right scale-x-0 bg-[#4ade80] transition-transform duration-300 ease-out group-hover:origin-left group-hover:scale-x-100" />
        </Link>

        <Link href="#studio" className="group relative py-1 transition-colors hover:text-[#4ade80]">
          Studio
          <span className="absolute -bottom-1.5 left-0 right-0 h-[2px] origin-right scale-x-0 bg-[#4ade80] transition-transform duration-300 ease-out group-hover:origin-left group-hover:scale-x-100" />
        </Link>

        <Link href="#contact" className="group relative py-1 transition-colors hover:text-[#4ade80]">
          Contact
          <span className="absolute -bottom-1.5 left-0 right-0 h-[2px] origin-right scale-x-0 bg-[#4ade80] transition-transform duration-300 ease-out group-hover:origin-left group-hover:scale-x-100" />
        </Link>
        
      </div>
      
    </div>
  );
}