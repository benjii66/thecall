
/**
 * @jest-environment jsdom
 */

import { getUserTier } from "@/lib/tier";

describe("getUserTier (Client)", () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
        localStorage.clear();
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it("should return free by default on client", () => {
        process.env.NEXT_PUBLIC_DEV_TIER = undefined;
        expect(getUserTier()).toBe("free");
    });

    it("should prioritize NEXT_PUBLIC_DEV_TIER over localStorage", () => {
        process.env.NEXT_PUBLIC_DEV_TIER = "pro";
        localStorage.setItem("dev_tier", "free");
        expect(getUserTier()).toBe("pro");
    });

    it("should fallback to localStorage if no ENV defined", () => {
        delete process.env.NEXT_PUBLIC_DEV_TIER; // Ensure undefined
        localStorage.setItem("dev_tier", "pro");
        expect(getUserTier()).toBe("pro");
    });

    it("should default to free if neither present", () => {
        delete process.env.NEXT_PUBLIC_DEV_TIER;
        localStorage.removeItem("dev_tier");
        expect(getUserTier()).toBe("free");
    });
});
