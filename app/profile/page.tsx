
import { NavbarWrapper } from "@/components/NavbarWrapper";
import { BackgroundFX } from "@/components/BackgroundFX";
import { ProfilePageUI } from "@/components/ProfilePageUI";

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-[#05060b] text-white">
      <NavbarWrapper />
      <BackgroundFX />
      <ProfilePageUI />
    </main>
  );
}
