import crypto from "crypto";

/**
 * Generate a secure random token (32+ bytes)
 * Returns the raw token that should be sent to the client
 */
export function generateToken(): string {
  const bytes = crypto.randomBytes(32);
  return bytes.toString("hex");
}

/**
 * Hash a token for storage in the database
 * Uses SHA-256 to prevent token enumeration
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Verify a token by comparing it with a stored hash
 */
export function verifyToken(token: string, hash: string): boolean {
  const computedHash = hashToken(token);
  return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(hash));
}

/**
 * Extract client IP from request
 */
export function getClientIp(req: any): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

/**
 * Extract user agent from request
 */
export function getUserAgent(req: any): string {
  return req.headers["user-agent"] || "unknown";
}

/**
 * Calculate token expiration (14 days from now)
 */
export function getTokenExpiration(): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);
  return expiresAt;
}
