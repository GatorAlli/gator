"use client";

import { NavBar } from "./components/NavBar";
import { Label } from "@/components/ui/label";
import { AddressBookIcon, ArrowClockwiseIcon } from "@phosphor-icons/react";

export default function App() {
  return (
    <div>
      <NavBar />
      <div>
        <Label className="font-heading">
          WE MAKE <br /> DIGITAL <br /> WORK WITH <br /> TEETH.
        </Label>
      </div>
    </div>
  );
}
