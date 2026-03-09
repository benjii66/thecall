import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/language";

jest.mock("@/lib/language", () => ({
  useLanguage: jest.fn(),
}));

// Use waitFor to wait for framer-motion animations
describe("LanguageSwitcher", () => {
    const mockSetLanguage = jest.fn();
    
    beforeEach(() => {
        jest.clearAllMocks();
        (useLanguage as jest.Mock).mockReturnValue({
            language: "fr",
            setLanguage: mockSetLanguage,
        });
    });

    it("should open menu on click and show language options", () => {
        render(<LanguageSwitcher />);
        
        // Find button
        const button = screen.getByRole("button");
        fireEvent.click(button);
        
        // Check if EN and FR are visible
        expect(screen.getByText("EN")).toBeInTheDocument();
        expect(screen.getByText("FR")).toBeInTheDocument();
    });

    it("should call setLanguage when a language is selected", () => {
        render(<LanguageSwitcher />);
        
        // Open
        fireEvent.click(screen.getByRole("button"));
        
        // Click EN
        fireEvent.click(screen.getByText("EN"));
        
        expect(mockSetLanguage).toHaveBeenCalledWith("en");
    });

    it("should close menu after selection", async () => {
        render(<LanguageSwitcher />);
        
        fireEvent.click(screen.getByRole("button"));
        expect(screen.queryByText("EN")).toBeInTheDocument();
        
        fireEvent.click(screen.getByText("FR"));
        
        // Menu should be gone, wait for animation
        await waitFor(() => {
            expect(screen.queryByText("EN")).not.toBeInTheDocument();
        });
    });
});
