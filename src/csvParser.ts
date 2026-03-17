import Papa from 'papaparse';
import { RubricItem, Answer } from './types';

export function parseRubricCSV(csvText: string): RubricItem[] {
  const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  const items: RubricItem[] = [];

  for (const row of result.data as Record<string, string>[]) {
    const category = (row['Category'] || '').trim();
    const rating = (row['Rating'] || '').trim();
    const priority = (row['Priority'] || 'Medium').trim() as 'High' | 'Medium' | 'Low';
    const lagging = (row['1 - Lagging'] || '').trim();
    const developing = (row['2 - Developing'] || '').trim();
    const proficient = (row['3 - Proficient'] || '').trim();
    const exemplary = (row['4 - Exemplary'] || '').trim();

    if (category && rating) {
      items.push({
        category,
        rating,
        priority,
        descriptions: { lagging, developing, proficient, exemplary },
      });
    }
  }
  return items;
}

export function exportAnswersCSV(answers: Answer[]): string {
  const rows = answers.map((a) => ({
    Category: a.category,
    Rating: a.rating,
    Priority: a.priority,
    Score: a.score.toFixed(2),
    Remarks: a.remarks,
  }));
  return Papa.unparse(rows);
}
