
import { NavbarWrapper } from "@/components/NavbarWrapper";
import { NexusBackground } from "@/components/NexusBackground";
import { PublicSettingsUI } from "@/components/PublicSettingsUI";

export default function SettingsPage() {
  return (
    <main className="min-h-screen text-white overflow-x-hidden">
      <NavbarWrapper />
      <NexusBackground />
      <PublicSettingsUI />
    </main>
  );
}
