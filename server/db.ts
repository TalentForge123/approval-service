import { eq, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, dealSnapshots, DealSnapshot, InsertDealSnapshot, approvalTokens, InsertApprovalToken, approvalEvents, InsertApprovalEvent, webhookConfigs, InsertWebhookConfig } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Deal management queries
export async function createDealSnapshot(deal: InsertDealSnapshot) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(dealSnapshots).values(deal);
  return result;
}

export async function getDealById(dealId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(dealSnapshots).where(eq(dealSnapshots.id, dealId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllDeals() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(dealSnapshots).orderBy(desc(dealSnapshots.createdAt));
}

export async function updateDealStatus(dealId: string, status: DealSnapshot["status"]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(dealSnapshots).set({ status }).where(eq(dealSnapshots.id, dealId));
}

// Token management queries
export async function createApprovalToken(token: InsertApprovalToken) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(approvalTokens).values(token);
}

export async function getTokenByHash(tokenHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(approvalTokens).where(eq(approvalTokens.tokenHash, tokenHash)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function markTokenAsUsed(tokenId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(approvalTokens).set({ usedAt: new Date() }).where(eq(approvalTokens.id, tokenId));
}

// Event logging queries
export async function createApprovalEvent(event: InsertApprovalEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(approvalEvents).values(event);
}

export async function getAuditTrail(dealId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(approvalEvents).where(eq(approvalEvents.dealId, dealId)).orderBy(asc(approvalEvents.createdAt));
}

// Webhook configuration queries
export async function createWebhookConfig(config: InsertWebhookConfig) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(webhookConfigs).values(config);
}

export async function getWebhookConfigs(dealId?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (dealId) {
    return await db.select().from(webhookConfigs).where(eq(webhookConfigs.dealId, dealId));
  }
  return await db.select().from(webhookConfigs).where(eq(webhookConfigs.isActive, 1));
}

// TODO: add feature queries here as your schema grows.
