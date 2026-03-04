
import { NavbarWrapper } from "@/components/NavbarWrapper";
import { ProfilePageUI } from "@/components/ProfilePageUI";

import { cookies } from "next/headers";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const puuid = cookieStore.get("user_puuid")?.value;

  return (
    <main className="min-h-screen text-white">
      <NavbarWrapper />
      <ProfilePageUI puuid={puuid} />
    </main>
  );
}
