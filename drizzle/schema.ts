import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const dealSnapshots = mysqlTable("deal_snapshots", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  clientEmail: varchar("client_email", { length: 320 }),
  currency: varchar("currency", { length: 3 }).notNull().default("EUR"),
  total: int("total").notNull(), // stored in cents
  itemsJSON: text("items_json").notNull(), // JSON array of items
  status: mysqlEnum("status", ["DRAFT", "SENT", "APPROVED", "REJECTED", "EXPIRED"]).default("DRAFT").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type DealSnapshot = typeof dealSnapshots.$inferSelect;
export type InsertDealSnapshot = typeof dealSnapshots.$inferInsert;

export const approvalTokens = mysqlTable("approval_tokens", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  dealId: varchar("deal_id", { length: 36 }).notNull(),
  tokenHash: varchar("token_hash", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ApprovalToken = typeof approvalTokens.$inferSelect;
export type InsertApprovalToken = typeof approvalTokens.$inferInsert;

export const approvalEvents = mysqlTable("approval_events", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  dealId: varchar("deal_id", { length: 36 }).notNull(),
  type: mysqlEnum("type", ["SENT", "VIEWED", "APPROVED", "REJECTED"]).notNull(),
  metaJSON: text("meta_json"), // JSON with ip, userAgent, etc
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ApprovalEvent = typeof approvalEvents.$inferSelect;
export type InsertApprovalEvent = typeof approvalEvents.$inferInsert;

export const webhookConfigs = mysqlTable("webhook_configs", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  dealId: varchar("deal_id", { length: 36 }),
  url: varchar("url", { length: 2048 }).notNull(),
  events: varchar("events", { length: 255 }).notNull(), // comma-separated: SENT,APPROVED,REJECTED
  isActive: int("is_active").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type WebhookConfig = typeof webhookConfigs.$inferSelect;
export type InsertWebhookConfig = typeof webhookConfigs.$inferInsert;

// TODO: Add your tables here