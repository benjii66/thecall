"use client";

import { TabContent } from "./TabContent";

export function TabContentWrapper({
  activeTab,
  children,
}: {
  activeTab: string;
  children: React.ReactNode;
}) {
  return <TabContent activeTab={activeTab}>{children}</TabContent>;
}
