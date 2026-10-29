import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from './locales';

const savedLang = localStorage.getItem('smartcomply_lang') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;
