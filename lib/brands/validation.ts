import { z } from "zod";

export const brandInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  product_name: z.string().trim().min(1).max(120),
  target_market: z.string().trim().min(1).max(120),
});

export type BrandInput = z.infer<typeof brandInputSchema>;
