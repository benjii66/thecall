/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { ProfileInsightCard } from "@/components/ProfileInsightCard";
import type { PlayerProfile } from "@/types/profile";

describe("ProfileInsightCard", () => {
  it("renders strength insight correctly", () => {
    const insight: PlayerProfile["insights"][number] = {
      type: "strength",
      title: "Excellent win rate",
      description: "Ton win rate global est excellent.",
      priority: "low",
      data: [{ label: "Win rate", value: "65%" }],
    };

    render(<ProfileInsightCard insight={insight} />);

    expect(screen.getByText("Point fort")).toBeInTheDocument();
    expect(screen.getByText("Excellent win rate")).toBeInTheDocument();
    expect(screen.getByText("Ton win rate global est excellent.")).toBeInTheDocument();
  });

  it("renders weakness insight correctly", () => {
    const insight: PlayerProfile["insights"][number] = {
      type: "weakness",
      title: "Win rate à améliorer",
      description: "Ton win rate est faible.",
      priority: "high",
    };

    render(<ProfileInsightCard insight={insight} />);

    expect(screen.getByText("À améliorer")).toBeInTheDocument();
    expect(screen.getByText("Win rate à améliorer")).toBeInTheDocument();
    expect(screen.getByText("Priorité")).toBeInTheDocument();
  });

  it("renders recommendation insight correctly", () => {
    const insight: PlayerProfile["insights"][number] = {
      type: "recommendation",
      title: "Ajuste ton agressivité",
      description: "Tu joues trop agressif.",
      priority: "medium",
    };

    render(<ProfileInsightCard insight={insight} />);

    expect(screen.getByText("Recommandation")).toBeInTheDocument();
    expect(screen.getByText("Ajuste ton agressivité")).toBeInTheDocument();
  });
});
