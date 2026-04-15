import { useCallback, useState, useMemo } from 'react';
import { CodeConfig, RubricItem, RubricValidation, KPI_CATEGORIES, COMPETENCY_CATEGORIES, CATEGORY_FULL_NAMES } from '../types';
import { parseRubricCSV, validateRubricItems, formatCategoryWeights } from '../csvParser';

interface Props {
  onImport: (items: RubricItem[], fileName: string) => void;
  codeConfig?: CodeConfig | null;
}

export default function ImportStep({ onImport, codeConfig }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  // Preview state
  const [previewItems, setPreviewItems] = useState<RubricItem[] | null>(null);
  const [previewFileName, setPreviewFileName] = useState('');
  const [previewFormat, setPreviewFormat] = useState<'v4' | 'legacy'>('legacy');
  const [filterStatus, setFilterStatus] = useState<'all' | 'valid' | 'invalid'>('all');

  const validation = useMemo<RubricValidation | null>(() => {
    if (!previewItems) return null;
    return validateRubricItems(previewItems, previewFormat);
  }, [previewItems, previewFormat]);

  const filteredItems = useMemo(() => {
    if (!validation) return [];
    if (filterStatus === 'all') return validation.items;
    if (filterStatus === 'valid') return validation.items.filter((v) => v.isValid);
    return validation.items.filter((v) => !v.isValid);
  }, [validation, filterStatus]);

  // Unique categories detected
  const detectedCategories = useMemo(() => {
    if (!previewItems) return { kpi: [] as string[], comp: [] as string[], unknown: [] as string[] };
    const allCats = new Set<string>();
    for (const item of previewItems) {
      for (const w of item.categoryWeights) {
        allCats.add(w.category);
      }
    }
    const kpi = [...allCats].filter((c) => KPI_CATEGORIES.includes(c));
    const comp = [...allCats].filter((c) => COMPETENCY_CATEGORIES.includes(c));
    const unknown = [...allCats].filter((c) => !KPI_CATEGORIES.includes(c) && !COMPETENCY_CATEGORIES.includes(c));
    return { kpi, comp, unknown };
  }, [previewItems]);

  const handleCSVText = useCallback((csvText: string, fileName: string) => {
    const { items, format } = parseRubricCSV(csvText);
    setPreviewItems(items);
    setPreviewFileName(fileName);
    setPreviewFormat(format);
    setFilterStatus('all');
    setLoading(null);
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        handleCSVText(text, file.name);
      };
      reader.readAsText(file);
    },
    [handleCSVText]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith('.csv')) handleFile(file);
    },
    [handleFile]
  );

  const handleRubricCard = useCallback(
    async (name: string, filePath: string) => {
      setLoading(name);
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}${filePath}`);
        const text = await res.text();
        const fileName = filePath.split('/').pop() || filePath;
        handleCSVText(text, fileName);
      } catch {
        setLoading(null);
      }
    },
    [handleCSVText]
  );

  const handleConfirmImport = useCallback(() => {
    if (previewItems && validation?.isValid) {
      onImport(previewItems, previewFileName);
    }
  }, [previewItems, previewFileName, validation, onImport]);

  const handleCancelPreview = useCallback(() => {
    setPreviewItems(null);
    setPreviewFileName('');
    setPreviewFormat('legacy');
  }, []);

  // ---- Preview mode ----
  if (previewItems && validation) {
    return (
      <div className="max-w-5xl mx-auto py-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Rubric Preview</h2>
              <p className="text-sm text-gray-500 mt-0.5">{previewFileName}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                previewFormat === 'v4'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}>
                {previewFormat === 'v4' ? 'v4 (Weighted)' : 'Legacy'}
              </span>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
              <span className="text-sm text-gray-600">{previewItems.length} items</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-sm text-green-700">{validation.validCount} valid</span>
            </div>
            {validation.invalidCount > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-sm text-red-700">{validation.invalidCount} invalid</span>
              </div>
            )}
            {validation.warningCount > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-sm text-amber-700">{validation.warningCount} warnings</span>
              </div>
            )}
          </div>

          {/* Category coverage */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2">Category Coverage</p>
            <div className="flex flex-wrap gap-1.5">
              {detectedCategories.kpi.map((c) => (
                <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200" title={CATEGORY_FULL_NAMES[c]}>
                  {c}
                </span>
              ))}
              {detectedCategories.comp.map((c) => (
                <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200" title={CATEGORY_FULL_NAMES[c]}>
                  {c}
                </span>
              ))}
              {detectedCategories.unknown.map((c) => (
                <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                  {c} (unknown)
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 mb-3">
          {(['all', 'valid', 'invalid'] as const).map((f) => {
            const count = f === 'all' ? validation.items.length : f === 'valid' ? validation.validCount : validation.invalidCount;
            return (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  filterStatus === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)} ({count})
              </button>
            );
          })}
        </div>

        {/* Items table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-2.5 px-3 text-gray-500 font-medium w-8">#</th>
                  <th className="text-left py-2.5 px-3 text-gray-500 font-medium w-8">Status</th>
                  <th className="text-left py-2.5 px-3 text-gray-500 font-medium">Rubric Item</th>
                  <th className="text-left py-2.5 px-3 text-gray-500 font-medium">Category Weights</th>
                  <th className="text-center py-2.5 px-3 text-gray-500 font-medium w-20">Priority</th>
                  <th className="text-center py-2.5 px-3 text-gray-500 font-medium w-24">Descriptions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((v) => {
                  const hasWarnings = v.warnings.length > 0;
                  const descCount = [
                    v.item.descriptions.lagging,
                    v.item.descriptions.developing,
                    v.item.descriptions.proficient,
                    v.item.descriptions.exemplary,
                  ].filter(Boolean).length;

                  return (
                    <tr
                      key={v.rowIndex}
                      className={`border-b border-gray-100 ${!v.isValid ? 'bg-red-50/50' : hasWarnings ? 'bg-amber-50/30' : 'hover:bg-gray-50'}`}
                    >
                      <td className="py-2 px-3 text-gray-400 text-xs">{v.rowIndex}</td>
                      <td className="py-2 px-3">
                        {v.isValid ? (
                          hasWarnings ? (
                            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs" title={v.warnings.join('; ')}>!</span>
                          ) : (
                            <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">{'\u2713'}</span>
                          )
                        ) : (
                          <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs" title={v.errors.join('; ')}>{'\u2717'}</span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <p className="font-medium text-gray-800 text-xs">{v.item.rating}</p>
                        {v.item.question && (
                          <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{v.item.question}</p>
                        )}
                        {v.errors.length > 0 && (
                          <div className="mt-1">
                            {v.errors.map((err, i) => (
                              <p key={i} className="text-[10px] text-red-600">{'\u2022'} {err}</p>
                            ))}
                          </div>
                        )}
                        {v.warnings.length > 0 && (
                          <div className="mt-1">
                            {v.warnings.map((w, i) => (
                              <p key={i} className="text-[10px] text-amber-600">{'\u2022'} {w}</p>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex flex-wrap gap-1">
                          {v.item.categoryWeights.map((cw, i) => (
                            <span
                              key={i}
                              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                KPI_CATEGORIES.includes(cw.category)
                                  ? 'bg-blue-50 text-blue-700'
                                  : COMPETENCY_CATEGORIES.includes(cw.category)
                                  ? 'bg-purple-50 text-purple-700'
                                  : 'bg-red-50 text-red-700'
                              }`}
                            >
                              {cw.category} {cw.weight}%
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                          v.item.priority === 'High' ? 'bg-red-50 text-red-700 border-red-200'
                          : v.item.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-gray-50 text-gray-500 border-gray-200'
                        }`}>
                          {v.item.priority}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`text-xs font-medium ${descCount === 4 ? 'text-green-600' : descCount > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                          {descCount}/4
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={handleCancelPreview}
            className="px-4 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            {!validation.isValid && (
              <p className="text-xs text-red-600">Fix {validation.invalidCount} invalid item{validation.invalidCount > 1 ? 's' : ''} to continue</p>
            )}
            <button
              onClick={handleConfirmImport}
              disabled={!validation.isValid}
              className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                validation.isValid
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Import {previewItems.length} Items
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Upload mode (no preview yet) ----
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {codeConfig && (
        <div className="w-full max-w-2xl mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-1 text-center">
            {codeConfig.label} Rubrics
          </h2>
          <p className="text-sm text-gray-500 mb-4 text-center">
            Select your position rubric to get started
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {codeConfig.rubrics.map((r) => (
              <button
                key={r.file}
                onClick={() => handleRubricCard(r.name, r.file)}
                disabled={loading !== null}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  loading === r.name
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-blue-400 hover:shadow-md'
                } ${loading !== null && loading !== r.name ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-lg font-bold shrink-0">
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{r.name}</p>
                    <p className="text-xs text-gray-400">
                      {loading === r.name ? 'Loading...' : 'Click to load rubric'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-gray-50 px-3 text-gray-400">Or upload your own CSV</span>
            </div>
          </div>
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`w-full max-w-lg border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
        }`}
      >
        <div className="text-5xl mb-4">&#128196;</div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Import Rubric CSV</h2>
        <p className="text-gray-500 mb-6 text-sm">
          Drag & drop your rubric CSV file here, or click to browse.
          <br />
          <span className="text-xs text-gray-400">Supports both v4 (weighted) and legacy formats.</span>
        </p>
        <label className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors font-medium">
          Browse Files
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>
      </div>
      <p className="text-xs text-gray-400 mt-4">
        v4 format: Category Weights | Rubric Item | Question | Priority | 1-Lagging | 2-Developing | 3-Proficient | 4-Exemplary
      </p>
    </div>
  );
}
