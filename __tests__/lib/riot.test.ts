import { riotFetch } from "@/lib/riot";
import * as settings from "@/lib/settings";

jest.mock("@/lib/settings", () => ({
    getRiotApiKey: jest.fn(),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("riotFetch", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        (settings.getRiotApiKey as jest.Mock).mockResolvedValue("RGAPI-TEST");
        jest.spyOn(Math, 'random').mockReturnValue(0);
    });

    afterAll(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
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
        (settings.getRiotApiKey as jest.Mock).mockResolvedValue(undefined);
        await expect(riotFetch("test")).rejects.toThrow("RIOT_API_KEY missing");
    });

    it("should retry on 429 (Rate Limit)", async () => {
        mockFetch
            .mockResolvedValueOnce({
                ok: false,
                status: 429,
                headers: new Headers({ "Retry-After": "1" }),
                text: async () => "Rate limit",
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true }),
            });

        const promise = riotFetch("test");
        await jest.advanceTimersByTimeAsync(2000);
        const result = await promise;
        
        expect(result).toEqual({ success: true });
        expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should retry on 500 (Server Error)", async () => {
        mockFetch
            .mockResolvedValueOnce({
                ok: false,
                status: 500,
                headers: new Headers(),
                text: async () => "Server Error",
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true }),
            });

        const promise = riotFetch("test");
        await jest.advanceTimersByTimeAsync(2000);
        await promise;
        
        expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should fail after max retries", async () => {
        mockFetch.mockResolvedValue({
            ok: false,
            status: 500,
            headers: new Headers(),
            text: async () => "Server Error",
        });

        const promise = riotFetch("test");
        
        // Need to advance timers for each retry separately to let promises resolve
        await jest.advanceTimersByTimeAsync(2000); // 1st retry wait
        await jest.advanceTimersByTimeAsync(3000); // 2nd retry wait
        await jest.advanceTimersByTimeAsync(5000); // 3rd retry wait

        await expect(promise).rejects.toThrow(/Riot error 500/);
        expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("should handle 404 without retry", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 404,
            headers: new Headers(),
            text: async () => "Not Found",
        });

        await expect(riotFetch("test")).rejects.toThrow(/Ressource Riot introuvable/);
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });
});
