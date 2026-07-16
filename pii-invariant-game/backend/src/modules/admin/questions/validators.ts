import { z } from "zod";

export const createPiiQuestionSchema = z.object({
    externalId: z.string().regex(/^#\d{3,}$/, "externalId must be in format #NNN"),
    fullName: z.string().max(200).optional(),
    email: z.string().max(200).optional(),
    phone: z.string().max(200).optional(),
    address: z.string().max(200).optional(),
    notes: z.string().max(200).optional(),
    shipping: z.string().max(200).optional(),
    correctNotes: z.boolean(),
    correctShipping: z.boolean(),
    isActive: z.boolean().default(true)
});

export const updatePiiQuestionSchema = z.object({
    fullName: z.string().max(200).nullish(),
    email: z.string().max(200).nullish(),
    phone: z.string().max(200).nullish(),
    address: z.string().max(200).nullish(),
    notes: z.string().max(200).nullish(),
    shipping: z.string().max(200).nullish(),
    correctNotes: z.boolean().optional(),
    correctShipping: z.boolean().optional(),
    isActive: z.boolean().optional()
});

export const piiExternalIdParamSchema = z.string().min(1, "externalId is required");

export const createInvariantQuestionSchema = z.object({
    externalId: z.string().regex(/^#INV-\d{2,}$/, "externalId must be in format #INV-NN"),
    items: z.number().positive(),
    tax: z.number().nonnegative(),
    shipping: z.number().nonnegative(),
    totalPrice: z.number().nonnegative(),
    isViolation: z.boolean(),
    isActive: z.boolean().default(true)
});

export const updateInvariantQuestionSchema = z.object({
    items: z.number().positive().optional(),
    tax: z.number().nonnegative().optional(),
    shipping: z.number().nonnegative().optional(),
    totalPrice: z.number().nonnegative().optional(),
    isViolation: z.boolean().optional(),
    isActive: z.boolean().optional()
});

export const invariantExternalIdParamSchema = z.string().min(1, "externalId is required");
