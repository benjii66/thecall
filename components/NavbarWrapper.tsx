

import { Suspense } from "react";
import { cookies } from "next/headers";
import { Navbar } from "./Navbar";
import { prisma } from "@/lib/prisma";

export async function NavbarWrapper() {
  const cookieStore = await cookies();
  const puuid = cookieStore.get("user_puuid")?.value;
  
  let currentUser = { name: "InvitÃ©", tag: "" };

  if (puuid) {
      try {
          const user = await prisma.user.findUnique({
              where: { riotPuuid: puuid },
              select: { riotGameName: true, riotTagLine: true }
          });
          if (user?.riotGameName) {
              currentUser = { 
                  name: user.riotGameName, 
                  tag: user.riotTagLine || "" 
              };
          }
      } catch (e) {
          console.error("Failed to fetch navbar user", e);
      }
  }

  return (
    <Suspense fallback={<div className="h-16 w-full bg-[#05060b]" />}>
      <Navbar currentUser={currentUser} />
    </Suspense>
  );
}
