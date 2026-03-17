import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { RubricItem, Answer, CATEGORY_FULL_NAMES } from '../types';

interface Props {
  rubric: RubricItem[];
  answers: Answer[];
  setAnswers: React.Dispatch<React.SetStateAction<Answer[]>>;
  onComplete: () => void;
  onBack: () => void;
}

const LEVEL_LABELS = ['Lagging', 'Developing', 'Proficient', 'Exemplary'] as const;

function getScoreColor(score: number): string {
  if (score < 1.5) return '#ef4444';
  if (score < 2.5) return '#f59e0b';
  if (score < 3.5) return '#3b82f6';
  return '#22c55e';
}

function getLevelLabel(score: number): string {
  if (score < 1.5) return 'Lagging';
  if (score < 2.5) return 'Developing';
  if (score < 3.5) return 'Proficient';
  return 'Exemplary';
}

function getPriorityStyle(priority: string) {
  const map: Record<string, string> = {
    High: 'bg-red-100 text-red-700 border-red-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    Low: 'bg-gray-100 text-gray-500 border-gray-200',
  };
  return map[priority] || map.Medium;
}

export default function EvaluateStep({ rubric, answers, setAnswers, onComplete, onBack }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showJumpTo, setShowJumpTo] = useState(false);
  const [showRemarks, setShowRemarks] = useState(false);
  const jumpRef = useRef<HTMLDivElement>(null);
  const total = rubric.length;

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  // Close jump-to on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (jumpRef.current && !jumpRef.current.contains(e.target as Node)) {
        setShowJumpTo(false);
      }
    };
    if (showJumpTo) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showJumpTo]);

  // Reset remarks visibility when navigating
  useEffect(() => {
    setShowRemarks(answers[currentIdx]?.remarks?.length > 0);
  }, [currentIdx]);

  const item = rubric[currentIdx];
  const answer = answers[currentIdx];

  // Category grouping for jump-to
  const categoryMap = useMemo(() => {
    const map: { cat: string; startIdx: number; count: number }[] = [];
    let lastCat = '';
    for (let i = 0; i < rubric.length; i++) {
      if (rubric[i].category !== lastCat) {
        map.push({ cat: rubric[i].category, startIdx: i, count: 0 });
        lastCat = rubric[i].category;
      }
      map[map.length - 1].count++;
    }
    return map;
  }, [rubric]);

  const currentCatInfo = useMemo(() => {
    for (const c of categoryMap) {
      if (currentIdx >= c.startIdx && currentIdx < c.startIdx + c.count) {
        return { ...c, localIdx: currentIdx - c.startIdx };
      }
    }
    return { cat: '', startIdx: 0, count: 0, localIdx: 0 };
  }, [categoryMap, currentIdx]);

  const touchedCount = useMemo(() => answers.filter((a) => a.score !== 2.5 || a.remarks.length > 0).length, [answers]);
  const progressPercent = Math.round((touchedCount / total) * 100);

  const updateScore = useCallback(
    (val: number) => {
      setAnswers((prev) => {
        const next = [...prev];
        next[currentIdx] = { ...next[currentIdx], score: Math.round(Math.max(1, Math.min(4, val)) * 10) / 10 };
        return next;
      });
    },
    [currentIdx, setAnswers]
  );

  const updateRemarks = useCallback(
    (val: string) => {
      setAnswers((prev) => {
        const next = [...prev];
        next[currentIdx] = { ...next[currentIdx], remarks: val };
        return next;
      });
    },
    [currentIdx, setAnswers]
  );

  const goNext = useCallback(() => {
    if (currentIdx < total - 1) setCurrentIdx((i) => i + 1);
  }, [currentIdx, total]);

  const goPrev = useCallback(() => {
    if (currentIdx > 0) setCurrentIdx((i) => i - 1);
  }, [currentIdx]);

  if (!item || !answer) return null;

  const descriptions = [
    { score: 1, label: '1 \u2014 Lagging', desc: item.descriptions.lagging, border: 'border-red-300', bg: 'bg-red-50', activeBg: 'bg-red-100 ring-2 ring-red-400' },
    { score: 2, label: '2 \u2014 Developing', desc: item.descriptions.developing, border: 'border-orange-300', bg: 'bg-orange-50', activeBg: 'bg-orange-100 ring-2 ring-orange-400' },
    { score: 3, label: '3 \u2014 Proficient', desc: item.descriptions.proficient, border: 'border-blue-300', bg: 'bg-blue-50', activeBg: 'bg-blue-100 ring-2 ring-blue-400' },
    { score: 4, label: '4 \u2014 Exemplary', desc: item.descriptions.exemplary, border: 'border-green-300', bg: 'bg-green-50', activeBg: 'bg-green-100 ring-2 ring-green-400' },
  ];

  const activeLevel = Math.round(answer.score);
  const isFirst = currentIdx === 0;
  const isLast = currentIdx === total - 1;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Top bar: progress + jump-to */}
      <div className="mb-4">
        {/* Segmented progress showing categories */}
        <div className="flex items-center gap-0.5 mb-2">
          {categoryMap.map((c) => {
            const catAnswers = answers.slice(c.startIdx, c.startIdx + c.count);
            const catTouched = catAnswers.filter((a) => a.score !== 2.5 || a.remarks.length > 0).length;
            const isCurrent = currentIdx >= c.startIdx && currentIdx < c.startIdx + c.count;
            const pct = c.count > 0 ? (catTouched / c.count) * 100 : 0;

            return (
              <button
                key={c.cat}
                onClick={() => setCurrentIdx(c.startIdx)}
                title={`${c.cat} \u2014 ${CATEGORY_FULL_NAMES[c.cat] || c.cat} (${catTouched}/${c.count})`}
                className={`flex-1 h-2 rounded-full relative overflow-hidden transition-all ${
                  isCurrent ? 'ring-2 ring-blue-400 ring-offset-1' : ''
                }`}
                style={{ background: '#e5e7eb' }}
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all"
                  style={{ width: `${pct}%`, background: isCurrent ? '#3b82f6' : '#93c5fd' }}
                />
              </button>
            );
          })}
        </div>

        {/* Current position + jump-to trigger */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {currentIdx + 1} / {total}
            </span>
            <span className="text-xs text-gray-300">|</span>
            <span className="text-xs font-medium text-gray-600">
              {currentCatInfo.cat} &middot; {currentCatInfo.localIdx + 1}/{currentCatInfo.count}
            </span>
          </div>

          <div className="relative" ref={jumpRef}>
            <button
              onClick={() => setShowJumpTo(!showJumpTo)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              Jump to...
              <span className="text-[10px]">{showJumpTo ? '\u25B2' : '\u25BC'}</span>
            </button>

            {/* Jump-to dropdown */}
            {showJumpTo && (
              <div className="absolute right-0 top-6 z-50 bg-white border border-gray-200 rounded-xl shadow-lg w-72 max-h-[60vh] overflow-y-auto">
                {categoryMap.map((c) => (
                  <div key={c.cat}>
                    <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 sticky top-0">
                      <span className="text-xs font-bold text-gray-500">{c.cat}</span>
                      <span className="text-xs text-gray-400 ml-1">{CATEGORY_FULL_NAMES[c.cat]}</span>
                    </div>
                    {rubric.slice(c.startIdx, c.startIdx + c.count).map((r, li) => {
                      const gi = c.startIdx + li;
                      const a = answers[gi];
                      const touched = a && (a.score !== 2.5 || a.remarks.length > 0);
                      const isActive = gi === currentIdx;
                      return (
                        <button
                          key={gi}
                          onClick={() => {
                            setCurrentIdx(gi);
                            setShowJumpTo(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-blue-50 transition-colors ${
                            isActive ? 'bg-blue-50 font-medium' : ''
                          }`}
                        >
                          <span className="truncate pr-2">{r.rating}</span>
                          <span className="flex items-center gap-1.5 flex-shrink-0">
                            {touched && (
                              <span className="font-bold" style={{ color: getScoreColor(a.score) }}>
                                {a.score.toFixed(1)}
                              </span>
                            )}
                            {touched ? (
                              <span className="w-2 h-2 rounded-full bg-green-400" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-gray-300" />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-1 text-xs text-gray-400">
          {progressPercent}% answered &middot; {touchedCount} of {total} items
        </div>
      </div>

      {/* Main Card — one item at a time */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Card header */}
        <div className="px-5 pt-5 pb-3 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h2 className="text-base font-semibold text-gray-800 leading-snug">{item.rating}</h2>
            <span className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${getPriorityStyle(item.priority)}`}>
              {item.priority}
            </span>
          </div>
          <p className="text-xs text-gray-400">
            {CATEGORY_FULL_NAMES[item.category] || item.category}
          </p>
        </div>

        {/* Level description cards — clickable to set score */}
        <div className="px-5 pt-4 pb-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {descriptions.map((d) => {
              const isActive = activeLevel === d.score;
              return (
                <button
                  key={d.score}
                  onClick={() => updateScore(d.score)}
                  className={`text-left border rounded-lg p-3 transition-all cursor-pointer ${d.border} ${
                    isActive ? d.activeBg : `${d.bg} hover:brightness-95`
                  }`}
                >
                  <p className="text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                    {isActive && <span className="w-2 h-2 rounded-full" style={{ background: getScoreColor(d.score) }} />}
                    {d.label}
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed">{d.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Slider + score */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-4">
            {/* Score display */}
            <div className="text-center flex-shrink-0">
              <div
                className="text-3xl font-bold tabular-nums"
                style={{ color: getScoreColor(answer.score) }}
              >
                {answer.score.toFixed(1)}
              </div>
              <div
                className="text-[10px] font-semibold uppercase tracking-wide mt-0.5"
                style={{ color: getScoreColor(answer.score) }}
              >
                {getLevelLabel(answer.score)}
              </div>
            </div>

            {/* Slider */}
            <div className="flex-1">
              <input
                type="range"
                min="1"
                max="4"
                step="0.1"
                value={answer.score}
                onChange={(e) => updateScore(parseFloat(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${getScoreColor(answer.score)} 0%, ${getScoreColor(answer.score)} ${((answer.score - 1) / 3) * 100}%, #e5e7eb ${((answer.score - 1) / 3) * 100}%, #e5e7eb 100%)`,
                }}
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-0.5 px-0.5">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
              </div>
            </div>

            {/* Numeric input */}
            <input
              type="number"
              min="1"
              max="4"
              step="0.1"
              value={answer.score}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v)) updateScore(v);
              }}
              className="w-14 border border-gray-300 rounded-lg px-1 py-1.5 text-center text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none flex-shrink-0"
            />
          </div>
        </div>

        {/* Remarks (toggle to reduce clutter) */}
        <div className="px-5 pb-4">
          {!showRemarks ? (
            <button
              onClick={() => setShowRemarks(true)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              + Add remarks
            </button>
          ) : (
            <textarea
              value={answer.remarks}
              onChange={(e) => updateRemarks(e.target.value)}
              placeholder="Optional notes or context..."
              rows={2}
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          )}
        </div>

        {/* Bottom nav — large touch targets */}
        <div className="flex border-t border-gray-200">
          <button
            onClick={() => {
              if (isFirst) {
                onBack();
              } else {
                goPrev();
              }
            }}
            className="flex-1 py-3.5 text-sm font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors border-r border-gray-200 flex items-center justify-center gap-1"
          >
            <span className="text-lg leading-none">{'\u2190'}</span>
            {isFirst ? 'Back' : 'Prev'}
          </button>

          {isLast ? (
            <button
              onClick={onComplete}
              className="flex-1 py-3.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 active:bg-green-800 transition-colors flex items-center justify-center gap-1"
            >
              View Summary
              <span className="text-lg leading-none">{'\u2192'}</span>
            </button>
          ) : (
            <button
              onClick={goNext}
              className="flex-1 py-3.5 text-sm font-medium text-blue-700 hover:bg-blue-50 active:bg-blue-100 transition-colors flex items-center justify-center gap-1"
            >
              Next
              <span className="text-lg leading-none">{'\u2192'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-[10px] text-gray-300 mt-3">
        Use arrow keys {'\u2190'} {'\u2192'} to navigate
      </p>
    </div>
  );
}
