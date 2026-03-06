
import { NavbarWrapper } from "@/components/NavbarWrapper";
import { ProfilePageUI } from "@/components/ProfilePageUI";
import { BackgroundFX } from "@/components/BackgroundFX";
import { ThemeSetter } from "@/components/MatchThemeController";

import { cookies } from "next/headers";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const puuid = cookieStore.get("user_puuid")?.value;

  return (
    <main className="relative min-h-screen text-white">
      <ThemeSetter theme="profile" />
      <BackgroundFX />
      <NavbarWrapper />
      <ProfilePageUI puuid={puuid} />
    </main>
  );
}
