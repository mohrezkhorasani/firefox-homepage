import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Calculator, Delete, RotateCcw, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

// Format numbers with comma separator (e.g. 1,000,000 or -5,000.25)
function formatNumberWithCommas(val) {
  if (!val || val === 'Error') return val;
  const str = String(val);
  const parts = str.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

// Format numbers inside expressions with comma separator for readable display
function formatExpression(expression) {
  if (!expression) return '';
  return expression.replace(/\d+(\.\d+)?/g, (match) => formatNumberWithCommas(match));
}

export default function MiniCalculatorWidget() {
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [isMinimized, setIsMinimized] = useState(() => {
    try {
      return localStorage.getItem('homepage_calculator_minimized') === 'true';
    } catch {
      return false;
    }
  });

  const widgetRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem('homepage_calculator_minimized', String(isMinimized));
    } catch {
      // Ignore storage errors
    }
  }, [isMinimized]);

  // Safe arithmetic evaluator supporting negative numbers, decimals, parentheses, and operations (+, -, *, /)
  const calculateResult = useCallback((expression) => {
    if (!expression) return '';
    let clean = expression.replace(/\s+/g, '');
    clean = clean.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');

    // Only allow digits, standard math operators, parentheses, and decimal point
    if (!/^[-+*/.()0-9]+$/.test(clean)) {
      return 'Error';
    }

    // Avoid evaluation if ending with incomplete operator
    if (/[-+*/.]$/.test(clean)) {
      clean = clean.replace(/[-+*/.]+$/, '');
    }
    if (!clean) return '';

    try {
      // Using Function constructor strictly with validated arithmetic expression
      const evalFn = new Function(`return (${clean})`);
      const val = evalFn();
      if (typeof val !== 'number' || !isFinite(val)) {
        return 'Error';
      }
      // Round floating point inaccuracies up to 8 decimal places
      return Number(val.toFixed(8)).toString();
    } catch {
      return 'Error';
    }
  }, []);

  const handleInput = useCallback((char) => {
    setExpr((prev) => {
      // If user inputs an operator and previous was empty or error, handle smartly
      if (['+', '*', '/'].includes(char) && !prev) {
        return '';
      }
      if (char === '-' && !prev) {
        return '-';
      }

      // Avoid double operators like '++' or '*/' but allow negative numbers like '5*-2' or '10/-5'
      if (['+', '*', '/'].includes(char)) {
        if (/[-+*/]$/.test(prev)) {
          // If previous was an operator, replace it unless preceded by valid operator with minus
          return prev.replace(/[-+*/]+$/, char);
        }
      } else if (char === '-') {
        if (/--$/.test(prev)) {
          return prev;
        }
      }

      return prev + char;
    });
  }, []);

  const handleBackspace = useCallback(() => {
    setExpr((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setExpr('');
    setResult('');
  }, []);

  const handleEquals = useCallback(() => {
    if (!expr) return;
    const res = calculateResult(expr);
    if (res && res !== 'Error') {
      setResult(res);
      setExpr(res);
    } else {
      setResult('Error');
    }
  }, [expr, calculateResult]);

  // Keyboard handler when widget is active/focused or hovered
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Do not capture if user is typing in another input/textarea outside calculator
      const activeEl = document.activeElement;
      const isInsideCalculator = widgetRef.current && widgetRef.current.contains(activeEl);
      const isTypingElsewhere =
        activeEl &&
        ['INPUT', 'TEXTAREA'].includes(activeEl.tagName) &&
        !isInsideCalculator;

      if (isTypingElsewhere) return;

      // When calculator is open and either focused or hovered
      const key = e.key;

      if (key >= '0' && key <= '9') {
        e.preventDefault();
        handleInput(key);
      } else if (key === '+' || key === '-') {
        e.preventDefault();
        handleInput(key);
      } else if (key === '*' || key === 'x' || key === 'X') {
        e.preventDefault();
        handleInput('*');
      } else if (key === '/') {
        e.preventDefault();
        handleInput('/');
      } else if (key === '.') {
        e.preventDefault();
        handleInput('.');
      } else if (key === '(' || key === ')') {
        e.preventDefault();
        handleInput(key);
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (key === 'Escape' || key === 'c' || key === 'C') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInput, handleEquals, handleBackspace, handleClear]);

  const handleCopy = () => {
    const val = result || expr;
    if (!val || val === 'Error') return;
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const previewResult = expr ? calculateResult(expr) : '';

  const buttons = [
    { label: 'C', action: handleClear, type: 'clear', span: 1 },
    { label: '(', action: () => handleInput('('), type: 'op' },
    { label: ')', action: () => handleInput(')'), type: 'op' },
    { label: '÷', action: () => handleInput('/'), type: 'op' },

    { label: '7', action: () => handleInput('7'), type: 'num' },
    { label: '8', action: () => handleInput('8'), type: 'num' },
    { label: '9', action: () => handleInput('9'), type: 'num' },
    { label: '×', action: () => handleInput('*'), type: 'op' },

    { label: '4', action: () => handleInput('4'), type: 'num' },
    { label: '5', action: () => handleInput('5'), type: 'num' },
    { label: '6', action: () => handleInput('6'), type: 'num' },
    { label: '−', action: () => handleInput('-'), type: 'op' },

    { label: '1', action: () => handleInput('1'), type: 'num' },
    { label: '2', action: () => handleInput('2'), type: 'num' },
    { label: '3', action: () => handleInput('3'), type: 'num' },
    { label: '+', action: () => handleInput('+'), type: 'op' },

    { label: '0', action: () => handleInput('0'), type: 'num' },
    { label: '.', action: () => handleInput('.'), type: 'num' },
    { label: '⌫', action: handleBackspace, type: 'action' },
    { label: '=', action: handleEquals, type: 'equals' },
  ];

  return (
    <div
      ref={widgetRef}
      className="w-full glass p-3 rounded-2xl border border-white/20 shadow-2xl flex flex-col gap-2 select-none text-shadow animate-fadeIn transition-all"
      dir="rtl"
      tabIndex={0}
      title="ماشین حساب (پشتیبانی کامل از کیبورد: اعداد، *، /، +، -، Enter)"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2 px-1">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Calculator className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>ماشین حساب</span>
            <span className="text-[10px] font-normal px-1.5 py-0.2 rounded-full bg-white/10 text-gray-300">
              سریع
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-1">
          {(expr || result) && (
            <button
              onClick={handleCopy}
              className="p-1 rounded-lg text-gray-400 hover:text-emerald-300 hover:bg-white/10 transition"
              title="کپی نتیجه"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          )}

          <button
            onClick={handleClear}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
            title="پاک کردن (C / Esc)"
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          <button
            onClick={() => setIsMinimized((prev) => !prev)}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
            title={isMinimized ? 'باز کردن ماشین حساب' : 'کوچک کردن'}
          >
            {isMinimized ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Screen Display */}
      <div className="bg-black/50 border border-white/10 rounded-xl p-2.5 flex flex-col items-end justify-center min-h-[50px] overflow-hidden">
        <div className="text-[11px] font-mono text-gray-400 h-4 truncate w-full text-left" dir="ltr">
          {formatExpression(expr) || '0'}
        </div>
        <div className="flex items-baseline justify-between w-full mt-0.5">
          <span className="text-[9px] text-gray-500 font-mono" dir="ltr">
            {previewResult && previewResult !== 'Error' && previewResult !== expr
              ? `= ${formatNumberWithCommas(previewResult)}`
              : ''}
          </span>
          <span
            className={`text-base font-bold font-mono truncate max-w-[200px] text-left ${
              (result || previewResult) === 'Error' ? 'text-rose-400' : 'text-emerald-400'
            }`}
            dir="ltr"
          >
            {result
              ? formatNumberWithCommas(result)
              : previewResult
              ? formatNumberWithCommas(previewResult)
              : expr
              ? ''
              : '0'}
          </span>
        </div>
      </div>

      {/* Keypad (Shown unless minimized) */}
      {!isMinimized && (
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          {buttons.map((btn, idx) => {
            let styleClass = 'bg-white/5 hover:bg-white/15 text-gray-200 border-white/5';

            if (btn.type === 'op') {
              styleClass = 'bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-300 border-cyan-500/30 font-bold';
            } else if (btn.type === 'equals') {
              styleClass =
                'bg-emerald-600/50 hover:bg-emerald-600/75 text-emerald-100 border-emerald-400/40 font-bold shadow-[0_0_8px_rgba(16,185,129,0.3)]';
            } else if (btn.type === 'clear') {
              styleClass = 'bg-rose-500/20 hover:bg-rose-500/35 text-rose-300 border-rose-500/30 font-bold';
            } else if (btn.type === 'action') {
              styleClass = 'bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border-amber-500/30';
            }

            return (
              <button
                key={idx}
                onClick={btn.action}
                className={`py-2 px-1 rounded-lg border text-xs font-mono transition-all active:scale-95 flex items-center justify-center ${styleClass}`}
              >
                {btn.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
