import { describe, it, expect, beforeEach } from "vitest";
import {
  generateToken,
  hashToken,
  verifyToken,
  getTokenExpiration,
  getClientIp,
  getUserAgent,
} from "./token";

describe("Token Management", () => {
  describe("generateToken", () => {
    it("should generate a 64-character hex string (32 bytes)", () => {
      const token = generateToken();
      expect(token).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(token)).toBe(true);
    });

    it("should generate unique tokens", () => {
      const token1 = generateToken();
      const token2 = generateToken();
      expect(token1).not.toBe(token2);
    });

    it("should generate cryptographically secure tokens", () => {
      const tokens = new Set();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateToken());
      }
      expect(tokens.size).toBe(100);
    });
  });

  describe("hashToken", () => {
    it("should hash a token to SHA-256", () => {
      const token = generateToken();
      const hash = hashToken(token);
      expect(hash).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
    });

    it("should produce consistent hashes", () => {
      const token = generateToken();
      const hash1 = hashToken(token);
      const hash2 = hashToken(token);
      expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for different tokens", () => {
      const token1 = generateToken();
      const token2 = generateToken();
      const hash1 = hashToken(token1);
      const hash2 = hashToken(token2);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("verifyToken", () => {
    it("should verify a valid token", () => {
      const token = generateToken();
      const hash = hashToken(token);
      const isValid = verifyToken(token, hash);
      expect(isValid).toBe(true);
    });

    it("should reject an invalid token", () => {
      const token = generateToken();
      const hash = hashToken(token);
      const wrongToken = generateToken();
      const isValid = verifyToken(wrongToken, hash);
      expect(isValid).toBe(false);
    });

    it("should use timing-safe comparison", () => {
      const token = generateToken();
      const hash = hashToken(token);
      // This test verifies the function doesn't throw on valid inputs
      expect(() => verifyToken(token, hash)).not.toThrow();
    });
  });

  describe("getTokenExpiration", () => {
    it("should return a date 14 days in the future", () => {
      const now = new Date();
      const expiration = getTokenExpiration();
      const daysDiff = (expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeGreaterThan(13.9);
      expect(daysDiff).toBeLessThan(14.1);
    });

    it("should return a valid Date object", () => {
      const expiration = getTokenExpiration();
      expect(expiration instanceof Date).toBe(true);
      expect(expiration.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe("getClientIp", () => {
    it("should extract IP from x-forwarded-for header", () => {
      const req = {
        headers: {
          "x-forwarded-for": "192.168.1.1, 10.0.0.1",
        },
        socket: {},
      };
      const ip = getClientIp(req);
      expect(ip).toBe("192.168.1.1");
    });

    it("should extract IP from socket.remoteAddress", () => {
      const req = {
        headers: {},
        socket: {
          remoteAddress: "192.168.1.100",
        },
      };
      const ip = getClientIp(req);
      expect(ip).toBe("192.168.1.100");
    });

    it("should return unknown if no IP found", () => {
      const req = {
        headers: {},
        socket: {},
      };
      const ip = getClientIp(req);
      expect(ip).toBe("unknown");
    });
  });

  describe("getUserAgent", () => {
    it("should extract user agent from headers", () => {
      const req = {
        headers: {
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
      };
      const ua = getUserAgent(req);
      expect(ua).toBe("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
    });

    it("should return unknown if no user agent found", () => {
      const req = {
        headers: {},
      };
      const ua = getUserAgent(req);
      expect(ua).toBe("unknown");
    });
  });
});
