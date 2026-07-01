import React from 'react';

const LANGUAGES = [
  { value: 'en-US', label: 'English' },
  { value: 'es-ES', label: 'Spanish' },
  { value: 'fr-FR', label: 'French' },
  { value: 'de-DE', label: 'German' },
  { value: 'zh-CN', label: 'Chinese' },
];

export default function LanguageScreen({ language, onLanguageChange, onContinue }) {
  return (
    <div className="language-section">
      <label><strong>Select your language</strong></label><br />
      <select value={language} onChange={(e) => onLanguageChange(e.target.value)}>
        {LANGUAGES.map((lang) => (
          <option key={lang.value} value={lang.value}>{lang.label}</option>
        ))}
      </select>
      <br />
      <button onClick={onContinue}>Continue</button>
    </div>
  );
}
