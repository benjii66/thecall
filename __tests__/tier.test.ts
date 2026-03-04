/**
 * @jest-environment node
 */
import { getUserTier } from "@/lib/tier";

describe("getUserTier", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules(); // Clears cache to re-evaluate env vars
    process.env = { ...originalEnv };
    // Mocks safe localStorage
    if (typeof window === 'undefined') {
       // Node env, no window
    } else {
       localStorage.clear();
    }
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  // Since we run in "node" environment in Jest, window is not defined by default unless we use jsdom.
  // We configured jsdom? No, "testEnvironment": "node" in jest.config.js.
  // So window is undefined.
  // `getUserTier` checks `typeof window !== "undefined"`.
  // To test client logic, we might need to mock window or change test environment.
  // But wait, `getUserTier` uses `typeof window`.
  
  it("should return free by default on server", () => {
    process.env.DEV_TIER = undefined;
    process.env.NEXT_PUBLIC_DEV_TIER = undefined;
    expect(getUserTier()).toBe("free");
  });

  it("should respect DEV_TIER on server", () => {
    process.env.DEV_TIER = "pro";
    expect(getUserTier()).toBe("pro");
  });

  // To test client side logic in a Node environment, we can't easily mock window existence safely without breaking things.
  // However, `lib/tier.ts` has specific logic for server vs client.
  // The critical bug was client-side priority.
  // Should we switch testEnvironment to jsdom for this file? 
  // Jest allows file-specific directives.
});
