const { createPdf } = require('./services/pdfService');
const { cloneRepo, getGitHistory } = require('./services/gitService');
const { getFiles, readFileContent } = require('./services/fileService');
const { highlightCode } = require('./utils/highlighter');
const { isGitUrl } = require('./utils/helpers');
const path = require('path');
const os = require('os');

// Paralel işleme için worker sayısı
const WORKER_COUNT = os.cpus().length;

// Bellek yönetimi için grup boyutu
const GROUP_SIZE = 50;

async function convertToPdf(source, destination, options = {}) {
  try {
    // Geçici dizin oluştur
    const tempDir = path.join(os.tmpdir(), `repo2pdf-${Date.now()}`);
    
    // Kaynak bir Git URL'i ise, repoyu klonla
    const workingDir = isGitUrl(source) 
      ? await cloneRepo(source, tempDir)
      : source;

    // Dosyaları topla
    const files = await getFiles(workingDir, options.dilFiltresi, options.haricTutulanlar);
    const totalFiles = files.length;

    if (totalFiles === 0) {
      throw new Error('İşlenecek dosya bulunamadı. Filtreleri kontrol edin.');
    }

    let processedFiles = 0;

    // Git geçmişini paralel olarak al
    const gitHistoryPromise = options.gitGecmisi ? getGitHistory(workingDir) : Promise.resolve(null);

    // Dosyaları gruplara böl
    const fileGroups = [];
    for (let i = 0; i < files.length; i += GROUP_SIZE) {
      fileGroups.push(files.slice(i, i + GROUP_SIZE));
    }

    // PDF oluştur
    await createPdf({
      files,
      destination,
      workingDir,
      options: {
        ...options,
        gitHistory: await gitHistoryPromise
      },
      readFile: async (filePath) => {
        const content = await readFileContent(filePath, options.maxBoyut);
        processedFiles++;
        
        // Bellek temizliği için global nesneyi zorla
        if (processedFiles % GROUP_SIZE === 0) {
          global.gc && global.gc();
        }
        return content;

        //   return highlightCode(content, path.extname(filePath).slice(1));
      }
    });

  } catch (error) {
    throw new Error(`PDF dönüştürme hatası: ${error.message}`);
  }
}

module.exports = {
  convertToPdf
}; 