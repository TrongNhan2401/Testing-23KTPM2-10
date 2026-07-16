import { z } from "zod";

export const loginBodySchema = z.object({
    username: z.string().min(3).max(31),
    password: z.string().min(1)
});
