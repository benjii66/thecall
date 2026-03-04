
import { riotFetch } from "@/lib/riot";

// Mock fetch global
const mockFetch = jest.fn() as jest.Mock;
global.fetch = mockFetch;

describe("riotFetch", () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv, RIOT_API_KEY: "RGAPI-TEST" };
        mockFetch.mockClear();
        jest.useFakeTimers();
    });

    afterAll(() => {
        process.env = originalEnv;
        jest.useRealTimers();
    });

    it("should successfuly return data on 200", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ result: "ok" }),
        });

        const data = await riotFetch<{ result: string }>("test/endpoint");
        expect(data).toEqual({ result: "ok" });
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining("europe.api.riotgames.com/test/endpoint"),
            expect.objectContaining({    
                headers: { "X-Riot-Token": "RGAPI-TEST" } 
            })
        );
    });

    it("should throw error if API key is missing", async () => {
        delete process.env.RIOT_API_KEY;
        await expect(riotFetch("test")).rejects.toThrow("RIOT_API_KEY missing");
    });

    it("should retry on 429 (Rate Limit)", async () => {
        // First call: 429
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 429,
            headers: new Headers({ "Retry-After": "1" }), // 1 second
            text: async () => "Rate limit",
        });

        // Second call: 200 OK
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
        });

        const promise = riotFetch("test");
        
        // Fast-forward time to bypass the 1s wait + jitter
        await jest.advanceTimersByTimeAsync(2000);

        const result = await promise;
        expect(result).toEqual({ success: true });
        expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should retry on 500 (Server Error)", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            headers: new Headers(),
            text: async () => "Server Error",
        });
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
        });

        const promise = riotFetch("test");
        await jest.advanceTimersByTimeAsync(2000);

        await promise;
        expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it.skip("should fail after max retries", async () => {
        // 3 failures
        mockFetch.mockResolvedValue({
            ok: false,
            status: 500,
            headers: new Headers(),
            text: async () => "Server Error",
        });

        const promise = riotFetch("test");
        
        // Advance time enough for 3 attempts (1s + 2s + 4s...)
        await jest.advanceTimersByTimeAsync(10000);

        await expect(promise).rejects.toThrow("Riot error 500");
        expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("should handle 404 without retry", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 404,
            headers: new Headers(),
            text: async () => "Not Found",
        });

        await expect(riotFetch("test")).rejects.toThrow("Ressource Riot introuvable");
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });
});
