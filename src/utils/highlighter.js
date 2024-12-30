const hljs = require('highlight.js');

/**
 * Kod içeriğini syntax highlighting ile renklendirir
 * @param {string} code - Kaynak kod
 * @param {string} language - Programlama dili
 * @returns {string} HTML formatında renklendirilmiş kod
 */
function highlightCode(code, language) {
  try {
    if (language) {
      return hljs.highlight(code, { language }).value;
    }
    return hljs.highlightAuto(code).value;
  } catch (error) {
    // Highlighting başarısız olursa orijinal kodu döndür
    return code;
  }
}

/**
 * Dil için uygun tema renklerini döndürür
 * @param {string} theme - Tema adı (açık/koyu)
 * @returns {Object} Tema renkleri
 */
function getThemeColors(theme = 'açık') {
  const themes = {
    açık: {
      background: '#ffffff',
      text: '#000000',
      comment: '#808080',
      keyword: '#0000ff',
      string: '#008000',
      number: '#ff0000'
    },
    koyu: {
      background: '#1e1e1e',
      text: '#d4d4d4',
      comment: '#6a9955',
      keyword: '#569cd6',
      string: '#ce9178',
      number: '#b5cea8'
    }
  };

  return themes[theme] || themes.açık;
}

module.exports = {
  highlightCode,
  getThemeColors
}; 