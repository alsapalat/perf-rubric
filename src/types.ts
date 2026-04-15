export interface CategoryWeight {
  category: string;
  weight: number; // percentage, e.g. 60 means 60%
}

export interface RubricItem {
  category: string; // primary category (first in weights list)
  categoryWeights: CategoryWeight[]; // v4: distributed weights across categories
  rating: string; // rubric item name
  question?: string; // v4: question text
  priority: 'High' | 'Medium' | 'Low';
  descriptions: {
    lagging: string;
    developing: string;
    proficient: string;
    exemplary: string;
  };
}

export interface Answer {
  category: string; // primary category
  categoryWeights: CategoryWeight[];
  rating: string;
  priority: string;
  score: number;
  remarks: string;
}

export interface EmployeeInfo {
  employeeName: string;
  group: string;
  positionTitle: string;
  department: string;
  division: string;
  dateHired: string;
  pefPeriod: string;
  evalDiscussionDate: string;
}

export interface CategoryScore {
  category: string;
  score: number;
  items: { rating: string; priority: string; score: number; weight: number; categoryPct: number }[];
}

export type AppStep = 'import' | 'info' | 'evaluate' | 'summary';

export interface RubricEntry {
  name: string;
  file: string;
}

export interface CodeConfig {
  label: string;
  rubrics: RubricEntry[];
  template?: string;
  autofill?: Partial<EmployeeInfo>;
}

// Validation types for import preview
export interface ItemValidation {
  rowIndex: number;
  item: RubricItem;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface RubricValidation {
  items: ItemValidation[];
  validCount: number;
  invalidCount: number;
  warningCount: number;
  isValid: boolean;
  formatVersion: 'v4' | 'legacy';
}

export const KPI_CATEGORIES = ['FDR', 'RO', 'SS', 'IRR', 'DCT', 'CDQ', 'TDA', 'TSD', 'TER', 'KSI'];
export const COMPETENCY_CATEGORIES = ['PD', 'RDM', 'CSF', 'CD', 'LX', 'IO', 'CPS'];
export const ALL_CATEGORIES = [...KPI_CATEGORIES, ...COMPETENCY_CATEGORIES];

export const PRIORITY_WEIGHTS: Record<string, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

export const KPI_LEVELS = [
  { min: 0, max: 1.00, level: 'Level 1 - Unsatisfactory Results', desc: '74% and below achievement' },
  { min: 1.01, max: 2.00, level: 'Level 2 - Below Expectations', desc: '75% to 84% achievement' },
  { min: 2.01, max: 2.75, level: 'Level 3 - Meets Expectations', desc: '85% to 100% achievement' },
  { min: 2.76, max: 3.25, level: 'Level 4 - Exceeds Expectations', desc: '101% to 115% achievement' },
  { min: 3.26, max: 4.00, level: 'Level 5 - Outstanding Results', desc: '116% and above achievement' },
];

export const COMPETENCY_LEVELS = [
  { min: 0, max: 0.33, level: 'Level 1 - Basic', desc: 'Limited use, requires close supervision' },
  { min: 0.34, max: 0.58, level: 'Level 2 - Intermediate', desc: 'Developing, sufficient understanding' },
  { min: 0.59, max: 0.83, level: 'Level 3 - Proficient', desc: 'Advanced, independent in complex tasks' },
  { min: 0.84, max: 1.00, level: 'Level 4 - Expert', desc: 'Mastery, can coach others' },
];

export const OVERALL_LEVELS = [
  { min: 0.75, max: 1.75, level: 'Level 1 - Poor' },
  { min: 1.76, max: 2.75, level: 'Level 2 - Needs Improvement' },
  { min: 2.76, max: 3.75, level: 'Level 3 - Satisfactory' },
  { min: 3.76, max: 4.50, level: 'Level 4 - Very Satisfactory' },
  { min: 4.51, max: 4.75, level: 'Level 5 - Outstanding' },
];

export const CATEGORY_FULL_NAMES: Record<string, string> = {
  FDR: 'Flow, Delivery & Rhythm',
  RO: 'Resource Optimization',
  SS: 'Stakeholder/Strategic Alignment',
  IRR: 'Incident Response & Reliability',
  DCT: 'Delivery Cycle Throughput',
  CDQ: 'Craft & Design Quality',
  TDA: 'Test Debt Awareness',
  TSD: 'Team Skills Development',
  TER: 'Team Engagement & Retention',
  KSI: 'Knowledge Sharing & Innovation',
  PD: 'Product Direction',
  RDM: 'Risk & Decision Making',
  CSF: 'Communication & Stakeholder Feedback',
  CD: 'Continuous Development',
  LX: 'Leading Change',
  IO: 'Inspiring Others',
  CPS: 'Creative Problem Solving',
};
