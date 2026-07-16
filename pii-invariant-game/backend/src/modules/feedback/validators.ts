import { z } from "zod";

export const submitFeedbackSchema = z.object({
    groupId: z.string().regex(/^Group(0[1-9]|10)$/).optional(),
    sessionId: z.string().optional(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(1000).optional()
});

export const listFeedbackQuerySchema = z.object({
    sessionId: z.string().optional(),
    groupId: z.string().regex(/^Group(0[1-9]|10)$/).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
});
