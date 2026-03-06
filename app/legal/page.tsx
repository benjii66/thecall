
import { NavbarWrapper } from "@/components/NavbarWrapper";
import { BackgroundFX } from "@/components/BackgroundFX";
import { LegalPageUI } from "@/components/LegalPageUI";

export default function LegalPage() {
  return (
    <main className="min-h-screen bg-[#05060b] text-white">
      <NavbarWrapper />
      <BackgroundFX />
      <LegalPageUI />
    </main>
  );
}
