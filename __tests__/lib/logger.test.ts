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
      process.env.NODE_ENV = "development";
      logger.error("Test error", new Error("Test"));
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it("should format error with context", () => {
      process.env.NODE_ENV = "development";
      logger.error("Test error", undefined, { userId: "123" });
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining("Test error")
      );
    });
  });

  describe("warn", () => {
    it("should log warning messages", () => {
      process.env.NODE_ENV = "development";
      logger.warn("Test warning", { key: "value" });
      expect(mockConsole.warn).toHaveBeenCalled();
    });
  });

  describe("info", () => {
    it("should log info messages in development", () => {
      process.env.NODE_ENV = "development";
      logger.info("Test info");
      expect(mockConsole.log).toHaveBeenCalled();
    });
  });

  describe("debug", () => {
    it("should log debug messages in development", () => {
      process.env.NODE_ENV = "development";
      logger.debug("Test debug");
      expect(mockConsole.debug).toHaveBeenCalled();
    });
  });
});
