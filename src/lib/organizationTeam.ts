/** Matches backend PlanType — School / Enterprise unlock collaboration APIs and UI. */
export function planSupportsTeamCollaboration(planType: string | null | undefined): boolean {
  return planType === "SCHOOL" || planType === "ENTERPRISE";
}
