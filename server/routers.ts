import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import z from "zod";
import {
  createDealSnapshot,
  createApprovalToken,
  createApprovalEvent,
  createWebhookConfig,
  getAllDeals,
  getDealById,
  getAuditTrail,
  getTokenByHash,
  markTokenAsUsed,
  updateDealStatus,
  getWebhookConfigs,
} from "./db";
import {
  generateToken,
  hashToken,
  getTokenExpiration,
  getClientIp,
  getUserAgent,
} from "./token";
import {
  sendApprovalLinkEmail,
  sendApprovalConfirmedEmail,
  sendApprovalRejectedEmail,
} from "./email";
import {
  createWebhookPayload,
  fireWebhook,
} from "./webhook";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  deals: router({
    create: protectedProcedure
      .input(z.object({
        clientName: z.string().min(1),
        clientEmail: z.string().email().optional(),
        currency: z.string().length(3).default("EUR"),
        total: z.number().int().positive(),
        items: z.array(z.object({
          description: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
        })),
        webhookUrl: z.string().url().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const dealResult = await createDealSnapshot({
          clientName: input.clientName,
          clientEmail: input.clientEmail,
          currency: input.currency,
          total: input.total,
          itemsJSON: JSON.stringify(input.items),
          status: "SENT",
        });

        const dealId = (dealResult as any).insertId?.toString() || "";

        const token = generateToken();
        const tokenHash = hashToken(token);
        const expiresAt = getTokenExpiration();

        await createApprovalToken({
          dealId,
          tokenHash,
          expiresAt,
        });

        await createApprovalEvent({
          dealId,
          type: "SENT",
          metaJSON: JSON.stringify({
            ip: getClientIp(ctx.req),
            userAgent: getUserAgent(ctx.req),
          }),
        });

        if (input.webhookUrl) {
          await createWebhookConfig({
            dealId,
            url: input.webhookUrl,
            events: "SENT,APPROVED,REJECTED",
          });
        }

        const approvalLink = `${process.env.VITE_FRONTEND_URL || "http://localhost:3000"}/approve/${token}`;
        if (input.clientEmail) {
          await sendApprovalLinkEmail(
            input.clientEmail,
            input.clientName,
            approvalLink,
            `${input.currency} ${(input.total / 100).toFixed(2)}`
          );
        }

        if (input.webhookUrl) {
          const dealData = await getDealById(dealId);
          if (dealData) {
            const payload = createWebhookPayload("SENT", dealData);
            await fireWebhook(input.webhookUrl, payload);
          }
        }

        return {
          dealId,
          approvalLink,
          token,
        };
      }),

    list: protectedProcedure.query(async () => {
      return await getAllDeals();
    }),

    getById: protectedProcedure
      .input(z.object({ dealId: z.string() }))
      .query(async ({ input }) => {
        const deal = await getDealById(input.dealId);
        if (!deal) throw new TRPCError({ code: "NOT_FOUND" });

        const auditTrail = await getAuditTrail(input.dealId);
        return { deal, auditTrail };
      }),
  }),

  approval: router({
    getDeal: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input, ctx }) => {
        const tokenRecord = await getTokenByHash(input.token);
        if (!tokenRecord) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid token" });

        if (tokenRecord.usedAt) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Token already used" });
        }

        if (new Date() > tokenRecord.expiresAt) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Token expired" });
        }

        const deal = await getDealById(tokenRecord.dealId);
        if (!deal) throw new TRPCError({ code: "NOT_FOUND" });

        await createApprovalEvent({
          dealId: deal.id,
          type: "VIEWED",
          metaJSON: JSON.stringify({
            ip: getClientIp(ctx.req),
            userAgent: getUserAgent(ctx.req),
          }),
        });

        return {
          token: input.token,
          deal: {
            id: deal.id,
            clientName: deal.clientName,
            currency: deal.currency,
            total: deal.total,
            items: JSON.parse(deal.itemsJSON),
            createdAt: deal.createdAt,
          },
        };
      }),

    confirm: publicProcedure
      .input(z.object({
        token: z.string(),
        approved: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        const tokenRecord = await getTokenByHash(input.token);
        if (!tokenRecord) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid token" });

        if (tokenRecord.usedAt) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Token already used" });
        }

        if (new Date() > tokenRecord.expiresAt) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Token expired" });
        }

        await markTokenAsUsed(tokenRecord.id);

        const newStatus = input.approved ? "APPROVED" : "REJECTED";
        await updateDealStatus(tokenRecord.dealId, newStatus);

        const deal = await getDealById(tokenRecord.dealId);
        if (!deal) throw new TRPCError({ code: "NOT_FOUND" });

        await createApprovalEvent({
          dealId: deal.id,
          type: input.approved ? "APPROVED" : "REJECTED",
          metaJSON: JSON.stringify({
            ip: getClientIp(ctx.req),
            userAgent: getUserAgent(ctx.req),
          }),
        });

        const ownerEmail = process.env.OWNER_EMAIL || "owner@example.com";
        if (input.approved) {
          await sendApprovalConfirmedEmail(
            ownerEmail,
            deal.clientName,
            `${deal.currency} ${(deal.total / 100).toFixed(2)}`,
            new Date().toISOString()
          );
        } else {
          await sendApprovalRejectedEmail(
            ownerEmail,
            deal.clientName,
            `${deal.currency} ${(deal.total / 100).toFixed(2)}`,
            new Date().toISOString()
          );
        }

        const webhooks = await getWebhookConfigs(deal.id);
        for (const webhook of webhooks) {
          const payload = createWebhookPayload(input.approved ? "APPROVED" : "REJECTED", deal);
          await fireWebhook(webhook.url, payload);
        }

        return { success: true, status: newStatus };
      }),
  }),
});

export type AppRouter = typeof appRouter;
