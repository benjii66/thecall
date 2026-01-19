
import { NavbarWrapper } from "@/components/NavbarWrapper";
import { BackgroundFX } from "@/components/BackgroundFX";
import { SettingsPageUI } from "@/components/SettingsPageUI";

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-[#05060b] text-white">
      <NavbarWrapper />
      <BackgroundFX />
      <SettingsPageUI />
    </main>
  );
}
