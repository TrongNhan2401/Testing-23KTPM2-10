import { z } from "zod";
import type { AnswerBoard, AnswerField } from "../shared/database/schemas";

export const groupIdParamSchema = z.string().regex(
    /^Group(0[1-9]|10)$/,
    "groupId must match Group01..Group10"
);

export const answerBoardSchema = z.enum(["PII", "INVARIANT"]) as unknown as z.ZodType<AnswerBoard>;
export const answerFieldSchema = z.enum(["NOTES", "SHIPPING"]) as unknown as z.ZodType<AnswerField>;

/** Body for POST /game/:groupId/answer */
export const submitAnswerBodySchema = z.object({
    answers: z
        .array(
            z.object({
                board: answerBoardSchema,
                targetId: z.string().min(1),
                field: answerFieldSchema,
                guess: z.boolean().optional()
            })
        )
        .min(0)
        .max(200)
});

/** Body for POST /game/:groupId/submit */
export const submitGameBodySchema = z.object({
    clientSubmittedAt: z.string().datetime().optional()
});
