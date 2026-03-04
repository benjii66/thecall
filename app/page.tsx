import { NavbarWrapper } from "@/components/NavbarWrapper";
import { LandingPageUI } from "@/components/LandingPageUI";
import { NexusBackground } from "@/components/NexusBackground";

export default function LandingPage() {
  return (
    <main className="min-h-screen text-white">
      <NexusBackground />
      <NavbarWrapper />
      <LandingPageUI />
    </main>
  );
}
