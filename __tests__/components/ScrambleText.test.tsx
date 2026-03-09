import { render, screen, fireEvent } from "@testing-library/react";
import { ScrambleText } from "@/components/ScrambleText";
import { gsap } from "gsap";

// Mock GSAP
jest.mock("gsap", () => ({
  gsap: {
    to: jest.fn(),
    registerPlugin: jest.fn(),
  },
}));

jest.mock("gsap/ScrambleTextPlugin", () => ({
  ScrambleTextPlugin: {},
}));

describe("ScrambleText", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the initial text", () => {
    render(<ScrambleText text="Hello World" />);
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("triggers scramble on hover", () => {
    render(<ScrambleText text="Hover Me" trigger="hover" />);
    const element = screen.getByText("Hover Me");
    
    fireEvent.mouseEnter(element);
    
    expect(gsap.to).toHaveBeenCalledWith(
      element,
      expect.objectContaining({
        scrambleText: expect.objectContaining({
          text: "Hover Me",
        }),
      })
    );
  });

  it("triggers scramble on mount when trigger is set to mount", () => {
    render(<ScrambleText text="Mount Me" trigger="mount" />);
    const element = screen.getByText("Mount Me");
    
    expect(gsap.to).toHaveBeenCalledWith(
      element,
      expect.objectContaining({
        scrambleText: expect.objectContaining({
          text: "Mount Me",
        }),
      })
    );
  });
});
