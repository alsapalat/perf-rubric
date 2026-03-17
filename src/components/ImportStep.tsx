import { useCallback, useState } from 'react';

interface Props {
  onImport: (csvText: string, fileName: string) => void;
}

export default function ImportStep({ onImport }: Props) {
  const [dragOver, setDragOver] = useState(false);

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

  return (
    <div className="flex flex-col items-center justify-center py-20">
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
