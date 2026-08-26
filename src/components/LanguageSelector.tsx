/* ── LanguageSelector — Claymorphic Language Switcher ── */

import { Globe } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import type { Language } from '../i18n/translations';
import './LanguageSelector.css';

const LANGUAGES: Array<{ code: Language; label: string; flag: string }> = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'mr', label: 'मराठी', flag: '🚩' },
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
];

export function LanguageSelector({ className = '' }: { className?: string }) {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={`lang-selector clay-card--flat ${className}`}>
      <Globe size={14} className="lang-selector__globe" />
      <div className="lang-selector__buttons">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            type="button"
            className={`lang-selector__btn ${language === lang.code ? 'lang-selector__btn--active' : ''}`}
            onClick={() => setLanguage(lang.code)}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
}
