import { useState } from 'react';
import { EmployeeInfo } from '../types';

interface Props {
  info: EmployeeInfo;
  onSubmit: (info: EmployeeInfo) => void;
  onBack: () => void;
}

const FIELDS: { key: keyof EmployeeInfo; label: string; type?: string }[] = [
  { key: 'employeeName', label: 'Employee Name' },
  { key: 'group', label: 'Group' },
  { key: 'positionTitle', label: 'Position Title' },
  { key: 'department', label: 'Department' },
  { key: 'division', label: 'Division' },
  { key: 'dateHired', label: 'Date Hired', type: 'date' },
  { key: 'pefPeriod', label: 'Performance Evaluation Period' },
  { key: 'evalDiscussionDate', label: 'Evaluation Discussion Date', type: 'date' },
];

export default function InfoStep({ info, onSubmit, onBack }: Props) {
  const [form, setForm] = useState<EmployeeInfo>(info);

  const handleChange = (key: keyof EmployeeInfo, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const isValid = form.employeeName.trim() && form.positionTitle.trim();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Employee Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FIELDS.map((f) => (
            <div key={f.key} className={f.key === 'employeeName' ? 'sm:col-span-2' : ''}>
              <label className="block text-sm font-medium text-gray-600 mb-1">{f.label}</label>
              <input
                type={f.type || 'text'}
                value={form[f.key]}
                onChange={(e) => handleChange(f.key, e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder={f.label}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-6">
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={() => isValid && onSubmit(form)}
            disabled={!isValid}
            className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors ${
              isValid
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Continue to Evaluation
          </button>
        </div>
      </div>
    </div>
  );
}
