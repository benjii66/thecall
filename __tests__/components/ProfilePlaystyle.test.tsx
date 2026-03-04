/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { ProfilePlaystyle } from "@/components/ProfilePlaystyle";
import type { PlayerProfile } from "@/types/profile";

describe("ProfilePlaystyle", () => {
  it("renders playstyle indicators correctly", () => {
    const playstyle: PlayerProfile["playstyle"] = {
      aggression: "high",
      objectiveFocus: "medium",
      teamFightPresence: "low",
      description: "Style très agressif (beaucoup de risques pris). objectifs souvent négligés. peu présent lors des engagements.",
    };

    render(<ProfilePlaystyle playstyle={playstyle} />);

    expect(screen.getByText("Agression")).toBeInTheDocument();
    expect(screen.getByText("Focus objectifs")).toBeInTheDocument();
    expect(screen.getByText("Présence team fights")).toBeInTheDocument();
    expect(screen.getByText("Élevé")).toBeInTheDocument();
    expect(screen.getByText("Moyen")).toBeInTheDocument();
    expect(screen.getByText("Faible")).toBeInTheDocument();
  });

  it("displays correct description", () => {
    const playstyle: PlayerProfile["playstyle"] = {
      aggression: "low",
      objectiveFocus: "high",
      teamFightPresence: "high",
      description: "Style safe et défensif. excellent focus sur les objectifs. très présent en team fights.",
    };

    render(<ProfilePlaystyle playstyle={playstyle} />);

    expect(screen.getByText(/Style safe et défensif/)).toBeInTheDocument();
  });
});
