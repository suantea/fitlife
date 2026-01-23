import type { CarbCyclePlan } from "./types";
import { getTodayString } from "./storage";

function toUtcDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(Date.UTC(year, (month || 1) - 1, day || 1));
}

function diffInDays(start: string, end: string): number {
  const startDate = toUtcDate(start);
  const endDate = toUtcDate(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function getCarbCycleDay(plan: CarbCyclePlan, date: string = getTodayString()) {
  const startDate = plan.startDate || getTodayString();
  const cycleLength = Math.max(1, plan.cycleLength);
  const daysSince = diffInDays(startDate, date);
  const dayIndex = ((daysSince % cycleLength) + cycleLength) % cycleLength;
  const day = plan.days.find((d) => d.dayIndex === dayIndex + 1) || plan.days[dayIndex];

  return {
    dayIndex,
    day,
  };
}
