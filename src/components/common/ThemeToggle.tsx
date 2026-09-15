import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react';

interface ThemeToggleProps {
  showLabel?: boolean;
  variant?: 'button' | 'dropdown' | 'compact' | 'pill';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  showLabel = false,
  variant = 'compact',
  className = '',
}) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Variant: Segmented Pill Switch (Clear White vs Black indicators)
  if (variant === 'pill') {
    return (
      <div 
        className={`inline-flex items-center p-1 rounded-2xl liquid-glass-pill transition-all ${className}`}
        role="group"
        aria-label="Theme mode selector"
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all duration-200 ${
            resolvedTheme === 'light'
              ? 'bg-white text-slate-900 shadow-sm shadow-slate-300/40 border border-slate-200/90'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
          }`}
          title="Switch to Light Mode (Pure White)"
        >
          <Sun className={`w-3.5 h-3.5 ${resolvedTheme === 'light' ? 'text-amber-500' : ''}`} />
          <span>Light</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all duration-200 ${
            resolvedTheme === 'dark'
              ? 'bg-black text-white shadow-md shadow-black/80 border border-white/20'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
          }`}
          title="Switch to Dark Mode (Pure Black)"
        >
          <Moon className={`w-3.5 h-3.5 ${resolvedTheme === 'dark' ? 'text-indigo-400' : ''}`} />
          <span>Dark</span>
        </button>
      </div>
    );
  }

  // Variant: Standard Action Button
  if (variant === 'button') {
    return (
      <button
        onClick={toggleTheme}
        type="button"
        title={`Current: ${resolvedTheme} mode. Click for ${resolvedTheme === 'dark' ? 'Light (White)' : 'Dark (Black)'} mode.`}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all liquid-glass hover:scale-102 active:scale-98 ${
          resolvedTheme === 'dark'
            ? 'text-amber-300 hover:text-amber-200'
            : 'text-slate-700 hover:text-slate-900'
        } ${className}`}
        aria-label="Toggle color theme"
      >
        {resolvedTheme === 'dark' ? (
          <Sun className="w-4 h-4 text-amber-400" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-600" />
        )}
        {showLabel && (
          <span>{resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        )}
      </button>
    );
  }

  // Variant: Dropdown Menu with System Option
  if (variant === 'dropdown') {
    return (
      <div className={`relative inline-block ${className}`} ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold liquid-glass text-slate-700 dark:text-slate-100 hover:opacity-90 transition-all focus:outline-hidden"
          aria-label="Select theme"
        >
          {theme === 'system' ? (
            <Monitor className="w-3.5 h-3.5 text-blue-500" />
          ) : resolvedTheme === 'dark' ? (
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          )}
          <span className="capitalize">{theme === 'system' ? 'System' : theme}</span>
          <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-36 rounded-2xl liquid-glass py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 shadow-2xl">
            <button
              onClick={() => {
                setTheme('light');
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-left transition-colors ${
                theme === 'light'
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-white/10'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Light (White)</span>
            </button>
            <button
              onClick={() => {
                setTheme('dark');
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-left transition-colors ${
                theme === 'dark'
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-white/10'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Dark (Black)</span>
            </button>
            <button
              onClick={() => {
                setTheme('system');
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-left transition-colors ${
                theme === 'system'
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-white/10'
              }`}
            >
              <Monitor className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>System Auto</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Default 'compact' single-click tactile liquid-glass toggle
  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={`Current: ${resolvedTheme} mode. Click to switch to ${resolvedTheme === 'dark' ? 'Light (Pure White)' : 'Dark (Pure Black)'}.`}
      className={`p-2 rounded-2xl liquid-glass hover:scale-105 active:scale-95 text-slate-700 dark:text-slate-100 transition-all focus:outline-hidden ${className}`}
      aria-label="Toggle theme"
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-indigo-600 transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  );
};
