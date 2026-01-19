import { NavbarWrapper } from "@/components/NavbarWrapper";
import { LandingPageUI } from "@/components/LandingPageUI";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#05060b] text-white">
      <NavbarWrapper />
      <LandingPageUI />
    </main>
  );
}
