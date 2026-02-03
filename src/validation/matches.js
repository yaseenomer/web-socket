import { z } from "zod";

// ISO 8601 (basic) regex allowing timezone Z or offset
const iso8601Regex =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

// Optional limit query param: coerced positive integer, max 100
export const listMatchesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

// Match status constant (lowercase values)
export const MATCH_STATUS = {
  SCHEDULED: "scheduled",
  LIVE: "live",
  FINISHED: "finished",
};

// matchId param: required coerced positive integer
export const matchIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Reusable ISO date string validator
const isoString = z.string().refine((s) => iso8601Regex.test(s), {
  message: "Invalid ISO 8601 date string",
});

// createMatchSchema: sport, homeTeam, awayTeam (non-empty), startTime/endTime (ISO strings), optional scores
export const createMatchSchema = z
  .object({
    sport: z.string().min(1, "sport is required"),
    homeTeam: z.string().min(1, "homeTeam is required"),
    awayTeam: z.string().min(1, "awayTeam is required"),
    startTime: isoString,
    endTime: isoString,
    homeScore: z.coerce.number().int().min(0).optional(),
    awayScore: z.coerce.number().int().min(0).optional(),
  })
  .superRefine((data, ctx) => {
    const start = Date.parse(data.startTime);
    const end = Date.parse(data.endTime);

    if (Number.isNaN(start)) {
      ctx.addIssue({
        path: ["startTime"],
        code: z.ZodIssueCode.custom,
        message: "Invalid startTime",
      });
    }

    if (Number.isNaN(end)) {
      ctx.addIssue({
        path: ["endTime"],
        code: z.ZodIssueCode.custom,
        message: "Invalid endTime",
      });
    }

    if (!Number.isNaN(start) && !Number.isNaN(end) && end <= start) {
      ctx.addIssue({
        path: ["endTime"],
        code: z.ZodIssueCode.custom,
        message: "endTime must be after startTime",
      });
    }
  });

// updateScoreSchema: requires coerced non-negative integers
export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().int().min(0),
  awayScore: z.coerce.number().int().min(0),
});
