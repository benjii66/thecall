

import { Suspense } from "react";
import { cookies } from "next/headers";
import { Navbar } from "./Navbar";
import { prisma } from "@/lib/prisma";
import { SubscriptionWarningBanner } from "./SubscriptionWarningBanner";

export async function NavbarWrapper() {
  const cookieStore = await cookies();
  const puuid = cookieStore.get("user_puuid")?.value;
  
  let currentUser = { name: "Guest", tag: "" };
  let hasMatches = false;

  if (puuid) {
      try {
          const user = await prisma.user.findUnique({
              where: { riotPuuid: puuid },
              select: { 
                  riotGameName: true, 
                  riotTagLine: true,
                  _count: {
                      select: { matches: true }
                  }
              }
          });
          if (user?.riotGameName) {
              currentUser = { 
                  name: user.riotGameName, 
                  tag: user.riotTagLine || "" 
              };
              hasMatches = (user._count.matches > 0);
          }
      } catch (e) {
          console.error("Failed to fetch navbar user", e);
      }
  }

  return (
    <Suspense fallback={<div className="h-16 w-full bg-[#05060b]" />}>
      <SubscriptionWarningBanner />
      <Navbar currentUser={currentUser} hasMatches={hasMatches} />
    </Suspense>
  );
}
