/**
 * Verilen string'in Git URL'i olup olmadığını kontrol eder
 * @param {string} str - Kontrol edilecek string
 * @returns {boolean}
 */
function isGitUrl(str) {
  const gitUrlPattern = /^(https?:\/\/)?([\w.@:/\-~]+)(\.git)(\/)?$/;
  return gitUrlPattern.test(str);
}

/**
 * Dosya uzantılarını array'e dönüştürür
 * @param {string} extensions - Virgülle ayrılmış uzantılar (örn: "js,py,java")
 * @returns {string[]}
 */
function parseExtensions(extensions) {
  if (!extensions) return null;
  return extensions.split(',').map(ext => ext.trim().toLowerCase());
}

// Varsayılan olarak hariç tutulacak dosya ve klasörler
const DEFAULT_EXCLUDES = [
  // Genel
  /node_modules/,
  /\.git/,
  /\.idea/,
  /\.vscode/,
  /\.DS_Store/,
  /\.env/,
  /package-lock\.json/,
  /yarn\.lock/,
  /pnpm-lock\.yaml/,
  
  // Derleme ve cache
  /dist/,
  /build/,
  /out/,
  /\.cache/,
  /\.next/,
  /\.nuxt/,
  
  // Test ve coverage
  /coverage/,
  /\.nyc_output/,
  /\.pytest_cache/,
  /\.coverage/,
  
  // Medya ve büyük dosyalar
  /\.(jpg|jpeg|png|gif|ico|svg|mp3|mp4|mov|avi|wmv|flv|pdf)$/i,
  

  // IDE ve editör dosyaları
  /\.project/,
  /\.classpath/,
  /\.settings/,
  /\.vs/,
  /\.sublime-/,
  /\.iml$/,
  
  // Log ve geçici dosyalar
  /\.log$/,
  /\.tmp$/,
  /\.temp$/,
  /\.swp$/,
  
  // Diğer
  /\.dockerignore/,
  /\.gitattributes/,
  /\.eslintcache/,
  /\.tsbuildinfo/,
  /thumbs\.db$/i
];

/**
 * Verilen dosya yolunun dahil edilip edilmeyeceğini kontrol eder
 * @param {string} filePath - Dosya yolu
 * @returns {boolean}
 */
function shouldIncludeFile(filePath) {
  // Dosya boyutu kontrolü (10MB üzeri dosyaları hariç tut)
  try {
    const stats = require('fs').statSync(filePath);
    if (stats.size > 10 * 1024 * 1024) {
      return false;
    }
  } catch (error) {
    // Dosya okunamazsa, hariç tut
    return false;
  }

  // Binary dosya kontrolü
  try {
    const buffer = require('fs').readFileSync(filePath, { encoding: null, flag: 'r' });
    const isBinary = buffer.includes(0);
    if (isBinary) {
      return false;
    }
  } catch (error) {
    // Dosya okunamazsa, hariç tut
    return false;
  }

  // Desenlere göre kontrol
  return !DEFAULT_EXCLUDES.some(pattern => pattern.test(filePath));
}

module.exports = {
  isGitUrl,
  parseExtensions,
  shouldIncludeFile
}; 