import { z } from "zod";

export const searchQuerySchema = z
  .object({
    q: z.string().trim().min(1),
    count: z.coerce.number().int().min(1).max(50).default(20),
    cursor: z.coerce.number().int().min(0).default(0),
  })
  .strict();

