
import { NavbarWrapper } from "@/components/NavbarWrapper";
import { BackgroundFX } from "@/components/BackgroundFX";
import { PrivacyPageUI } from "@/components/PrivacyPageUI";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#05060b] text-white">
      <NavbarWrapper />
      <BackgroundFX />
      <PrivacyPageUI />
    </main>
  );
}
