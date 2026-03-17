import { useMemo } from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { saveAs } from 'file-saver';
import {
  Answer,
  EmployeeInfo,
  KPI_CATEGORIES,
  COMPETENCY_CATEGORIES,
  CATEGORY_FULL_NAMES,
} from '../types';
import { computeAll } from '../scoring';
import { exportAnswersCSV } from '../csvParser';
import { exportDocx } from '../docxExport';

interface Props {
  answers: Answer[];
  employeeInfo: EmployeeInfo;
  templateFile: File | null;
  setTemplateFile: (f: File | null) => void;
  onBack: () => void;
}

function getBarColor(score: number): string {
  if (score < 1.5) return '#ef4444';
  if (score < 2.5) return '#f59e0b';
  if (score < 3.5) return '#3b82f6';
  return '#22c55e';
}

function getLevelBadge(level: string) {
  if (level.includes('Outstanding') || level.includes('Expert') || level.includes('Very Satisfactory'))
    return 'bg-green-100 text-green-800 border-green-200';
  if (level.includes('Exceeds') || level.includes('Proficient') || level.includes('Satisfactory'))
    return 'bg-blue-100 text-blue-800 border-blue-200';
  if (level.includes('Meets') || level.includes('Intermediate'))
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  return 'bg-red-100 text-red-800 border-red-200';
}

export default function SummaryStep({ answers, employeeInfo, templateFile, setTemplateFile, onBack }: Props) {
  const results = useMemo(() => computeAll(answers), [answers]);

  const kpiChartData = useMemo(
    () =>
      results.catScores
        .filter((c) => KPI_CATEGORIES.includes(c.category))
        .map((c) => ({ name: c.category, score: parseFloat(c.score.toFixed(2)), fullMark: 4 })),
    [results]
  );

  const compChartData = useMemo(
    () =>
      results.catScores
        .filter((c) => COMPETENCY_CATEGORIES.includes(c.category))
        .map((c) => ({ name: c.category, score: parseFloat(c.score.toFixed(2)), fullMark: 4 })),
    [results]
  );

  const allBarData = useMemo(
    () =>
      results.catScores.map((c) => ({
        name: c.category,
        score: parseFloat(c.score.toFixed(2)),
        isKPI: KPI_CATEGORIES.includes(c.category),
      })),
    [results]
  );

  const handleExportCSV = () => {
    const csv = exportAnswersCSV(answers);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `Self Evaluation - ${employeeInfo.employeeName}.csv`);
  };

  const handleExportDocx = async () => {
    if (!templateFile) return;
    await exportDocx(templateFile, employeeInfo, answers);
  };

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Overall Performance Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* KPI */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-xs font-semibold text-blue-600 uppercase mb-1">KPI Achievement (75%)</p>
            <p className="text-3xl font-bold text-blue-700">{results.kpiAvg.toFixed(2)}</p>
            <p className="text-sm text-blue-500 mt-1">Weighted: {results.kpiWeighted.toFixed(2)}</p>
            <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full border ${getLevelBadge(results.kpiLevel)}`}>
              {results.kpiLevel}
            </span>
          </div>

          {/* Competency */}
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <p className="text-xs font-semibold text-purple-600 uppercase mb-1">Competency Level (25%)</p>
            <p className="text-3xl font-bold text-purple-700">{results.compAvg.toFixed(2)}</p>
            <p className="text-sm text-purple-500 mt-1">Weighted: {results.compWeighted.toFixed(2)}</p>
            <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full border ${getLevelBadge(results.compLevel)}`}>
              {results.compLevel}
            </span>
          </div>

          {/* Overall */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 text-white">
            <p className="text-xs font-semibold text-gray-300 uppercase mb-1">Overall Score</p>
            <p className="text-4xl font-bold">{results.overall.toFixed(2)}</p>
            <p className="text-sm text-gray-400 mt-1">
              {results.kpiWeighted.toFixed(2)} + {results.compWeighted.toFixed(2)}
            </p>
            <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-white/20 text-white">
              {results.overallLevel}
            </span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KPI Radar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">KPI Categories (75%)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={kpiChartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 4]} tick={{ fontSize: 10 }} />
              <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Competency Radar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Competency Categories (25%)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={compChartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 4]} tick={{ fontSize: 10 }} />
              <Radar name="Score" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* All Categories Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">All Category Scores</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={allBarData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 4]} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="score" radius={[4, 4, 0, 0]}>
              {allBarData.map((entry, idx) => (
                <Cell key={idx} fill={getBarColor(entry.score)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Scores Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Detailed Category Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Category</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Name</th>
                <th className="text-center py-2 px-3 text-gray-500 font-medium">Type</th>
                <th className="text-center py-2 px-3 text-gray-500 font-medium">Score</th>
              </tr>
            </thead>
            <tbody>
              {results.catScores.map((cs) => (
                <tr key={cs.category} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-3 font-mono font-bold text-gray-700">{cs.category}</td>
                  <td className="py-2 px-3 text-gray-600">{CATEGORY_FULL_NAMES[cs.category] || cs.category}</td>
                  <td className="py-2 px-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      KPI_CATEGORIES.includes(cs.category) ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {KPI_CATEGORIES.includes(cs.category) ? 'KPI' : 'Competency'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center font-bold" style={{ color: getBarColor(cs.score) }}>
                    {cs.score.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Export Results</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* CSV Export */}
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="font-medium text-gray-700 mb-1">Export as CSV</p>
            <p className="text-xs text-gray-500 mb-3">Download all answers with scores and remarks</p>
            <button
              onClick={handleExportCSV}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Download CSV
            </button>
          </div>

          {/* DOCX Export */}
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="font-medium text-gray-700 mb-1">Export as DOCX</p>
            <p className="text-xs text-gray-500 mb-3">Fill the Performance Evaluation template with your scores</p>
            {!templateFile ? (
              <label className="block w-full text-center bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer">
                Upload Template (.docx)
                <input
                  type="file"
                  accept=".docx"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setTemplateFile(f);
                  }}
                />
              </label>
            ) : (
              <div>
                <p className="text-xs text-green-600 mb-2">Template loaded: {templateFile.name}</p>
                <button
                  onClick={handleExportDocx}
                  className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Generate & Download DOCX
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="flex justify-start pb-8">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Back to Evaluation
        </button>
      </div>
    </div>
  );
}
