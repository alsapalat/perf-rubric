import { useCallback, useState } from 'react';
import { CodeConfig } from '../types';

interface Props {
  onImport: (csvText: string, fileName: string) => void;
  codeConfig?: CodeConfig | null;
}

export default function ImportStep({ onImport, codeConfig }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        onImport(text, file.name);
      };
      reader.readAsText(file);
    },
    [onImport]
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
        onImport(text, fileName);
      } catch {
        setLoading(null);
      }
    },
    [onImport]
  );

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
          Drag & drop your position-specific rubric CSV file here, or click to browse.
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
        Supported files: QA Supervisor, Creative Design Head, Mobile Head, Frontend Head, Backend Head, Hardware Head, Gamedev Head rubric CSVs
      </p>
    </div>
  );
}
