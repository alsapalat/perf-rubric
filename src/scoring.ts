import {
  Answer,
  CategoryScore,
  PRIORITY_WEIGHTS,
  KPI_CATEGORIES,
  COMPETENCY_CATEGORIES,
  ALL_CATEGORIES,
  KPI_LEVELS,
  COMPETENCY_LEVELS,
  OVERALL_LEVELS,
} from './types';

/**
 * v4 scoring: each answer distributes its score across multiple categories
 * based on categoryWeights (e.g. FDR 60% / CDQ 40%).
 * Within each category, items are priority-weighted (High=3, Medium=2, Low=1).
 */
export function computeCategoryScores(answers: Answer[]): CategoryScore[] {
  const contributions: Record<string, { rating: string; priority: string; score: number; weight: number; categoryPct: number }[]> = {};

  for (const cat of ALL_CATEGORIES) {
    contributions[cat] = [];
  }

  for (const a of answers) {
    const priorityWeight = PRIORITY_WEIGHTS[a.priority] || 2;

    if (a.categoryWeights && a.categoryWeights.length > 0) {
      for (const cw of a.categoryWeights) {
        if (!contributions[cw.category]) contributions[cw.category] = [];
        contributions[cw.category].push({
          rating: a.rating,
          priority: a.priority,
          score: a.score,
          weight: priorityWeight,
          categoryPct: cw.weight / 100,
        });
      }
    } else {
      if (!contributions[a.category]) contributions[a.category] = [];
      contributions[a.category].push({
        rating: a.rating,
        priority: a.priority,
        score: a.score,
        weight: priorityWeight,
        categoryPct: 1,
      });
    }
  }

  return Object.entries(contributions)
    .filter(([, items]) => items.length > 0)
    .map(([category, items]) => {
      let totalWeighted = 0;
      let totalWeight = 0;

      for (const item of items) {
        const effectiveWeight = item.weight * item.categoryPct;
        totalWeighted += item.score * effectiveWeight;
        totalWeight += effectiveWeight;
      }

      return {
        category,
        score: totalWeight > 0 ? totalWeighted / totalWeight : 0,
        items,
      };
    });
}

export function computeKPIAverage(catScores: CategoryScore[]): number {
  const kpiScores = catScores.filter((c) => KPI_CATEGORIES.includes(c.category));
  if (kpiScores.length === 0) return 0;
  return kpiScores.reduce((sum, c) => sum + c.score, 0) / kpiScores.length;
}

export function computeCompetencyAverage(catScores: CategoryScore[]): number {
  const compScores = catScores.filter((c) => COMPETENCY_CATEGORIES.includes(c.category));
  if (compScores.length === 0) return 0;
  return compScores.reduce((sum, c) => sum + c.score, 0) / compScores.length;
}

export function getKPILevel(score: number): string {
  for (const l of KPI_LEVELS) {
    if (score >= l.min && score <= l.max) return l.level;
  }
  return KPI_LEVELS[KPI_LEVELS.length - 1].level;
}

export function getCompetencyLevel(weightedScore: number): string {
  for (const l of COMPETENCY_LEVELS) {
    if (weightedScore >= l.min && weightedScore <= l.max) return l.level;
  }
  return COMPETENCY_LEVELS[COMPETENCY_LEVELS.length - 1].level;
}

export function getOverallLevel(score: number): string {
  for (const l of OVERALL_LEVELS) {
    if (score >= l.min && score <= l.max) return l.level;
  }
  if (score < 0.75) return 'Level 1 - Poor';
  return OVERALL_LEVELS[OVERALL_LEVELS.length - 1].level;
}

export function computeAll(answers: Answer[]) {
  const catScores = computeCategoryScores(answers);
  const kpiAvg = computeKPIAverage(catScores);
  const compAvg = computeCompetencyAverage(catScores);
  const kpiWeighted = kpiAvg * 0.75;
  const compWeighted = compAvg * 0.25;
  const overall = kpiWeighted + compWeighted;

  return {
    catScores,
    kpiAvg,
    compAvg,
    kpiWeighted,
    compWeighted,
    overall,
    kpiLevel: getKPILevel(kpiAvg),
    compLevel: getCompetencyLevel(compWeighted),
    overallLevel: getOverallLevel(overall),
  };
}
