import { logger } from "@/lib/logger";

// Mock console methods
const originalConsole = { ...console };
const mockConsole = {
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
  debug: jest.fn(),
};

beforeAll(() => {
  Object.assign(console, mockConsole);
});

afterAll(() => {
  Object.assign(console, originalConsole);
});

describe("Logger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("error", () => {
    it("should log error messages in development", () => {
      Object.defineProperty(process.env, "NODE_ENV", { value: "development", writable: true });
      logger.error("Test error", new Error("Test"));
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it("should format error with context", () => {
      Object.defineProperty(process.env, "NODE_ENV", { value: "development", writable: true });
      logger.error("Test error", undefined, { userId: "123" });
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining("Test error")
      );
    });
  });

  describe("warn", () => {
    it("should log warning messages", () => {
      Object.defineProperty(process.env, "NODE_ENV", { value: "development", writable: true });
      logger.warn("Test warning", { key: "value" });
      expect(mockConsole.warn).toHaveBeenCalled();
    });
  });

  describe("info", () => {
    it("should log info messages in development", () => {
      Object.defineProperty(process.env, "NODE_ENV", { value: "development", writable: true });
      logger.info("Test info");
      expect(mockConsole.log).toHaveBeenCalled();
    });
  });

  describe("debug", () => {
    it("should log debug messages in development", () => {
      Object.defineProperty(process.env, "NODE_ENV", { value: "development", writable: true });
      logger.debug("Test debug");
      expect(mockConsole.debug).toHaveBeenCalled();
    });
  });
});
