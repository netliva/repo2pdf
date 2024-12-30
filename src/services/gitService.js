const simpleGit = require('simple-git');
const fs = require('fs').promises;
const path = require('path');

/**
 * Git reposunu belirtilen dizine klonlar
 * @param {string} repoUrl - Git repo URL'i
 * @param {string} targetDir - Hedef dizin
 * @returns {Promise<string>} Klonlanan dizinin yolu
 */
async function cloneRepo(repoUrl, targetDir) {
  try {
    await fs.mkdir(targetDir, { recursive: true });
    await simpleGit().clone(repoUrl, targetDir);
    return targetDir;
  } catch (error) {
    throw new Error(`Git klonlama hatası: ${error.message}`);
  }
}

/**
 * Git commit geçmişini alır
 * @param {string} repoPath - Repo dizini
 * @returns {Promise<Array>} Commit listesi
 */
async function getGitHistory(repoPath) {
  try {
    const git = simpleGit(repoPath);
    const log = await git.log();
    return log.all.map(commit => ({
      hash: commit.hash,
      date: commit.date,
      message: commit.message,
      author: commit.author_name
    }));
  } catch (error) {
    throw new Error(`Git geçmişi alınamadı: ${error.message}`);
  }
}

/**
 * Dosyanın son değişiklik bilgilerini alır
 * @param {string} filePath - Dosya yolu
 * @returns {Promise<Object>} Değişiklik bilgileri
 */
async function getFileHistory(filePath) {
  try {
    const git = simpleGit(path.dirname(filePath));
    const log = await git.log({ file: path.basename(filePath), maxCount: 1 });
    
    if (log.all.length === 0) {
      return null;
    }

    const lastCommit = log.all[0];
    return {
      lastModified: lastCommit.date,
      author: lastCommit.author_name,
      commitMessage: lastCommit.message
    };
  } catch (error) {
    return null;
  }
}

module.exports = {
  cloneRepo,
  getGitHistory,
  getFileHistory
}; 