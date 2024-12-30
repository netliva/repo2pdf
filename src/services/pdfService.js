const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { highlightCode } = require('../utils/highlighter');
const { getFileMetadata } = require('./fileService');
const { getFileHistory } = require('./gitService');
const { updateProgress, updateCurrentFile } = require('../utils/progress');
const i18n = require('../utils/i18n');

// Bellek optimizasyonu için batch boyutu
const BATCH_SIZE = 10;

// Roboto fontunu projeye ekle
const FONTS = {
  normal: path.join(__dirname, '../../assets/fonts/Roboto-Regular.ttf'),
  bold: path.join(__dirname, '../../assets/fonts/Roboto-Bold.ttf'),
  mono: path.join(__dirname, '../../assets/fonts/RobotoMono-Regular.ttf')
};

// Varsayılan renkler
const COLORS = {
  text: '#000000',
  background: '#ffffff'
};

/**
 * PDF dosyası oluşturur
 */
async function createPdf({ files, destination, workingDir, options, readFile }) {
  const totalFiles = files.length;
  let processedFiles = 0;

  const doc = new PDFDocument({
    lang: 'tr-TR',
    size: 'A4',
    margin: 50,
    bufferPages: true,
    autoFirstPage: false,
    info: {
      Title: i18n.t('pdf.title'),
      Author: 'Repo2PDF'
    }
  });

  // Fontları kaydet
  doc.registerFont('Roboto', FONTS.normal);
  doc.registerFont('Roboto-Bold', FONTS.bold);
  doc.registerFont('RobotoMono', FONTS.mono);
  
  // Varsayılan font olarak Roboto kullan
  doc.font('Roboto');

  const stream = fs.createWriteStream(destination);
  doc.pipe(stream);

  // Başlık sayfası
  doc.addPage();
  createTitlePage(doc, workingDir);

  // İçindekiler
  doc.addPage();
  await createTableOfContents(doc, files, workingDir);

  // Git geçmişi
  if (options.gitHistory) {
    doc.addPage();
    await createGitHistory(doc, options.gitHistory);
  }

  // Dosyaları batch'ler halinde işle
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    processedFiles += batch.length;
    updateProgress(processedFiles, totalFiles);
    await processBatch(doc, batch, workingDir, options, readFile);
    
    // Belleği temizle
    doc.flushPages();
  }

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

/**
 * Dosya batch'ini işler
 */
async function processBatch(doc, files, workingDir, options, readFile) {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const relativePath = path.relative(workingDir, file);
    updateCurrentFile(relativePath);
    doc.addPage();
    await createFileSection(doc, file, workingDir, options, readFile);
  }
}

/**
 * Başlık sayfası oluşturur
 */
function createTitlePage(doc, workingDir) {
  doc.font('Roboto-Bold')
     .fontSize(24)
     .fillColor(COLORS.text)
     .text(i18n.t('pdf.title'), { align: 'center' })
     .moveDown(2)
     .font('Roboto')
     .fontSize(16)
     .text(i18n.t('pdf.metadata.source') + ': ' + path.basename(workingDir), { align: 'center' })
     .moveDown()
     .text(i18n.t('pdf.metadata.generated') + ': ' + new Date().toLocaleString(i18n.getCurrentLocale() === 'tr' ? 'tr-TR' : 'en-US'), { align: 'center' });
}

/**
 * İçindekiler sayfası oluşturur
 */
async function createTableOfContents(doc, files, workingDir) {
  doc.fontSize(16)
     .fillColor(COLORS.text)
     .text(i18n.t('pdf.tableOfContents'), { align: 'center' })
     .moveDown();

  for (const file of files) {
    const relativePath = path.relative(workingDir, file);
    doc.fontSize(12)
       .text(relativePath, { link: relativePath, underline: true });
  }
}

/**
 * Git geçmişi sayfası oluşturur
 */
function createGitHistory(doc, history) {
  doc.fontSize(16)
     .fillColor(COLORS.text)
     .text(i18n.t('pdf.gitHistory'), { align: 'center' })
     .moveDown();

  for (const commit of history) {
    doc.fontSize(12)
       .text(i18n.t('pdf.metadata.commit') + ': ' + commit.hash)
       .text(i18n.t('pdf.metadata.date') + ': ' + new Date(commit.date).toLocaleString(i18n.getCurrentLocale() === 'tr' ? 'tr-TR' : 'en-US'))
       .text(i18n.t('pdf.metadata.author') + ': ' + commit.author)
       .text(i18n.t('pdf.metadata.message') + ': ' + commit.message)
       .moveDown();
  }
}

/**
 * Dosya bölümü oluşturur
 */
async function createFileSection(doc, file, workingDir, options, readFile) {
  const relativePath = path.relative(workingDir, file);
  const metadata = await getFileMetadata(file);
  const gitInfo = options.commitInfo ? await getFileHistory(file) : null;

  // Dosya başlığı
  doc.font('Roboto-Bold')
     .fontSize(16)
     .fillColor(COLORS.text)
     .text(relativePath, { align: 'center' })
     .moveDown();

  // Meta bilgiler
  if (options.metadata) {
    doc.font('Roboto')
       .fontSize(10)
       .text(i18n.t('pdf.metadata.size') + ': ' + formatFileSize(metadata.size))
       .text(i18n.t('pdf.metadata.lastModified') + ': ' + metadata.modified.toLocaleString(i18n.getCurrentLocale() === 'tr' ? 'tr-TR' : 'en-US'));
    doc.moveDown();
  }

  // Git bilgileri
  if (options.commitInfo && gitInfo) {
    doc.font('Roboto')
       .fontSize(10)
       .text(i18n.t('pdf.metadata.lastCommit') + ': ' + gitInfo.commitMessage)
       .text(i18n.t('pdf.metadata.author') + ': ' + gitInfo.author);
    doc.moveDown();
  }

  // Dosya içeriği
  const content = await readFile(file);
  const extension = path.extname(file).slice(1);
  const lines = highlightCode(content, extension);

  doc.font('RobotoMono')
     .fontSize(8);



  // Her satırı işle
  lines.forEach((tokens, lineNumber) => {
    // Satır numarası
    if (options.lineNumbers) {
      doc.fillColor(COLORS.text)
         .text(`${lineNumber + 1}. `, { continued: true });
    }
    

    // Satırdaki token'ları yazdır
    tokens.forEach((token, index) => {
        if (token.text.trim()) {
            doc.fillColor(token.fillColor)
            .text(token.text, { continued:true });
        }
    });

    // Satır sonu
    doc.text(' ');
  });
//   doc.addPage();
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
  createPdf
}; 