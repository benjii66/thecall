
import { cn } from "@/lib/utils";

describe("cn (className utility)", () => {
    it("should merge strings", () => {
        expect(cn("a", "b")).toBe("a b");
    });

    it("should ignore falsy values", () => {
        expect(cn("a", null, "b", undefined, false, "c")).toBe("a b c");
    });

    it("should handle empty calls", () => {
        expect(cn()).toBe("");
    });



    it("should handle mixed types if supported (currently only strings/null/false)", () => {
        // Implementation: input && typeof input === "string"
        // So numbers/objects are ignored.
        expect(cn("a", 123 as any, { foo: "bar" } as any)).toBe("a");
    });
});
