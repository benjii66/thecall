/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { WinProbabilityChart } from "@/components/WinProbabilityChart";
import type { WinProbPoint } from "@/lib/winProbability";

describe("WinProbabilityChart", () => {
  it("should render with data", () => {
    const data: WinProbPoint[] = [
      { minute: 0, score: 0, probability: 50 },
      { minute: 10, score: 5, probability: 65 },
      { minute: 20, score: 10, probability: 75 },
    ];

    render(<WinProbabilityChart data={data} />);
    expect(screen.getByText(/Win Probability/i)).toBeInTheDocument();
  });

  it("should not render with empty data", () => {
    const { container } = render(<WinProbabilityChart data={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("should display final probability", () => {
    const data: WinProbPoint[] = [
      { minute: 0, score: 0, probability: 50 },
      { minute: 20, score: 10, probability: 75 },
    ];

    render(<WinProbabilityChart data={data} />);
    expect(screen.getByText(/75%/)).toBeInTheDocument();
  });
});
