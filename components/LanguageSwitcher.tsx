import React from 'react';
import { useAppContext } from '../context/AppContext';

export const LanguageSwitcher: React.FC = () => {
    const { language, setLanguage, t } = useAppContext();

    const switchLanguage = (lang: 'en' | 'ar') => {
        setLanguage(lang);
    };

    return (
        <div className="flex items-center space-x-2" aria-label={t('languageSwitcher.label')}>
            <button
                onClick={() => switchLanguage('en')}
                className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${language === 'en' ? 'bg-primary text-white' : 'bg-gray-200 text-text-main hover:bg-gray-300'}`}
                aria-pressed={language === 'en'}
            >
                EN
            </button>
            <button
                onClick={() => switchLanguage('ar')}
                className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${language === 'ar' ? 'bg-primary text-white' : 'bg-gray-200 text-text-main hover:bg-gray-300'}`}
                aria-pressed={language === 'ar'}
            >
                AR
            </button>
        </div>
    );
};

export default LanguageSwitcher;
