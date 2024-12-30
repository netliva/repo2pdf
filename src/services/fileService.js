const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const glob = require('glob');
const chalk = require('chalk');
const { parseExtensions, shouldIncludeFile } = require('../utils/helpers');
const { Transform } = require('stream');
const { promisify } = require('util');
const globAsync = promisify(glob);

// Chunk boyutu (1MB)
const CHUNK_SIZE = 1024 * 1024;

/**
 * .gitignore dosyasını okur ve kuralları parse eder
 * @param {string} dir - Proje dizini
 * @returns {Promise<string[]>} Gitignore kuralları
 */
async function readGitignoreRules(dir) {
  try {
    const gitignorePath = path.join(dir, '.gitignore');
    const content = await fs.readFile(gitignorePath, 'utf8');
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(pattern => {
        // Başındaki slash'ı kaldır
        if (pattern.startsWith('/')) {
          pattern = pattern.slice(1);
        }
        // Sondaki slash'ı kaldır
        if (pattern.endsWith('/')) {
          pattern = pattern.slice(0, -1);
        }
        return pattern;
      });
  } catch (error) {
    console.warn(chalk.yellow('⚠️  .gitignore dosyası bulunamadı veya okunamadı. Varsayılan kurallar kullanılacak.'));
    return [];
  }
}

/**
 * Gitignore kurallarını glob desenlerine dönüştürür
 * @param {string[]} rules - Gitignore kuralları
 * @returns {string[]} Glob desenleri
 */
function convertGitignoreToGlob(rules) {
  return rules.map(rule => {
    // Yıldız işaretini düzelt
    rule = rule.replace(/\*/g, '**');
    
    // Klasör için glob deseni
    if (!path.extname(rule)) {
      return `**/${rule}/**`;
    }
    
    // Dosya için glob deseni
    return `**/${rule}`;
  });
}

/**
 * Dosyaları toplar
 * @param {string} dir - Dizin yolu
 * @param {string} langFilter - Dil filtresi
 * @param {string[]} excludePatterns - Hariç tutulacak desenler
 * @returns {Promise<string[]>} Dosya yolları
 */
async function getFiles(dir, langFilter, excludePatterns = []) {
  try {
    // Gitignore kurallarını oku
    const gitignoreRules = await readGitignoreRules(dir);
    const globExcludes = convertGitignoreToGlob(gitignoreRules);
    
    // Kullanıcı tanımlı desenleri ekle
    if (excludePatterns && excludePatterns.length > 0) {
      globExcludes.push(...excludePatterns.map(p => `**/${p}`));
    }

    // Dil filtresi varsa, sadece belirtilen uzantıları dahil et
    const extensions = parseExtensions(langFilter);
    const includePattern = extensions ? `**/*.{${extensions.join(',')}}` : '**/*.*';

    // Glob seçenekleri
    const globOptions = {
      cwd: dir,
      absolute: true,
      ignore: globExcludes,
      nodir: true,
      follow: false, // Sembolik linkleri takip etme
      dot: false // Gizli dosyaları dahil etme
    };

    // Dosyaları bul
    const files = await globAsync(includePattern, globOptions);

    // Filtreleme işlemini paralel yap
    const filterPromises = files.map(async file => {
      if (await shouldIncludeFileAsync(file)) {
        return file;
      }
      return null;
    });

    const filteredFiles = (await Promise.all(filterPromises))
      .filter(file => file !== null);

    return filteredFiles;
  } catch (error) {
    console.error(chalk.red(`❌ Dosya toplama hatası: ${error.message}`));
    return [];
  }
}

/**
 * Dosyanın dahil edilip edilmeyeceğini asenkron olarak kontrol eder
 * @param {string} filePath - Dosya yolu
 * @returns {Promise<boolean>}
 */
async function shouldIncludeFileAsync(filePath) {
  try {
    const stats = await fs.stat(filePath);
    
    // Boyut kontrolü
    if (stats.size > 10 * 1024 * 1024) {
      return false;
    }

    // Binary kontrolü (ilk 1KB'ı kontrol et)
    const fd = await fs.open(filePath, 'r');
    const buffer = Buffer.alloc(1024);
    const { bytesRead } = await fd.read(buffer, 0, 1024, 0);
    await fd.close();

    if (bytesRead > 0) {
      const isBinary = buffer.slice(0, bytesRead).includes(0);
      if (isBinary) {
        return false;
      }
    }

    return shouldIncludeFile(filePath);
  } catch (error) {
    return false;
  }
}

/**
 * Stream tabanlı dosya okuma işlemi
 * @param {string} filePath - Dosya yolu
 * @param {number} maxSize - Maksimum dosya boyutu
 * @returns {Promise<string>} Dosya içeriği
 */
async function readFileContentStreaming(filePath, maxSize = Infinity) {
  return new Promise((resolve, reject) => {
    const stats = fsSync.statSync(filePath);
    
    if (stats.size > maxSize) {
      resolve(`// Bu dosya boyut sınırını aştığı için içeriği dahil edilmedi.\n// Dosya boyutu: ${formatFileSize(stats.size)}\n// Maksimum izin verilen boyut: ${formatFileSize(maxSize)}`);
      return;
    }

    let content = '';
    const readStream = fsSync.createReadStream(filePath, {
      encoding: 'utf8',
      highWaterMark: CHUNK_SIZE
    });

    readStream.on('data', chunk => {
      content += chunk;
    });

    readStream.on('end', () => {
      resolve(content);
    });

    readStream.on('error', error => {
      reject(error);
    });
  });
}

/**
 * Dosya içeriğini okur
 * @param {string} filePath - Dosya yolu
 * @param {number} maxSize - Maksimum dosya boyutu (byte)
 * @returns {Promise<string>} Dosya içeriği
 */
async function readFileContent(filePath, maxSize = Infinity) {
  try {
    return await readFileContentStreaming(filePath, maxSize);
  } catch (error) {
    console.warn(chalk.yellow(`⚠️  Uyarı: ${path.basename(filePath)} dosyası okunamadı: ${error.message}`));
    return `// Bu dosya okunamadı: ${error.message}`;
  }
}

/**
 * Dosya meta bilgilerini alır
 * @param {string} filePath - Dosya yolu
 * @returns {Promise<Object>} Dosya meta bilgileri
 */
async function getFileMetadata(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      relativePath: path.relative(process.cwd(), filePath)
    };
  } catch (error) {
    return {
      size: 0,
      created: new Date(),
      modified: new Date(),
      relativePath: path.relative(process.cwd(), filePath),
      error: error.message
    };
  }
}

/**
 * Dosya boyutunu formatlar
 */
function formatFileSize(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Byte';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

module.exports = {
  getFiles,
  readFileContent,
  getFileMetadata,
  formatFileSize
}; 