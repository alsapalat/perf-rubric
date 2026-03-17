import {
  Answer,
  CategoryScore,
  PRIORITY_WEIGHTS,
  KPI_CATEGORIES,
  COMPETENCY_CATEGORIES,
  KPI_LEVELS,
  COMPETENCY_LEVELS,
  OVERALL_LEVELS,
} from './types';

export function computeCategoryScores(answers: Answer[]): CategoryScore[] {
  const grouped: Record<string, Answer[]> = {};
  for (const a of answers) {
    if (!grouped[a.category]) grouped[a.category] = [];
    grouped[a.category].push(a);
  }

  return Object.entries(grouped).map(([category, items]) => {
    let totalWeighted = 0;
    let totalWeight = 0;
    const itemDetails = items.map((item) => {
      const w = PRIORITY_WEIGHTS[item.priority] || 2;
      totalWeighted += item.score * w;
      totalWeight += w;
      return { rating: item.rating, priority: item.priority, score: item.score, weight: w };
    });
    return {
      category,
      score: totalWeight > 0 ? totalWeighted / totalWeight : 0,
      items: itemDetails,
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
