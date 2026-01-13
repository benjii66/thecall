"use client";

import { MatchDetailTransition } from "./MatchDetailTransition";
import { ReactNode } from "react";

// Wrapper client component pour utiliser dans server component
export function MatchDetailTransitionWrapper({
  children,
  matchId,
}: {
  children: ReactNode;
  matchId: string;
}) {
  return (
    <MatchDetailTransition matchId={matchId}>{children}</MatchDetailTransition>
  );
}
