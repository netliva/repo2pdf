const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { getThemeColors, highlightCode } = require('../utils/highlighter');
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

/**
 * PDF dosyası oluşturur
 */
async function createPdf({ files, destination, workingDir, options, readFile }) {
  const totalFiles = files.length;
  let processedFiles = 0;

  const doc = new PDFDocument({
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

  // Tema renklerini al
  const colors = getThemeColors(options.theme);

  // Başlık sayfası
  doc.addPage();
  createTitlePage(doc, workingDir, colors);

  // İçindekiler
  doc.addPage();
  await createTableOfContents(doc, files, workingDir, colors);

  // Git geçmişi
  if (options.gitHistory) {
    doc.addPage();
    await createGitHistory(doc, options.gitHistory, colors);
  }

  // Dosyaları batch'ler halinde işle
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    processedFiles += batch.length;
    updateProgress(processedFiles, totalFiles);
    await processBatch(doc, batch, workingDir, colors, options, readFile);
    
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
async function processBatch(doc, files, workingDir, colors, options, readFile) {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const relativePath = path.relative(workingDir, file);
    updateCurrentFile(relativePath);
    doc.addPage();
    await createFileSection(doc, file, workingDir, colors, options, readFile);
  }
}

/**
 * Başlık sayfası oluşturur
 */
function createTitlePage(doc, workingDir, colors) {
  doc.font('Roboto-Bold')
     .fontSize(24)
     .fillColor(colors.text)
     .text(i18n.t('pdf.title'), { align: 'center' })
     .moveDown(2)
     .font('Roboto')
     .fontSize(16)
     .text(i18n.t('pdf.metadata.source') + ': ' + path.basename(workingDir), { align: 'center' })
     .moveDown()
     .text(i18n.t('pdf.metadata.generated') + ': ' + new Date().toLocaleString(i18n.getCurrentLocale() === 'tr' ? 'tr-TR' : 'en-US'), { align: 'center' })
     .addPage();
}

/**
 * İçindekiler sayfası oluşturur
 */
async function createTableOfContents(doc, files, workingDir, colors) {
  doc.fontSize(16)
     .fillColor(colors.text)
     .text(i18n.t('pdf.tableOfContents'), { align: 'center' })
     .moveDown();

  for (const file of files) {
    const relativePath = path.relative(workingDir, file);
    doc.fontSize(12)
       .text(relativePath, { link: relativePath, underline: true });
  }

  doc.addPage();
}

/**
 * Git geçmişi sayfası oluşturur
 */
function createGitHistory(doc, history, colors) {
  doc.fontSize(16)
     .fillColor(colors.text)
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

  doc.addPage();
}

/**
 * Dosya bölümü oluşturur
 */
async function createFileSection(doc, file, workingDir, colors, options, readFile) {
  const relativePath = path.relative(workingDir, file);
  const metadata = await getFileMetadata(file);
  const gitInfo = options.commitInfo ? await getFileHistory(file) : null;

  // Dosya başlığı
  doc.font('Roboto-Bold')
     .fontSize(16)
     .fillColor(colors.text)
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
  doc.font('RobotoMono')
     .fontSize(8)
     .fillColor(colors.text);

  // İçeriği satırlara böl
  const lines = content.split('\n');
  
  // Satırları işle ve yazdır
  lines.forEach((line, index) => {
    if (options.lineNumbers) {
      doc.text(`${index + 1}. ${line}`);
    } else {
      doc.text(line);
    }
  });

  doc.addPage();
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