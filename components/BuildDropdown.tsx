"use client";

import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

type BuildDropdownProps = {
  title?: string;
  items: string[]; // item ids ou noms
  runes: string[];
};

const DD_VERSION = "14.18.1";
const itemIcon = (id: string) =>
  `https://ddragon.leagueoflegends.com/cdn/${DD_VERSION}/img/item/${id}.png`;
const runeIcon = (path: string) =>
  `https://ddragon.leagueoflegends.com/cdn/img/${path}`;


export function BuildDropdown({
  title = "Build dans la partie",
  items,
  runes,
}: BuildDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-black/30">
      {/* HEADER */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-white/80 hover:text-white"
      >
        <span>{title}</span>
        <ChevronDown
          size={18}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* CONTENT */}
      <div
        className={`
    overflow-hidden
    transition-[max-height,opacity,transform]
duration-1200
ease-[cubic-bezier(0.4,0,0.2,1)]
    ${
      open
        ? "max-h-[400px] opacity-100 translate-y-0"
        : "max-h-0 opacity-0 -translate-y-1"
    }
  `}
      >
        <div className="space-y-4 px-4 pb-4">
          {/* ITEMS */}
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-white/40">
              Items
            </p>
            <div className="flex gap-2">
              {items.map((id) => (
                <Image
                  key={id}
                  src={itemIcon(id)}
                  alt={id}
                  title={id} // 👈 tooltip natif
                  width={36}
                  height={36}
                  className="rounded"
                />
              ))}
            </div>
          </div>

          {/* RUNES */}
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-white/40">
              Runes
            </p>
            <div className="flex gap-3">
              {runes.map((r) => (
                <img key={r} src={runeIcon(r)} alt="rune" className="w-8 h-8"/>
                
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
