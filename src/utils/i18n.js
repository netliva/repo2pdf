const en = require('../locales/en');
const tr = require('../locales/tr');
const chalk = require('chalk');

// Bilinen dosya uzantıları ve dil modülleri için hata yönetimi
const knownIssues = {
  languageModules: {
    ttf: 'Font dosyası',
    eot: 'Font dosyası',
    woff: 'Font dosyası',
    woff2: 'Font dosyası',
    png: 'Görsel dosyası',
    jpg: 'Görsel dosyası',
    jpeg: 'Görsel dosyası',
    gif: 'Görsel dosyası',
    svg: 'Vektör dosyası',
    ico: 'İkon dosyası'
  }
};

// Orijinal console.error fonksiyonunu sakla
const originalConsoleError = console.error;

// console.error'ı geçersiz kıl
console.error = function(...args) {
  const errorMessage = args.join(' ');
  
  // Dil modülü hatalarını kontrol et
  if (errorMessage.includes('Could not find the language')) {
    const extension = errorMessage.match(/'([^']+)'/)?.[1];
    
    if (extension && knownIssues.languageModules[extension]) {
      // Bu bir bilinen dosya türü, sessizce yoksay
      return;
    }
    
    // Bilinmeyen bir dil modülü hatası ise, daha açıklayıcı bir mesaj göster
    console.log(chalk.yellow(`\n  ⚠️  ${knownIssues.languageModules[extension] || 'Dosya'} işlenirken dil modülü atlandı: ${extension}`));
    return;
  }

  // Diğer hataları normal şekilde göster
  originalConsoleError.apply(console, args);
};

const locales = {
  en,
  tr
};

let currentLocale = 'en';

/**
 * Dil çevirisi için yardımcı fonksiyonlar
 */
const i18n = {
  /**
   * Aktif dili ayarlar
   * @param {string} locale - Dil kodu (en/tr)
   */
  setLocale(locale) {
    if (locales[locale]) {
      currentLocale = locale;
      // Dil değiştiğinde bilgilendirme mesajı göster
      console.log(chalk.blue(this.t('cli.messages.languageChanged', { language: locale })));
    } else {
      console.warn(chalk.yellow(this.t('cli.messages.languageNotSupported', { language: locale })));
    }
  },

  /**
   * Verilen anahtara göre çeviriyi döndürür
   * @param {string} key - Çeviri anahtarı (örn: "pdf.title")
   * @param {Object} params - Değiştirilecek parametreler
   * @returns {string} Çevrilmiş metin
   */
  t(key, params = {}) {
    const keys = key.split('.');
    let value = locales[currentLocale];
    
    for (const k of keys) {
      value = value?.[k];
      if (!value) break;
    }

    if (!value) return key;

    return value.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key] || match;
    });
  },

  /**
   * Aktif dili döndürür
   * @returns {string} Aktif dil kodu
   */
  getCurrentLocale() {
    return currentLocale;
  }
};

module.exports = i18n; 