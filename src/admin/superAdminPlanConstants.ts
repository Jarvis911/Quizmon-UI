export const PLAN_FEATURE_LABELS: Record<string, string> = {
  AI_GENERATION: "AI question generation",
  AI_IMAGE_GENERATION: "AI illustration images",
  UNLIMITED_MATCHES: "Match sessions (limited or unlimited)",
  ADVANCED_ANALYTICS: "Advanced analytics",
  UNLIMITED_CLASSROOMS: "Classrooms (legacy unlimited flag)",
  MAX_CLASSROOMS: "Max classrooms",
  MAX_STUDENTS_PER_CLASSROOM: "Max students per classroom",
  MAX_PLAYERS_PER_MATCH: "Max players per match",
  CUSTOM_BRANDING: "Custom branding",
  PRIORITY_SUPPORT: "Priority support",
};

export type PlanFeatureRow = {
  featureKey: string;
  enabled: boolean;
  limit: number | null;
};

export type FeatureDraftRow = { featureKey: string; enabled: boolean; limitStr: string };

export function buildFeatureDrafts(
  features: PlanFeatureRow[] | undefined,
  keys: string[]
): FeatureDraftRow[] {
  const map = Object.fromEntries((features ?? []).map((f) => [f.featureKey, f]));
  return keys.map((k) => {
    const f = map[k];
    return {
      featureKey: k,
      enabled: f?.enabled ?? false,
      limitStr: f?.limit == null ? "" : String(f.limit),
    };
  });
}
