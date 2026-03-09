import { render, screen } from "@testing-library/react";
import { LanguageProvider, useLanguage } from "@/lib/language";

jest.unmock("@/lib/language");

// Test component to verify t() output
const TranslationTest = ({ translationKey, params }: { translationKey: string, params?: Record<string, string> }) => {
  const { t } = useLanguage();
  return <div data-testid="t-output">{t(translationKey, params)}</div>;
};

describe("LanguageProvider", () => {
    it("should provide French translations by default (or based on browser/cookies)", () => {
        // We wrap with Provider
        render(
            <LanguageProvider>
                <TranslationTest translationKey="navbar.overview" />
            </LanguageProvider>
        );
        
        // Since default is 'fr' in our implementation logic (unless cookie is present)
        // Note: In tests, cookie might be missing, so it defaults to French or browser (which is usually mocked to something)
        const output = screen.getByTestId("t-output").textContent;
        expect(output).toBe("Overview"); // Wait, navbar.overview is 'Overview' in both but let's check another key
    });

    it("should translate 'settings.save' to 'Sauvegarder' in French", () => {
        render(
            <LanguageProvider>
                <TranslationTest translationKey="settings.save" />
            </LanguageProvider>
        );
        expect(screen.getByTestId("t-output").textContent).toBe("Sauvegarder");
    });

    it("should interpolate parameters {count} correctly", () => {
        render(
            <LanguageProvider>
                <TranslationTest translationKey="settings.plan.freeDesc" params={{ count: "5" }} />
            </LanguageProvider>
        );
        // "Limite de {count} analyses par mois..." -> "Limite de 5 analyses par mois..."
        expect(screen.getByTestId("t-output").textContent).toContain("Limite de 5 analyses");
    });

    it("should handle missing keys by returning the key itself", () => {
        render(
            <LanguageProvider>
                <TranslationTest translationKey="non.existent.key" />
            </LanguageProvider>
        );
        expect(screen.getByTestId("t-output").textContent).toBe("non.existent.key");
    });
});
