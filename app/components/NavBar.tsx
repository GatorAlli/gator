import Image from "next/image";
import Link from "next/link";
import logo from "@/public/logo.png";
import { Label } from "@/components/ui/label";

import { Button } from "@/components/ui/button";
export function NavBar() {
  return (
    <div className="flex">
      <Image src={logo} alt="" width={100} height={100} />
      <Link href="/">
        <Label>Work</Label>
      </Link>
      <Link href="/">
        <Label>Contact</Label>
      </Link>
    </div>
  );
}
