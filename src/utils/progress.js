const chalk = require('chalk');

let currentFile = '';
let currentProgress = {
  current: 0,
  total: 0,
  percent: 0
};

/**
 * İlerleme çubuğunu günceller
 * @param {string} message - Gösterilecek mesaj
 * @param {number} current - Mevcut değer
 * @param {number} total - Toplam değer
 * @param {boolean} useColor - Renkli çıktı kullanılsın mı
 */
function updateProgress(current, total, useColor = false) {
  currentProgress = {
    current,
    total,
    percent: Math.round((current / total) * 100)
  };
  
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  const output = `İşleniyor: %${currentProgress.percent} (${current}/${total})${currentFile}`;
  process.stdout.write(useColor ? chalk.yellow(output) : output);
}

/**
 * İşlenen dosya bilgisini günceller
 * @param {string} filePath - İşlenen dosya yolu
 */
function updateCurrentFile(filePath) {
  currentProgress.current++;
  currentFile = ` | ${filePath}`;
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  const output = chalk.yellow(`İşleniyor: %${currentProgress.percent} (${currentProgress.current}/${currentProgress.total})`);
  process.stdout.write(output + currentFile);
}

module.exports = {
  updateProgress,
  updateCurrentFile
}; 