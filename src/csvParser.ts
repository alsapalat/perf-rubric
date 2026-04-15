import Papa from 'papaparse';
import {
  RubricItem,
  Answer,
  CategoryWeight,
  ItemValidation,
  RubricValidation,
  ALL_CATEGORIES,
} from './types';

/**
 * Parses weight strings like "FDR 60% / CDQ 40%" or "RO 100%"
 * Returns array of {category, weight} or empty array if invalid.
 */
export function parseCategoryWeights(weightStr: string): CategoryWeight[] {
  if (!weightStr || !weightStr.trim()) return [];
  const parts = weightStr.split('/').map((s) => s.trim());
  const weights: CategoryWeight[] = [];

  for (const part of parts) {
    const match = part.match(/^([A-Za-z]+)\s+(\d+)%$/);
    if (match) {
      weights.push({ category: match[1].toUpperCase(), weight: parseInt(match[2], 10) });
    }
  }
  return weights;
}

/**
 * Formats category weights back to display string.
 */
export function formatCategoryWeights(weights: CategoryWeight[]): string {
  return weights.map((w) => `${w.category} ${w.weight}%`).join(' / ');
}

/**
 * Detects whether CSV uses v4 format (has "Category Weights" column)
 * or legacy format (has "Category" column).
 */
function detectFormat(headers: string[]): 'v4' | 'legacy' {
  const normalized = headers.map((h) => h.trim().toLowerCase());
  if (normalized.includes('category weights')) return 'v4';
  return 'legacy';
}

/**
 * Parses CSV text into RubricItem array.
 * Supports both v4 format (Category Weights + Question columns)
 * and legacy format (single Category column).
 */
export function parseRubricCSV(csvText: string): { items: RubricItem[]; format: 'v4' | 'legacy' } {
  const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  const headers = result.meta.fields || [];
  const format = detectFormat(headers);
  const items: RubricItem[] = [];

  for (const row of result.data as Record<string, string>[]) {
    if (format === 'v4') {
      const weightStr = (row['Category Weights'] || '').trim();
      const rating = (row['Rubric Item'] || '').trim();
      const question = (row['Question'] || '').trim();
      const priority = normalizePriority(row['Priority']);
      const weights = parseCategoryWeights(weightStr);
      const primaryCategory = weights.length > 0 ? weights[0].category : '';

      if (primaryCategory && rating) {
        items.push({
          category: primaryCategory,
          categoryWeights: weights,
          rating,
          question: question || undefined,
          priority,
          descriptions: extractDescriptions(row),
        });
      }
    } else {
      // Legacy format
      const category = (row['Category'] || '').trim();
      const rating = (row['Rating'] || '').trim();
      const priority = normalizePriority(row['Priority']);

      if (category && rating) {
        items.push({
          category,
          categoryWeights: [{ category, weight: 100 }],
          rating,
          priority,
          descriptions: extractDescriptions(row),
        });
      }
    }
  }

  return { items, format };
}

function normalizePriority(val: string | undefined): 'High' | 'Medium' | 'Low' {
  const p = (val || 'Medium').trim();
  if (p === 'High' || p === 'Medium' || p === 'Low') return p;
  return 'Medium';
}

function extractDescriptions(row: Record<string, string>) {
  return {
    lagging: (row['1 - Lagging'] || '').trim(),
    developing: (row['2 - Developing'] || '').trim(),
    proficient: (row['3 - Proficient'] || '').trim(),
    exemplary: (row['4 - Exemplary'] || '').trim(),
  };
}

/**
 * Validates parsed rubric items and returns detailed validation results.
 * Used for import preview with valid/invalid indicators.
 */
export function validateRubricItems(items: RubricItem[], format: 'v4' | 'legacy'): RubricValidation {
  const validations: ItemValidation[] = items.map((item, idx) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check category weights
    if (item.categoryWeights.length === 0) {
      errors.push('No category weights found');
    } else {
      const totalWeight = item.categoryWeights.reduce((s, w) => s + w.weight, 0);
      if (totalWeight < 95 || totalWeight > 105) {
        errors.push(`Weights sum to ${totalWeight}% (expected ~100%)`);
      }
      for (const w of item.categoryWeights) {
        if (!ALL_CATEGORIES.includes(w.category)) {
          warnings.push(`Unknown category: ${w.category}`);
        }
      }
    }

    // Check priority
    if (!['High', 'Medium', 'Low'].includes(item.priority)) {
      errors.push(`Invalid priority: ${item.priority}`);
    }

    // Check rating name
    if (!item.rating) {
      errors.push('Missing rubric item name');
    }

    // Check descriptions
    const descs = item.descriptions;
    const missingDescs: string[] = [];
    if (!descs.lagging) missingDescs.push('Lagging');
    if (!descs.developing) missingDescs.push('Developing');
    if (!descs.proficient) missingDescs.push('Proficient');
    if (!descs.exemplary) missingDescs.push('Exemplary');
    if (missingDescs.length > 0) {
      warnings.push(`Missing descriptions: ${missingDescs.join(', ')}`);
    }

    return {
      rowIndex: idx + 1,
      item,
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  });

  const validCount = validations.filter((v) => v.isValid).length;
  const invalidCount = validations.filter((v) => !v.isValid).length;
  const warningCount = validations.filter((v) => v.warnings.length > 0).length;

  return {
    items: validations,
    validCount,
    invalidCount,
    warningCount,
    isValid: invalidCount === 0,
    formatVersion: format,
  };
}

/**
 * Exports answers to CSV format, now including category weights.
 */
export function exportAnswersCSV(answers: Answer[]): string {
  const rows = answers.map((a) => ({
    'Category Weights': formatCategoryWeights(a.categoryWeights),
    Rating: a.rating,
    Priority: a.priority,
    Score: a.score.toFixed(2),
    Remarks: a.remarks,
  }));
  return Papa.unparse(rows);
}
