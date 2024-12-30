module.exports = {
  cli: {
    description: 'A tool to convert source code from Git repositories or local directories to PDF format',
    arguments: {
      source: 'Git repo URL or local directory path',
      output: 'Output PDF file path'
    },
    options: {
      theme: 'PDF theme (light/dark)',
      langFilter: 'File extensions to include (e.g. js,py,java)',
      lineNumbers: 'Show line numbers',
      gitHistory: 'Include Git commit history',
      metadata: 'Show file metadata (size and last modified date)',
      commitInfo: 'Show file commit info (last commit and author)',
      exclude: 'Patterns to exclude (comma separated)',
      maxSize: 'Maximum file size (KB)',
      progress: 'Show progress indicator',
      language: 'Interface language (en/tr)'
    },
    messages: {
      starting: '🚀 Starting conversion process...',
      processing: 'Processing: %{percent} ({current}/{total} files)',
      success: '✨ PDF successfully created: {output}',
      error: '❌ Error: {message}',
      languageChanged: '🌐 Interface language changed to: {language}',
      languageNotSupported: '⚠️ Language {language} is not supported. Using English as default.'
    }
  },
  progress: {
    processing: '📄 Processing file'
  },
  pdf: {
    title: 'Code Documentation',
    tableOfContents: 'Table of Contents',
    gitHistory: 'Git Commit History',
    metadata: {
      source: 'Source',
      generated: 'Generated Date',
      size: 'Size',
      lastModified: 'Last Modified',
      lastCommit: 'Last Commit',
      author: 'Author',
      commit: 'Commit',
      date: 'Date',
      message: 'Message'
    },
    minifiedContent: '⚠️ This file contains minified content. Syntax highlighting has been skipped for readability.'
  }
}; 