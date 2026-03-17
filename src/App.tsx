import { useState, useCallback, useEffect } from 'react';
import { RubricItem, Answer, EmployeeInfo, AppStep, CodeConfig } from './types';
import { parseRubricCSV } from './csvParser';
import ImportStep from './components/ImportStep';
import InfoStep from './components/InfoStep';
import EvaluateStep from './components/EvaluateStep';
import SummaryStep from './components/SummaryStep';

const STEPS: { key: AppStep; label: string }[] = [
  { key: 'import', label: 'Import Rubric' },
  { key: 'info', label: 'Employee Info' },
  { key: 'evaluate', label: 'Self-Evaluation' },
  { key: 'summary', label: 'Summary' },
];

export default function App() {
  const [step, setStep] = useState<AppStep>('import');
  const [rubric, setRubric] = useState<RubricItem[]>([]);
  const [rubricFileName, setRubricFileName] = useState('');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo>({
    employeeName: '',
    group: '',
    positionTitle: '',
    department: '',
    division: '',
    dateHired: '',
    pefPeriod: '',
    evalDiscussionDate: '',
  });
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [codeConfig, setCodeConfig] = useState<CodeConfig | null>(null);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) return;
    fetch(`${import.meta.env.BASE_URL}codes.json`)
      .then((r) => r.json())
      .then((registry: Record<string, CodeConfig>) => {
        const config = registry[code];
        if (config) {
          setCodeConfig(config);
          if (config.autofill) {
            setEmployeeInfo((prev) => ({ ...prev, ...config.autofill }));
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleImport = useCallback((csvText: string, fileName: string) => {
    const items = parseRubricCSV(csvText);
    setRubric(items);
    setRubricFileName(fileName);
    setAnswers(
      items.map((item) => ({
        category: item.category,
        rating: item.rating,
        priority: item.priority,
        score: 2.5,
        remarks: '',
      }))
    );
    setStep('info');
  }, []);

  const handleInfoSubmit = useCallback((info: EmployeeInfo) => {
    setEmployeeInfo(info);
    setStep('evaluate');
  }, []);

  const handleEvalComplete = useCallback(() => {
    setStep('summary');
  }, []);

  const stepIdx = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-gray-800">Performance Self-Evaluation</h1>
          {rubricFileName && (
            <p className="text-xs text-gray-500 mt-0.5">Rubric: {rubricFileName}</p>
          )}
        </div>
        <div className="max-w-5xl mx-auto px-4 pb-3">
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex items-center flex-1">
                <button
                  onClick={() => {
                    if (i <= stepIdx) setStep(s.key);
                  }}
                  disabled={i > stepIdx}
                  className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${
                    i === stepIdx
                      ? 'bg-blue-600 text-white'
                      : i < stepIdx
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                    {i < stepIdx ? '\u2713' : i + 1}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 ${i < stepIdx ? 'bg-blue-400' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {step === 'import' && <ImportStep onImport={handleImport} codeConfig={codeConfig} />}
        {step === 'info' && (
          <InfoStep info={employeeInfo} onSubmit={handleInfoSubmit} onBack={() => setStep('import')} />
        )}
        {step === 'evaluate' && (
          <EvaluateStep
            rubric={rubric}
            answers={answers}
            setAnswers={setAnswers}
            onComplete={handleEvalComplete}
            onBack={() => setStep('info')}
          />
        )}
        {step === 'summary' && (
          <SummaryStep
            answers={answers}
            employeeInfo={employeeInfo}
            templateFile={templateFile}
            setTemplateFile={setTemplateFile}
            templateUrl={codeConfig?.template}
            onBack={() => setStep('evaluate')}
          />
        )}
      </main>
    </div>
  );
}
