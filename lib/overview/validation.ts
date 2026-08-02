import type { MonthlyOutcomeState, OverviewViewModel } from "@/types/overview";

export function validateOverviewViewModel(viewModel: OverviewViewModel) {
  return (
    viewModel.kpis.length === 6 &&
    viewModel.header.projectSelector.every((project) => project.name.length > 0) &&
    viewModel.performanceChart.intervals.length === 3 &&
    viewModel.performanceChart.intervals.every((interval) => interval.series.length > 0) &&
    viewModel.attentionProducts.length <= 10 &&
    monthlyOutcomeHasSafeNegativeItems(viewModel.monthlyOutcome)
  );
}

export function monthlyOutcomeHasSafeNegativeItems(outcome: MonthlyOutcomeState) {
  return outcome.items.every((item) => {
    if (item.state !== "negative") {
      return true;
    }

    return Boolean(item.explanation || item.correctiveAction);
  });
}

export function weakOutcomeHasCorrectiveSections(outcome: MonthlyOutcomeState) {
  if (outcome.variant !== "weak") {
    return true;
  }

  return Boolean(outcome.focusAreas?.length && outcome.correctiveActions?.length);
}

export function labelIsMissingData(value: string) {
  return value === "nincs adat" || value === "n/a";
}
