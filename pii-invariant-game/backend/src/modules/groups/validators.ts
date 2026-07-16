import { z } from "zod";

export const groupIdParamSchema = z
    .string()
    .regex(
        /^Group(0[1-9]|10)$/,
        "groupId must match Group01..Group10"
    );

export const groupIdBodySchema = z.object({
    groupId: groupIdParamSchema
});

export const selectGroupBodySchema = groupIdBodySchema;

export const releaseGroupBodySchema = groupIdBodySchema;

export const startGameBodySchema = groupIdBodySchema;

export const selectionTokenBodySchema = z.object({
    groupId: groupIdParamSchema,
    selectionToken: z.string().min(8).max(200)
});
