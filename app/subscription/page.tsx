
import { NavbarWrapper } from "@/components/NavbarWrapper";
import { BackgroundFX } from "@/components/BackgroundFX";
import { SubscriptionPageUI } from "@/components/SubscriptionPageUI";

export default function SubscriptionPage() {
  return (
    <main className="min-h-screen bg-[#05060b] text-white">
      <NavbarWrapper />
      <BackgroundFX />
      <SubscriptionPageUI />
    </main>
  );
}
