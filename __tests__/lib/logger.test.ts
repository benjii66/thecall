import { logger } from "@/lib/logger";

describe("Logger", () => {
  let consoleSpy: Record<string, jest.SpyInstance>;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = {
      error: jest.spyOn(console, 'error').mockImplementation(() => {}),
      warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
      log: jest.spyOn(console, 'log').mockImplementation(() => {}),
      debug: jest.spyOn(console, 'debug').mockImplementation(() => {}),
    };
    // Ensure test environment
    Object.defineProperty(process.env, "NODE_ENV", { value: "test", writable: true });
    Object.defineProperty(process.env, "VERBOSE_LOGS", { value: "false", writable: true });
  });

  afterEach(() => {
    Object.values(consoleSpy).forEach(spy => spy.mockRestore());
  });

  describe("error", () => {
    it("should log error messages", () => {
      logger.error("Test error", new Error("Test"));
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it("should format error with context", () => {
      logger.error("Test error", undefined, { userId: "123" });
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining("Test error")
      );
    });
  });

  describe("warn", () => {
    it("should log warning messages", () => {
      logger.warn("Test warning", { key: "value" });
      expect(consoleSpy.warn).toHaveBeenCalled();
    });
  });

  describe("info", () => {
    it("should NOT log info messages when VERBOSE_LOGS is false", () => {
      process.env.VERBOSE_LOGS = "false";
      logger.info("Test info");
      expect(consoleSpy.log).not.toHaveBeenCalled();
    });

    it("should log info messages when VERBOSE_LOGS is true", () => {
      process.env.VERBOSE_LOGS = "true";
      logger.info("Test info");
      expect(consoleSpy.log).toHaveBeenCalled();
    });
  });

  describe("debug", () => {
    it("should NOT log debug messages when VERBOSE_LOGS is false", () => {
      process.env.VERBOSE_LOGS = "false";
      logger.debug("Test debug");
      expect(consoleSpy.debug).not.toHaveBeenCalled();
    });

    it("should log debug messages when VERBOSE_LOGS is true", () => {
      process.env.VERBOSE_LOGS = "true";
      logger.debug("Test debug");
      expect(consoleSpy.debug).toHaveBeenCalled();
    });
  });
});
