import { superAdminHttpJson } from "@/admin/superAdminHttp";

export type AiConfigOptions = { features: string[]; models: string[] };

let cached: AiConfigOptions | null = null;

export async function fetchAiConfigOptions(): Promise<AiConfigOptions> {
  if (cached) return cached;
  cached = await superAdminHttpJson<AiConfigOptions>("/admin/ai-config-options");
  return cached;
}

export function featureLabel(featureName: string): string {
  return featureName.replace(/_/g, " ");
}
