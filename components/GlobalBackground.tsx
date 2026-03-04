"use client";

import { useThemeStore } from "@/lib/store/themeStore";
import { NexusBackground } from "./NexusBackground";

export function GlobalBackground() {
  const { theme } = useThemeStore();

  return <NexusBackground theme={theme} />;
}
